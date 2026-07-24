'use strict';

/**
 * Server-side invoice export to Excel (exceljs) and PDF (pdfkit).
 */

const ExcelJS = require('exceljs');
const PDFDocument = require('pdfkit');

function money(n) {
  return `$${(Number(n) || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

async function invoiceToExcel(invoice) {
  const wb = new ExcelJS.Workbook();
  wb.creator = 'Federal Cost Analyzer Pro';
  wb.created = new Date();
  const ws = wb.addWorksheet('Invoice');

  ws.columns = [
    { header: '', key: 'a', width: 40 },
    { header: '', key: 'b', width: 22 }
  ];

  ws.addRow(['Federal Cost Analyzer Pro — Invoice']).font = { bold: true, size: 14 };
  ws.addRow([]);
  ws.addRow(['Invoice Number', invoice.invoiceNumber]);
  ws.addRow(['Date', invoice.date]);
  ws.addRow(['Due Date', invoice.dueDate]);
  ws.addRow(['Terms', invoice.terms]);
  ws.addRow([]);
  ws.addRow(['Bill To']).font = { bold: true };
  ws.addRow(['Organization', invoice.billingInfo.organization]);
  ws.addRow(['Address', invoice.billingInfo.address]);
  ws.addRow(['Contact', invoice.billingInfo.contact]);
  ws.addRow(['Cost Center', invoice.billingInfo.costCenter]);
  ws.addRow([]);
  ws.addRow(['Event', invoice.eventDetails.name]);
  ws.addRow([]);

  const header = ws.addRow(['Description', 'Cost Center', 'Amount', 'Billed']);
  header.font = { bold: true };
  ws.getColumn(3).width = 16;
  ws.getColumn(4).width = 16;
  invoice.lineItems.forEach((li) => {
    ws.addRow([li.description, li.costCenter, money(li.amount), money(li.billed)]);
  });
  ws.addRow([]);
  ws.addRow(['', '', 'Subtotal', money(invoice.totals.subtotal)]);
  const totalRow = ws.addRow(['', '', 'Total Due', money(invoice.totals.total)]);
  totalRow.font = { bold: true };

  if (invoice.notes) {
    ws.addRow([]);
    ws.addRow(['Notes', invoice.notes]);
  }
  ws.addRow([]);
  ws.addRow(['NOTE: Demonstration application. Not an official U.S. Government invoice.']).font = {
    italic: true,
    color: { argb: 'FF888888' }
  };

  return Buffer.from(await wb.xlsx.writeBuffer());
}

function invoiceToPdf(invoice) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: 'LETTER', margin: 50 });
    const chunks = [];
    doc.on('data', (c) => chunks.push(c));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    doc.fontSize(20).text('Federal Cost Analyzer Pro', { continued: false });
    doc.fontSize(12).fillColor('#666').text('Invoice');
    doc.moveDown();

    doc.fillColor('#000').fontSize(10);
    doc.text(`Invoice Number: ${invoice.invoiceNumber}`);
    doc.text(`Date: ${invoice.date}`);
    doc.text(`Due Date: ${invoice.dueDate}`);
    doc.text(`Terms: ${invoice.terms}`);
    doc.moveDown();

    doc.fontSize(11).text('Bill To', { underline: true });
    doc.fontSize(10);
    doc.text(invoice.billingInfo.organization);
    if (invoice.billingInfo.address) doc.text(invoice.billingInfo.address);
    if (invoice.billingInfo.contact) doc.text(`Attn: ${invoice.billingInfo.contact}`);
    doc.text(`Cost Center: ${invoice.billingInfo.costCenter}`);
    doc.moveDown();

    doc.fontSize(11).text(`Event: ${invoice.eventDetails.name}`);
    doc.moveDown();

    // Line items table
    const startX = 50;
    let y = doc.y;
    doc.fontSize(10).fillColor('#000');
    doc.text('Description', startX, y);
    doc.text('Cost Center', startX + 220, y);
    doc.text('Amount', startX + 340, y);
    doc.text('Billed', startX + 430, y);
    y += 16;
    doc.moveTo(startX, y).lineTo(545, y).stroke('#cccccc');
    y += 6;

    invoice.lineItems.forEach((li) => {
      doc.fillColor('#000').text(li.description, startX, y, { width: 210 });
      doc.text(li.costCenter, startX + 220, y);
      doc.text(money(li.amount), startX + 340, y);
      doc.text(money(li.billed), startX + 430, y);
      y += 18;
    });

    y += 6;
    doc.moveTo(startX, y).lineTo(545, y).stroke('#cccccc');
    y += 8;
    doc.text('Subtotal', startX + 340, y);
    doc.text(money(invoice.totals.subtotal), startX + 430, y);
    y += 16;
    doc.font('Helvetica-Bold');
    doc.text('Total Due', startX + 340, y);
    doc.text(money(invoice.totals.total), startX + 430, y);
    doc.font('Helvetica');

    if (invoice.notes) {
      doc.moveDown(2);
      doc.fontSize(10).text('Notes:', { underline: true });
      doc.text(invoice.notes);
    }

    doc.moveDown(2);
    doc
      .fontSize(8)
      .fillColor('#888')
      .text('Demonstration application. Not an official U.S. Government invoice.', 50, 720, {
        align: 'center',
        width: 495
      });

    doc.end();
  });
}

module.exports = { invoiceToExcel, invoiceToPdf };
