'use strict';

/**
 * Federal Cost Analyzer Pro — application server.
 *
 * Serves the static frontend and a JSON API. Personnel pay rates are sourced
 * from the real OPM General Schedule tables (fetched and parsed at runtime by
 * opmService); travel rates come from GSA. See README.md for configuration.
 *
 * NOTE: This is a demonstration application. It is NOT an official U.S.
 * Government system. Do not enter classified information, PII, or sensitive
 * government data.
 */

require('dotenv').config();

const path = require('path');
const express = require('express');
const cors = require('cors');

const opm = require('./src/services/opmService');
const apiRouter = require('./src/routes/api');

const app = express();
const PORT = parseInt(process.env.PORT, 10) || 3001;

app.use(cors());
app.use(express.json({ limit: '2mb' }));

// API routes
app.use('/api', apiRouter);

// Static frontend (served from public/)
const PUBLIC_DIR = path.join(__dirname, 'public');
app.use(express.static(PUBLIC_DIR));

app.get('/', (req, res) => {
  res.sendFile(path.join(PUBLIC_DIR, 'index.html'));
});

// 404 for unknown API paths (avoid returning HTML for /api/*)
app.use('/api', (req, res) => {
  res.status(404).json({ success: false, error: `Unknown API endpoint: ${req.path}` });
});

async function start() {
  console.log('[server] Initializing OPM data (this fetches live OPM tables if reachable)...');
  try {
    await opm.init();
  } catch (err) {
    console.error('[server] OPM init error:', err.message);
    // opmService.init falls back to bundled data, so this should be rare.
  }
  const m = opm.meta();
  console.log(
    `[server] Pay data ready for ${m.year} — base source: ${m.base.source} ` +
      `(live=${m.base.live}, cache=${m.base.fromCache}, fallback=${m.base.fallback})`
  );

  app.listen(PORT, () => {
    console.log(`[server] Federal Cost Analyzer Pro listening on http://localhost:${PORT}`);
  });
}

start();

module.exports = app;
