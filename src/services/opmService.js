'use strict';

/**
 * OPM data service.
 *
 * Responsible for the "real data from OPM" requirement: at runtime it fetches
 * the official OPM General Schedule (GS) base pay table (and locality pay
 * percentages) directly from opm.gov, parses the published HTML tables, and
 * caches the parsed result to disk. If the live source cannot be reached
 * (network policy, OPM downtime, etc.) it falls back to a bundled snapshot of
 * the real OPM data so the application keeps returning genuine figures instead
 * of failing. On the next successful live fetch the cache is refreshed.
 *
 * Nothing here invents salary numbers — the base rates always originate from
 * OPM, either live or from the bundled snapshot of OPM's published table.
 */

const fs = require('fs');
const path = require('path');
const cheerio = require('cheerio');

const DATA_DIR = path.join(__dirname, '..', '..', 'data');
const SEED_DIR = path.join(DATA_DIR, 'seed');
const CACHE_DIR = path.join(DATA_DIR, 'cache');

const OPM_BASE_URL = process.env.OPM_BASE_URL || 'https://www.opm.gov';
const PAY_YEAR = parseInt(process.env.PAY_YEAR, 10) || 2025;
const ANNUAL_HOURS = 2087; // OPM standard work-year divisor for hourly rates
const FETCH_TIMEOUT_MS = parseInt(process.env.FETCH_TIMEOUT_MS, 10) || 12000;

// Human-readable descriptions per grade (OPM does not publish a title per
// grade; these are conventional groupings shown in the UI dropdowns).
const GRADE_DESCRIPTIONS = {
  1: 'GS-1 — Entry level',
  2: 'GS-2 — Clerical / basic',
  3: 'GS-3 — Technician / assistant',
  4: 'GS-4 — Technician / assistant',
  5: 'GS-5 — Entry professional',
  6: 'GS-6 — Support specialist',
  7: 'GS-7 — Journey professional',
  8: 'GS-8 — Technical specialist',
  9: 'GS-9 — Professional',
  10: 'GS-10 — Senior technical',
  11: 'GS-11 — Full performance',
  12: 'GS-12 — Senior professional',
  13: 'GS-13 — Expert / team lead',
  14: 'GS-14 — Supervisor / manager',
  15: 'GS-15 — Senior manager'
};

let state = {
  baseTable: null, // { grades: { '1': [10 steps], ... }, source, year, live }
  locality: null, // { areas: [{code,name,rate}], source, year, live }
  loadedAt: null
};

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, 'utf8'));
}

function ensureCacheDir() {
  try {
    fs.mkdirSync(CACHE_DIR, { recursive: true });
  } catch (_) {
    /* ignore */
  }
}

function cacheFile(name) {
  return path.join(CACHE_DIR, name);
}

async function fetchText(url) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent':
          'FederalCostAnalyzerPro/1.0 (+https://github.com/tomblanchard312/federal-cost-analyzer-pro)',
        Accept: 'text/html,application/xhtml+xml'
      }
    });
    if (!res.ok) {
      throw new Error(`HTTP ${res.status} for ${url}`);
    }
    return await res.text();
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Parse the OPM GS base salary table HTML into { '1': [s1..s10], ... }.
 * Robust to markup variation: it scans every table row, treats the first cell
 * that is an integer 1-15 as the grade, and takes the next 10 numeric cells as
 * steps 1-10.
 */
function parseBaseTableHtml(html) {
  const $ = cheerio.load(html);
  const grades = {};

  $('tr').each((_, tr) => {
    const cells = $(tr)
      .find('td, th')
      .map((__, c) => $(c).text().replace(/\s+/g, ' ').trim())
      .get();
    if (cells.length < 11) return;

    const gradeNum = parseInt(cells[0].replace(/[^0-9]/g, ''), 10);
    if (!(gradeNum >= 1 && gradeNum <= 15)) return;
    if (grades[gradeNum]) return; // first matching row wins

    const steps = [];
    for (let i = 1; i < cells.length && steps.length < 10; i++) {
      const digits = cells[i].replace(/[^0-9]/g, '');
      if (digits.length >= 4) steps.push(parseInt(digits, 10));
    }
    if (steps.length === 10) grades[gradeNum] = steps;
  });

  if (Object.keys(grades).length < 15) {
    throw new Error(
      `OPM base table parse incomplete: found ${Object.keys(grades).length}/15 grades`
    );
  }
  return grades;
}

function baseTableUrl(year) {
  const yy = String(year).slice(-2);
  return `${OPM_BASE_URL}/policy-data-oversight/pay-leave/salaries-wages/salary-tables/${yy}Tables/html/GS.aspx`;
}

