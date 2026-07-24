'use strict';

/**
 * GSA data service: per diem (lodging + M&IE), POV mileage, and City Pair
 * airfare.
 *
 * Per diem uses the official GSA Per Diem API (https://open.gsa.gov/api/perdiem/)
 * when a GSA_API_KEY is configured. Requests are of the form
 *   GET https://api.gsa.gov/travel/perdiem/v2/rates/city/{city}/state/{ST}/year/{yyyy}
 * with the key supplied via the X-API-KEY header. When no key is set, or the
 * live call fails, a bundled snapshot of GSA rates (including the standard
 * CONUS rate) is used instead.
 *
 * POV mileage rates and City Pair airfare are served from bundled GSA-published
 * reference data.
 */

const fs = require('fs');
const path = require('path');

const CATALOG_DIR = path.join(__dirname, '..', '..', 'data', 'catalogs');

const GSA_API_BASE =
  process.env.GSA_API_BASE || 'https://api.gsa.gov/travel/perdiem/v2';
const GSA_API_KEY = process.env.GSA_API_KEY || '';
const FISCAL_YEAR = parseInt(process.env.GSA_FISCAL_YEAR, 10) || 2025;
const FETCH_TIMEOUT_MS = parseInt(process.env.FETCH_TIMEOUT_MS, 10) || 12000;

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, 'utf8'));
}

const perDiemData = readJson(path.join(CATALOG_DIR, 'per-diem.json'));
const povData = readJson(path.join(CATALOG_DIR, 'pov-mileage.json'));
const airfareData = readJson(path.join(CATALOG_DIR, 'airfare-routes.json'));

// ---- Per diem -------------------------------------------------------------

function fallbackPerDiem(location) {
  if (location) {
    const needle = String(location).toLowerCase().trim();
    const match = perDiemData.locations.find(
      (l) =>
        l.location.toLowerCase() === needle ||
        needle.includes(l.location.toLowerCase().split(',')[0])
    );
    if (match) {
      return {
        location: match.location,
        lodging: match.lodging,
        mie: match.mie,
        source: 'bundled-gsa-snapshot'
      };
    }
  }
  const c = perDiemData.standardConus;
  return {
    location: location || c.location,
    lodging: c.lodging,
    mie: c.mie,
    standardConus: true,
    source: 'bundled-gsa-snapshot'
  };
}

async function fetchLivePerDiem(city, stateCode) {
  const url = `${GSA_API_BASE}/rates/city/${encodeURIComponent(
    city
  )}/state/${encodeURIComponent(stateCode)}/year/${FISCAL_YEAR}`;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: { 'X-API-KEY': GSA_API_KEY, Accept: 'application/json' }
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const json = await res.json();
    // GSA v2 shape: { rates: [ { rate: [ { months:{...}, meals, city, ... } ] } ] }
    const rate = json && json.rates && json.rates[0] && json.rates[0].rate && json.rates[0].rate[0];
    if (!rate) throw new Error('unexpected GSA response shape');
    const months = rate.months && rate.months.month ? rate.months.month : [];
    const maxLodging = months.length
      ? Math.max(...months.map((m) => Number(m.value) || 0))
      : Number(rate.months && rate.months.value) || 0;
    return {
      location: `${rate.city || city}, ${rate.state || stateCode}`,
      lodging: maxLodging,
      mie: Number(rate.meals) || 0,
      source: 'gsa-api-live'
    };
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Resolve a per diem rate for a location string. Attempts the live GSA API when
 * a key is configured and the location parses as "City, ST"; otherwise uses the
 * bundled snapshot.
 */
async function getPerDiem(location) {
  const parsed = /^\s*(.+?),\s*([A-Za-z]{2})\s*$/.exec(location || '');
  if (GSA_API_KEY && parsed) {
    try {
      return await fetchLivePerDiem(parsed[1], parsed[2].toUpperCase());
    } catch (err) {
      console.warn(`[gsa] Live per diem fetch failed (${err.message}); using fallback`);
    }
  }
  return fallbackPerDiem(location);
}

// ---- POV mileage ----------------------------------------------------------

function getPovRates() {
  return povData.rates;
}

function calculatePovMileage(vehicleType, miles) {
  const key = String(vehicleType || 'AUTOMOBILE').toUpperCase();
  const rateInfo = povData.rates[key] || povData.rates.AUTOMOBILE;
  const m = Number(miles) || 0;
  const ratePerMile = rateInfo.ratePerMile;
  return {
    vehicleType: key,
    label: rateInfo.label,
    miles: m,
    ratePerMile,
    totalCost: Math.round(m * ratePerMile * 100) / 100,
    source: povData._meta.source,
    effectiveYear: povData._meta.effectiveYear
  };
}

// ---- Airfare (City Pair) --------------------------------------------------

function getAirfareRoutes() {
  return airfareData.routes;
}

function lookupFare(origin, destination) {
  if (!origin || !destination) return null;
  const o = origin.toLowerCase();
  const d = destination.toLowerCase();
  const route = airfareData.routes.find(
    (r) =>
      (r.origin.toLowerCase() === o && r.destination.toLowerCase() === d) ||
      (r.origin.toLowerCase() === d && r.destination.toLowerCase() === o)
  );
  return route ? route.oneWayFare : null;
}

function calculateAirfare({ origin, destination, tripType = 'ROUND_TRIP', travelers = 1 }) {
  const oneWay = lookupFare(origin, destination);
  const legs = String(tripType).toUpperCase() === 'ONE_WAY' ? 1 : 2;
  const pax = Number(travelers) || 1;
  if (oneWay == null) {
    return { available: false, origin, destination, tripType, travelers: pax, cost: 0 };
  }
  return {
    available: true,
    origin,
    destination,
    tripType,
    travelers: pax,
    oneWayFare: oneWay,
    cost: Math.round(oneWay * legs * pax * 100) / 100
  };
}

function meta() {
  return {
    perDiem: {
      fiscalYear: FISCAL_YEAR,
      liveApi: !!GSA_API_KEY,
      source: perDiemData._meta.source
    },
    povMileage: { source: povData._meta.source, effectiveYear: povData._meta.effectiveYear },
    airfare: { source: airfareData._meta.source, routeCount: airfareData.routes.length }
  };
}

module.exports = {
  getPerDiem,
  getPovRates,
  calculatePovMileage,
  getAirfareRoutes,
  calculateAirfare,
  meta
};
