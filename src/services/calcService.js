'use strict';

/**
 * Cost calculation engine: event costs, chargeback allocation, travel costs,
 * and invoice generation. Personnel rates come from the real OPM base table via
 * opmService; equipment/supplies pricing from the catalogs; travel rates from
 * gsaService.
 */

const opm = require('./opmService');
const gsa = require('./gsaService');
const catalog = require('./catalogService');

function round2(n) {
  return Math.round((Number(n) || 0) * 100) / 100;
}

function hoursToDays(hours) {
  return Math.max(1, Math.ceil((Number(hours) || 0) / 8));
}

/**
 * Core event cost calculation. Returns per-category totals plus a chargeback
 * breakdown and summary, matching what the Event Planner UI renders.
 */
function calculateEvent(eventData) {
  const duration = Number(eventData.duration) || 8;
  const locality = eventData.locality;

  // --- Personnel ---
  let totalPersonnelCost = 0;
  let personnelCount = 0;
  let hourlyRateSum = 0;
  (eventData.personnel || []).forEach((p) => {
    const count = Number(p.count) || 1;
    const hours = Number(p.hours) || duration;
    const salary = opm.computeSalary(p.grade, p.step || 1, locality, opm.ANNUAL_HOURS);
    const lineCost = salary.hourlyRate * hours * count;
    totalPersonnelCost += lineCost;
    personnelCount += count;
    hourlyRateSum += salary.hourlyRate * count;
  });
  const averageHourlyRate = personnelCount > 0 ? hourlyRateSum / personnelCount : 0;

  // --- Equipment ---
  let totalEquipmentCost = 0;
  (eventData.equipment || []).forEach((e) => {
    const item = catalog.findEquipment(e.code);
    if (!item) return;
    const count = Number(e.count) || 1;
    const hours = Number(e.hours) || duration;
    totalEquipmentCost += item.hourlyRate * hours * count;
  });

  // --- Supplies ---
  let totalSuppliesCost = 0;
  (eventData.supplies || []).forEach((s) => {
    const item = catalog.findSupply(s.code);
    if (!item) return;
    const quantity = Number(s.quantity) || 1;
    totalSuppliesCost += item.unitPrice * quantity;
  });

  // --- Contractors ---
  let totalContractorCost = 0;
  (eventData.contractors || []).forEach((c) => {
    const count = Number(c.count) || 1;
    const hours = Number(c.hours) || duration;
    const rate = Number(c.rate) || 0;
    totalContractorCost += rate * hours * count;
  });

  // --- Overtime (premium pay on top of the average personnel hourly rate) ---
  let totalOvertimeCost = 0;
  (eventData.overtime || []).forEach((o) => {
    const hours = Number(o.hours) || 0;
    const multiplier = Number(o.multiplier) || 1;
    totalOvertimeCost += averageHourlyRate * multiplier * hours;
  });

  // --- Custom costs ---
  let totalCustomCost = 0;
  (eventData.customCosts || []).forEach((c) => {
    const amount = Number(c.amount) || 0;
    const quantity = Number(c.quantity) || 1;
    switch ((c.type || 'ONE_TIME').toUpperCase()) {
      case 'HOURLY':
        totalCustomCost += amount * duration * quantity;
        break;
      case 'DAILY':
        totalCustomCost += amount * hoursToDays(duration) * quantity;
        break;
      case 'PER_UNIT':
      case 'ONE_TIME':
      default:
        totalCustomCost += amount * quantity;
        break;
    }
  });

  const travelTotal = eventData.travelCosts && Number(eventData.travelCosts.total) ? Number(eventData.travelCosts.total) : 0;

  const totalEventCost =
    totalPersonnelCost +
    totalEquipmentCost +
    totalSuppliesCost +
    totalContractorCost +
    totalOvertimeCost +
    totalCustomCost +
    travelTotal;

  // --- Chargeback breakdown ---
  const categoryTotals = {
    PERSONNEL: totalPersonnelCost,
    EQUIPMENT: totalEquipmentCost,
    SUPPLIES: totalSuppliesCost,
    CONTRACTOR: totalContractorCost,
    OVERTIME: totalOvertimeCost,
    TRAVEL: travelTotal,
    CUSTOM: totalCustomCost
  };

  const chargebackBreakdown = {};
  Object.entries(categoryTotals).forEach(([key, total]) => {
    if (total <= 0) return;
    const cat = catalog.findChargeback(key);
    if (!cat) return;
    chargebackBreakdown[key] = {
      key,
      name: cat.name,
      code: cat.code,
      costCenter: cat.costCenter,
      markup: cat.markup,
      totalCost: round2(total),
      billingAmount: round2(total * (1 + cat.markup))
    };
  });

  return {
    eventName: eventData.eventName,
    eventType: eventData.eventType,
    locality,
    duration,
    totalPersonnelCost: round2(totalPersonnelCost),
    totalEquipmentCost: round2(totalEquipmentCost),
    totalSuppliesCost: round2(totalSuppliesCost),
    totalContractorCost: round2(totalContractorCost),
    totalOvertimeCost: round2(totalOvertimeCost),
    totalCustomCost: round2(totalCustomCost),
    travelCosts: eventData.travelCosts || null,
    totalEventCost: round2(totalEventCost),
    chargebackBreakdown,
    summary: {
      personnelCount,
      averageHourlyRate: round2(averageHourlyRate),
      equipmentCount: (eventData.equipment || []).length,
      suppliesCount: (eventData.supplies || []).length,
      contractorCount: (eventData.contractors || []).length
    },
    dataSource: opm.meta()
  };
}