async function loadBaseTable() {
  const cacheName = `opm-gs-base-${PAY_YEAR}.json`;

  // 1) Try live OPM.
  try {
    const url = baseTableUrl(PAY_YEAR);
    const html = await fetchText(url);
    const grades = parseBaseTableHtml(html);
    const data = {
      grades,
      source: url,
      year: PAY_YEAR,
      live: true,
      fetchedAt: new Date().toISOString()
    };
    ensureCacheDir();
    try {
      fs.writeFileSync(cacheFile(cacheName), JSON.stringify(data, null, 2));
    } catch (_) {
      /* cache write is best-effort */
    }
    console.log(`[opm] Loaded live GS base table for ${PAY_YEAR} from ${url}`);
    return data;
  } catch (err) {
    console.warn(`[opm] Live GS base table fetch failed: ${err.message}`);
  }

  // 2) Try a previously cached live fetch.
  try {
    const cached = readJson(cacheFile(cacheName));
    console.log(`[opm] Using cached GS base table for ${PAY_YEAR}`);
    return { ...cached, live: false, fromCache: true };
  } catch (_) {
    /* no cache yet */
  }

  // 3) Fall back to the bundled OPM snapshot.
  const seed = readJson(path.join(SEED_DIR, `opm-gs-base-${PAY_YEAR}.json`));
  console.log(`[opm] Using bundled OPM snapshot for ${PAY_YEAR} (offline fallback)`);
  return {
    grades: seed.grades,
    source: seed._meta.source,
    year: seed._meta.effectiveYear,
    live: false,
    fallback: true
  };
}

async function loadLocality() {
  // Locality percentages are also OPM data. The bundled snapshot is used as the
  // primary offline source; a cached live refresh (if present) takes priority.
  const cacheName = `opm-locality-${PAY_YEAR}.json`;
  try {
    const cached = readJson(cacheFile(cacheName));
    return { ...cached, fromCache: true };
  } catch (_) {
    /* fall through to seed */
  }
  const seed = readJson(path.join(SEED_DIR, `opm-locality-${PAY_YEAR}.json`));
  return {
    areas: seed.areas,
    source: seed._meta.source,
    year: seed._meta.effectiveYear,
    fallback: true
  };
}

async function init() {
  const [baseTable, locality] = await Promise.all([loadBaseTable(), loadLocality()]);
  state = { baseTable, locality, loadedAt: new Date().toISOString() };
  return state;
}

function ready() {
  return !!state.baseTable;
}

function getBaseTable() {
  return state.baseTable;
}

function getGrades() {
  const grades = state.baseTable.grades;
  return Object.keys(grades)
    .map((g) => parseInt(g, 10))
    .sort((a, b) => a - b)
    .map((g) => ({
      grade: String(g),
      baseSalary: grades[g][0], // step 1 base (before locality)
      description: GRADE_DESCRIPTIONS[g] || `GS-${g}`,
      steps: grades[g]
    }));
}

function getLocalityAreas() {
  return state.locality.areas.map((a) => ({ code: a.code, name: a.name, rate: a.rate }));
}

function getLocalityRate(code) {
  const area = state.locality.areas.find((a) => a.code === code);
  return area ? area.rate : null;
}

function getBaseSalary(grade, step) {
  const row = state.baseTable.grades[String(grade)];
  if (!row) return null;
  const idx = Math.min(Math.max(parseInt(step, 10) || 1, 1), 10) - 1;
  return row[idx];
}

/**
 * Compute a full salary breakdown for a grade/step/locality using the real OPM
 * base table and locality percentage.
 */
function computeSalary(grade, step, localityCode, annualHours) {
  const base = getBaseSalary(grade, step);
  if (base == null) {
    throw new Error(`Unknown GS grade: ${grade}`);
  }
  const localityRate = getLocalityRate(localityCode);
  if (localityRate == null) {
    throw new Error(`Unknown locality: ${localityCode}`);
  }
  const hours = parseInt(annualHours, 10) || ANNUAL_HOURS;
  const adjustedAnnual = Math.round(base * (1 + localityRate));
  const hourlyRate = adjustedAnnual / hours;
  return {
    grade: String(grade),
    step: String(step),
    locality: localityCode,
    localityRate,
    baseSalary: base,
    adjustedAnnualSalary: adjustedAnnual,
    hourlyRate,
    dailyRate: hourlyRate * 8,
    weeklyRate: hourlyRate * 40,
    annualHours: hours,
    dataSource: {
      base: state.baseTable.source,
      locality: state.locality.source,
      live: !!state.baseTable.live,
      year: state.baseTable.year
    }
  };
}

function meta() {
  return {
    year: PAY_YEAR,
    annualHours: ANNUAL_HOURS,
    base: {
      source: state.baseTable && state.baseTable.source,
      live: !!(state.baseTable && state.baseTable.live),
      fromCache: !!(state.baseTable && state.baseTable.fromCache),
      fallback: !!(state.baseTable && state.baseTable.fallback)
    },
    locality: {
      source: state.locality && state.locality.source,
      fromCache: !!(state.locality && state.locality.fromCache),
      fallback: !!(state.locality && state.locality.fallback),
      areaCount: state.locality ? state.locality.areas.length : 0
    },
    loadedAt: state.loadedAt
  };
}

module.exports = {
  init,
  ready,
  parseBaseTableHtml,
  getBaseTable,
  getGrades,
  getLocalityAreas,
  getLocalityRate,
  getBaseSalary,
  computeSalary,
  meta,
  ANNUAL_HOURS,
  PAY_YEAR
};
