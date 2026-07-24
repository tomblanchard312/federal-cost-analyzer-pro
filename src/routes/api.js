'use strict';

const express = require('express');
const opm = require('../services/opmService');
const gsa = require('../services/gsaService');
const catalog = require('../services/catalogService');
const calc = require('../services/calcService');
const exporter = require('../services/exportService');

const router = express.Router();

// Wrap async handlers so rejected promises become JSON errors.
function wrap(fn) {
  return (req, res) => {
    Promise.resolve(fn(req, res)).catch((err) => {
      console.error(`[api] ${req.method} ${req.path} failed:`, err.message);
      if (!res.headersSent) {
        res.status(400).json({ success: false, error: err.message });
      }
    });
  };
}

// --- Health & provenance ---------------------------------------------------

router.get('/health', (req, res) => {
  res.json({ success: true, status: 'ok', ready: opm.ready() });
});

router.get('/data-sources', (req, res) => {
  res.json({ success: true, data: { opm: opm.meta(), gsa: gsa.meta() } });
});

// --- Personnel & pay (real OPM data) ---------------------------------------

router.get('/gs-grades', (req, res) => {
  res.json({ success: true, data: opm.getGrades() });
});

router.get('/locality-areas', (req, res) => {
  res.json({ success: true, data: opm.getLocalityAreas() });
});

// README alias
router.get('/locality-rates', (req, res) => {
  res.json({ success: true, data: opm.getLocalityAreas() });
});

router.get('/special-rates', (req, res) => {
  res.json({
    success: true,
    data: [],
    note: 'Special rate tables are OPM-specific supplements not included in this demonstration build.'
  });
});

// Individual personnel cost calculation
router.post(
  '/calculate',
  wrap((req, res) => {
    const { grade, step, locality, hours } = req.body || {};
    const result = opm.computeSalary(grade, step, locality, hours);
    res.json({ success: true, data: result });
  })
);

// --- Catalogs --------------------------------------------------------------

router.get('/event-types', (req, res) => {
  res.json({ success: true, data: catalog.getEventTypes() });
});

router.get('/equipment', (req, res) => {
  res.json({ success: true, data: catalog.getEquipment() });
});
router.get('/equipment-catalog', (req, res) => {
  res.json({ success: true, data: catalog.getEquipment() });
});

router.get('/supplies', (req, res) => {
  res.json({ success: true, data: catalog.getSupplies() });
});
router.get('/supplies-catalog', (req, res) => {
  res.json({ success: true, data: catalog.getSupplies() });
});

router.get('/chargeback-categories', (req, res) => {
  res.json({ success: true, data: catalog.getChargebackCategories() });
});

router.get('/job-series', (req, res) => {
  res.json({ success: true, data: catalog.getJobSeries() });
});

// --- GSA travel ------------------------------------------------------------

router.get('/airfare-routes', (req, res) => {
  res.json({ success: true, data: gsa.getAirfareRoutes() });
});
router.get('/gsa-airfare-rates', (req, res) => {
  res.json({ success: true, data: gsa.getAirfareRoutes() });
});

router.get('/gsa-pov-mileage-rates', (req, res) => {
  res.json({ success: true, data: gsa.getPovRates() });
});

router.get(
  '/gsa-per-diem-rates',
  wrap(async (req, res) => {
    const location = req.query.location;
    const rate = await gsa.getPerDiem(location);
    res.json({ success: true, data: rate });
  })
);

// --- Calculations ----------------------------------------------------------

router.post(
  '/calculate-event',
  wrap((req, res) => {
    const data = calc.calculateEvent(req.body || {});
    res.json({ success: true, data });
  })
);

router.post(
  '/calculate-travel-costs',
  wrap(async (req, res) => {
    const data = await calc.calculateTravel(req.body || {});
    res.json({ success: true, data });
  })
);

router.post(
  '/calculate-pov-mileage',
  wrap((req, res) => {
    const { vehicleType, miles } = req.body || {};
    const data = gsa.calculatePovMileage(vehicleType, miles);
    res.json({ success: true, data });
  })
);

router.post(
  '/generate-chargeback',
  wrap((req, res) => {
    const data = calc.generateChargeback(req.body || {});
    res.json({ success: true, data });
  })
);

router.post(
  '/generate-invoice',
  wrap((req, res) => {
    const data = calc.generateInvoice(req.body || {});
    res.json({ success: true, data });
  })
);

// --- Exports ---------------------------------------------------------------

router.post(
  '/export-invoice-excel',
  wrap(async (req, res) => {
    const invoice = (req.body && req.body.invoiceData) || req.body;
    if (!invoice || !invoice.invoiceNumber) {
      throw new Error('invoiceData with an invoiceNumber is required');
    }
    const buffer = await exporter.invoiceToExcel(invoice);
    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );
    res.setHeader('Content-Disposition', `attachment; filename="invoice-${invoice.invoiceNumber}.xlsx"`);
    res.send(buffer);
  })
);

router.post(
  '/export-invoice-pdf',
  wrap(async (req, res) => {
    const invoice = (req.body && req.body.invoiceData) || req.body;
    if (!invoice || !invoice.invoiceNumber) {
      throw new Error('invoiceData with an invoiceNumber is required');
    }
    const buffer = await exporter.invoiceToPdf(invoice);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="invoice-${invoice.invoiceNumber}.pdf"`);
    res.send(buffer);
  })
);

module.exports = router;
