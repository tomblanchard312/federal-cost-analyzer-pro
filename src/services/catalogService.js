'use strict';

/**
 * Loads the application's reference catalogs (equipment, supplies, event types,
 * chargeback categories). These are app-specific reference data with
 * illustrative pricing — not published OPM/GSA feeds — and are served from the
 * data/catalogs directory.
 */

const fs = require('fs');
const path = require('path');

const CATALOG_DIR = path.join(__dirname, '..', '..', 'data', 'catalogs');

function readJson(file) {
  return JSON.parse(fs.readFileSync(path.join(CATALOG_DIR, file), 'utf8'));
}

const equipment = readJson('equipment.json');
const supplies = readJson('supplies.json');
const eventTypes = readJson('event-types.json');
const chargebackCategories = readJson('chargeback-categories.json');
const jobSeries = readJson('job-series.json');

const equipmentByCode = new Map(equipment.items.map((i) => [i.code, i]));
const suppliesByCode = new Map(supplies.items.map((i) => [i.code, i]));
const chargebackByKey = new Map(chargebackCategories.map((c) => [c.key, c]));

function getEquipment() {
  return equipment.items;
}

function getSupplies() {
  return supplies.items;
}

function getEventTypes() {
  return eventTypes;
}

function getChargebackCategories() {
  return chargebackCategories;
}

function getJobSeries() {
  return jobSeries.series;
}

function findEquipment(code) {
  return equipmentByCode.get(code) || null;
}

function findSupply(code) {
  return suppliesByCode.get(code) || null;
}

function findChargeback(key) {
  return chargebackByKey.get(key) || null;
}

module.exports = {
  getEquipment,
  getSupplies,
  getEventTypes,
  getChargebackCategories,
  getJobSeries,
  findEquipment,
  findSupply,
  findChargeback
};