/**
 * Travel cost calculation using GSA per diem (live or fallback), City Pair
 * airfare, and ad-hoc ground/other costs.
 */
async function calculateTravel(req) {
  const result = { perDiem: null, airfare: null, groundTransportation: null, otherTravelCosts: null, total: 0 };
  let total = 0;

  if (req.perDiem && req.perDiem.location) {
    const days = Number(req.perDiem.days) || 0;
    const rate = await gsa.getPerDiem(req.perDiem.location);
    const includeLodging = req.perDiem.includeLodging !== false;
    const includeMeals = req.perDiem.includeMeals !== false;
    const dailyRate = (includeLodging ? rate.lodging : 0) + (includeMeals ? rate.mie : 0);
    const cost = round2(dailyRate * days);
    result.perDiem = {
      cost,
      details: {
        location: rate.location,
        days,
        dailyRate: round2(dailyRate),
        lodging: rate.lodging,
        mie: rate.mie,
        source: rate.source
      }
    };
    total += cost;
  }

  if (req.airfare && req.airfare.origin && req.airfare.destination) {
    const af = gsa.calculateAirfare(req.airfare);
    result.airfare = {
      cost: round2(af.cost),
      details: {
        origin: af.origin,
        destination: af.destination,
        tripType: af.tripType,
        travelers: af.travelers,
        available: af.available,
        oneWayFare: af.oneWayFare || null
      }
    };
    total += af.cost;
  }

  if (req.groundTransportation) {
    const cost = round2(req.groundTransportation);
    result.groundTransportation = { cost };
    total += cost;
  }

  if (req.otherTravelCosts) {
    const cost = round2(req.otherTravelCosts);
    result.otherTravelCosts = { cost };
    total += cost;
  }

  result.total = round2(total);
  return result;
}

const BILLING_TERMS = {
  NET_15: { label: 'Net 15', days: 15 },
  NET_30: { label: 'Net 30', days: 30 },
  NET_45: { label: 'Net 45', days: 45 },
  NET_60: { label: 'Net 60', days: 60 },
  DUE_ON_RECEIPT: { label: 'Due on Receipt', days: 0 }
};

function generateChargeback(eventData) {
  const calc = calculateEvent(eventData);
  const reportId = `CB-${Date.now().toString(36).toUpperCase()}`;

  let totalBillingAmount = 0;
  const chargebackCategories = {};
  Object.entries(calc.chargebackBreakdown).forEach(([key, entry]) => {
    chargebackCategories[key] = {
      name: entry.name,
      code: entry.code,
      costCenter: entry.costCenter,
      totalCost: entry.totalCost,
      billingAmount: entry.billingAmount
    };
    totalBillingAmount += entry.billingAmount;
  });

  const terms = BILLING_TERMS[eventData.billingTerms] || BILLING_TERMS.NET_30;

  return {
    reportId,
    generatedAt: new Date().toISOString(),
    eventDetails: {
      name: eventData.eventName || 'Unnamed Event',
      billingOrganization: eventData.billingOrganization || 'Government Agency',
      costCenter: eventData.costCenter || 'EVENT_COSTS',
      locality: eventData.locality,
      duration: eventData.duration
    },
    billingSummary: {
      totalBillingAmount: round2(totalBillingAmount),
      billingPeriod: new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long' }),
      paymentTerms: terms.label
    },
    chargebackCategories,
    costSummary: {
      totalCost: calc.totalEventCost,
      totalPersonnelCost: calc.totalPersonnelCost,
      totalEquipmentCost: calc.totalEquipmentCost,
      totalSuppliesCost: calc.totalSuppliesCost,
      totalContractorCost: calc.totalContractorCost,
      totalOvertimeCost: calc.totalOvertimeCost,
      totalCustomCost: calc.totalCustomCost
    }
  };
}

function generateInvoice(invoiceData) {
  const calc = calculateEvent(invoiceData);
  const now = new Date();
  const terms = BILLING_TERMS[invoiceData.billingTerms] || BILLING_TERMS.NET_30;
  const due = new Date(now.getTime() + terms.days * 24 * 60 * 60 * 1000);

  const lineItems = Object.values(calc.chargebackBreakdown).map((c) => ({
    description: c.name,
    costCenter: c.costCenter,
    amount: c.totalCost,
    billed: c.billingAmount
  }));

  const subtotal = round2(
    lineItems.reduce((s, li) => s + li.amount, 0)
  );
  const total = round2(lineItems.reduce((s, li) => s + li.billed, 0));

  const invoiceNumber = `INV-${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${Math.floor(
    Math.random() * 9000 + 1000
  )}`;

  return {
    invoiceNumber,
    date: now.toLocaleDateString('en-US'),
    dueDate: due.toLocaleDateString('en-US'),
    terms: terms.label,
    template: invoiceData.invoiceTemplate || 'GOVERNMENT_STANDARD',
    billingInfo: {
      organization: invoiceData.billingOrganization || 'Government Agency',
      address: invoiceData.billingAddress || '',
      contact: invoiceData.billingContact || '',
      costCenter: invoiceData.costCenter || 'EVENT_COSTS'
    },
    eventDetails: {
      name: invoiceData.eventName || 'Unnamed Event',
      locality: invoiceData.locality,
      duration: invoiceData.duration
    },
    lineItems,
    totals: {
      subtotal,
      total
    },
    notes: invoiceData.invoiceNotes || ''
  };
}

module.exports = {
  calculateEvent,
  calculateTravel,
  generateChargeback,
  generateInvoice
};
