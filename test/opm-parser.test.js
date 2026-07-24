'use strict';

const { test } = require('node:test');
const assert = require('node:assert');
const opm = require('../src/services/opmService');

// A synthetic table that mirrors the structure of OPM's published GS.aspx:
// a header row (Grade, Step 1..10) followed by one row per grade whose first
// cell is the grade number and whose next 10 cells are the step salaries
// formatted with "$" and thousands separators.
function buildOpmLikeHtml() {
  const grades = {};
  let rows = '<tr><th>Grade</th>';
  for (let s = 1; s <= 10; s++) rows += `<th>Step ${s}</th>`;
  rows += '</tr>';

  for (let g = 1; g <= 15; g++) {
    const step1 = 20000 + g * 5000;
    const wgi = 500 + g * 50;
    const steps = [];
    let row = `<tr><td>${g}</td>`;
    for (let s = 0; s < 10; s++) {
      const val = step1 + s * wgi;
      steps.push(val);
      row += `<td>$${val.toLocaleString('en-US')}</td>`;
    }
    row += '</tr>';
    rows += row;
    grades[g] = steps;
  }
  return { html: `<html><body><table>${rows}</table></body></html>`, expected: grades };
}

test('parseBaseTableHtml extracts 15 grades x 10 steps from OPM-shaped HTML', () => {
  const { html, expected } = buildOpmLikeHtml();
  const parsed = opm.parseBaseTableHtml(html);
  assert.strictEqual(Object.keys(parsed).length, 15);
  for (let g = 1; g <= 15; g++) {
    assert.deepStrictEqual(parsed[g], expected[g], `grade ${g} steps should match`);
  }
});

test('parseBaseTableHtml ignores non-salary rows and stray tables', () => {
  const { expected } = buildOpmLikeHtml();
  // Add a caption row and a footnote row that must be ignored.
  let rows = '<tr><td>Effective January 2025</td></tr>';
  rows += '<tr><th>Grade</th>';
  for (let s = 1; s <= 10; s++) rows += `<th>Step ${s}</th>`;
  rows += '</tr>';
  for (let g = 1; g <= 15; g++) {
    let row = `<tr><td>${g}</td>`;
    expected[g].forEach((v) => (row += `<td>$${v.toLocaleString('en-US')}</td>`));
    rows += row + '</tr>';
  }
  rows += '<tr><td>Rates limited by EX-IV cap</td></tr>';
  const parsed = opm.parseBaseTableHtml(`<table>${rows}</table>`);
  assert.strictEqual(Object.keys(parsed).length, 15);
  assert.deepStrictEqual(parsed[15], expected[15]);
});

test('parseBaseTableHtml throws when the table is incomplete', () => {
  assert.throws(
    () => opm.parseBaseTableHtml('<table><tr><td>1</td><td>$100</td></tr></table>'),
    /parse incomplete/
  );
});
