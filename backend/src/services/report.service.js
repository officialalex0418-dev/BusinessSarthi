import ExcelJS from 'exceljs';
import PDFDocument from 'pdfkit';
import Setting from '../models/Setting.js';

let APP_NAME = 'Business Sarthi';

function imageBuffer(source) {
  if (!source || typeof source !== 'string') return null;
  const match = source.match(/^data:image\/(png|jpeg|jpg|webp);base64,(.+)$/);
  if (!match) return null;
  return Buffer.from(match[2], 'base64');
}

/**
 * Stream a professionally formatted Excel workbook to the response.
 * Follows the "Account Ledger" screenshot style.
 */
export async function sendExcel(res, { filename, sheetName, company, summaryItems = [], columns, rows }) {
  const wb = new ExcelJS.Workbook();
  wb.creator = 'Business Sarthi';
  const ws = wb.addWorksheet(sheetName || 'Report', {
    pageSetup: { paperSize: 9, orientation: 'landscape' }
  });

  // Styles
  const bold = { bold: true };
  const center = { vertical: 'middle', horizontal: 'center' };
  const left = { vertical: 'middle', horizontal: 'left' };
  const right = { vertical: 'middle', horizontal: 'right' };
  const blueFill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD9EAF7' } };
  const greyFill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD9D9D9' } };
  const borderThin = {
    top: { style: 'thin', color: { argb: 'FFCBD5E1' } },
    left: { style: 'thin', color: { argb: 'FFCBD5E1' } },
    bottom: { style: 'thin', color: { argb: 'FFCBD5E1' } },
    right: { style: 'thin', color: { argb: 'FFCBD5E1' } }
  };

  const colCount = columns.length;
  const lastCol = String.fromCharCode(64 + Math.min(colCount, 26));

  // 1. Main Title
  ws.mergeCells(`A1:${lastCol}1`);
  const titleCell = ws.getCell('A1');
  titleCell.value = (sheetName || 'Business Report').toUpperCase();
  titleCell.font = { size: 18, bold: true };
  titleCell.alignment = center;

  // 2. Company Info
  if (company) {
    ws.mergeCells(`A2:${lastCol}2`);
    const compNameCell = ws.getCell('A2');
    compNameCell.value = `Name:${company.name}`;
    compNameCell.font = { size: 16, bold: true };
    compNameCell.alignment = center;
    compNameCell.fill = blueFill;

    ws.mergeCells(`A3:C3`);
    const addrCell = ws.getCell('A3');
    addrCell.value = `Address: ${company.address || '—'}`;
    addrCell.font = bold;
    addrCell.alignment = left;

    if (colCount >= 4) {
      ws.mergeCells(`D3:${lastCol}3`);
      const panCell = ws.getCell('D3');
      panCell.value = `Pan/Vat: ${company.panVat || '—'}`;
      panCell.font = bold;
      panCell.alignment = right;
    }
  }

  // 3. Report Details Section
  let currentRow = 4;
  if (summaryItems.length > 0) {
    ws.mergeCells(`A${currentRow}:${lastCol}${currentRow}`);
    const detailsHeader = ws.getCell(`A${currentRow}`);
    detailsHeader.value = 'REPORT DETAILS';
    detailsHeader.font = bold;
    detailsHeader.alignment = center;
    detailsHeader.fill = greyFill;
    currentRow++;

    summaryItems.forEach(item => {
      const labelCell = ws.getCell(`A${currentRow}`);
      labelCell.value = item.label;
      labelCell.font = bold;
      labelCell.alignment = left;

      ws.mergeCells(`B${currentRow}:${lastCol}${currentRow}`);
      const valueCell = ws.getCell(`B${currentRow}`);
      valueCell.value = item.value;
      valueCell.alignment = right;

      ws.getRow(currentRow).fill = blueFill;
      currentRow++;
    });
  }

  currentRow += 1; // Spacer

  // 4. Table Header
  const tableHeaderRow = currentRow;
  columns.forEach((c, i) => {
    const cell = ws.getCell(tableHeaderRow, i + 1);
    cell.value = c.header.toUpperCase();
    cell.font = bold;
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF3B82F6' } }; // Blue 500
    cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    cell.alignment = center;
    cell.border = borderThin;
  });
  ws.getRow(tableHeaderRow).height = 25;

  // 5. Data Rows
  currentRow++;
  rows.forEach((r, idx) => {
    const row = ws.getRow(currentRow);
    columns.forEach((col, i) => {
      const cell = row.getCell(i + 1);
      cell.value = r[col.key];
      cell.border = borderThin;
      cell.alignment = { vertical: 'middle' };

      if (typeof cell.value === 'number') {
        cell.alignment = right;
        if (cell.value > 1000) cell.numFmt = '#,##0.00';
      }
    });

    if (idx % 2 === 1) {
      row.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF1F5F9' } }; // Slate 100
    }
    row.height = 20;
    currentRow++;
  });

  // 6. Footer
  currentRow += 2;
  const footerStartCol = Math.max(1, colCount - 1);
  ws.mergeCells(currentRow, footerStartCol, currentRow, colCount);
  const poweredBy = ws.getCell(currentRow, footerStartCol);
  poweredBy.value = 'Powered By:';
  poweredBy.alignment = right;
  poweredBy.font = bold;

  currentRow++;
  ws.mergeCells(currentRow, footerStartCol, currentRow, colCount);
  const bsCell = ws.getCell(currentRow, footerStartCol);
  bsCell.value = 'Business Sarthi';
  bsCell.alignment = right;
  bsCell.font = { size: 12, bold: true };

  currentRow++;
  ws.mergeCells(currentRow, footerStartCol, currentRow, colCount);
  const taglineCell = ws.getCell(currentRow, footerStartCol);
  taglineCell.value = 'Driving Business Forward';
  taglineCell.alignment = right;
  taglineCell.font = { size: 9, italic: true };

  // 7. Auto-width adjustment
  columns.forEach((column, i) => {
    let maxLen = 0;
    const col = ws.getColumn(i + 1);
    col.eachCell({ includeEmpty: true }, cell => {
      const len = cell.value ? String(cell.value).length : 0;
      if (len > maxLen) maxLen = len;
    });
    col.width = Math.min(Math.max(columns[i].width || 15, maxLen + 2), 60);
  });

  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}.xlsx"`);
  await wb.xlsx.write(res);
  res.end();
}

/**
 * Professional Account Ledger Excel Export
 * matches the provided "Account Ledger" screenshot.
 */
export async function sendAccountLedgerExcel(res, { filename, company, entity, entries, finalBalance, type = 'DISTRIBUTOR' }) {
  const wb = new ExcelJS.Workbook();
  wb.creator = 'Business Sarthi';
  const ws = wb.addWorksheet('Ledger', {
    pageSetup: { paperSize: 9, orientation: 'portrait' }
  });

  // Styles
  const bold = { bold: true };
  const center = { vertical: 'middle', horizontal: 'center' };
  const left = { vertical: 'middle', horizontal: 'left' };
  const right = { vertical: 'middle', horizontal: 'right' };
  const whiteText = { color: { argb: 'FFFFFFFF' } };
  const greyFill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD9D9D9' } };
  const blueFill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD9EAF7' } };
  const borderThin = {
    top: { style: 'thin' },
    left: { style: 'thin' },
    bottom: { style: 'thin' },
    right: { style: 'thin' }
  };

  // 1. Main Title
  ws.mergeCells('A1:E1');
  const titleCell = ws.getCell('A1');
  titleCell.value = 'ACCOUNT LEDGER';
  titleCell.font = { size: 18, bold: true };
  titleCell.alignment = center;

  // 2. Company Info
  ws.mergeCells('A2:E2');
  const compNameCell = ws.getCell('A2');
  compNameCell.value = `Name:${company.name}`;
  compNameCell.font = { size: 16, bold: true };
  compNameCell.alignment = center;
  compNameCell.fill = blueFill;

  ws.mergeCells('A3:C3');
  const addrCell = ws.getCell('A3');
  addrCell.value = `Address: ${company.address || '—'}`;
  addrCell.font = bold;
  addrCell.alignment = left;

  ws.mergeCells('D3:E3');
  const panCell = ws.getCell('D3');
  panCell.value = `Pan/Vat: ${company.panVat || '—'}`;
  panCell.font = bold;
  panCell.alignment = right;

  // 3. Entity Section Header
  ws.mergeCells('A4:E4');
  const entityHeaderCell = ws.getCell('A4');
  entityHeaderCell.value = `${type} INFORMATION`;
  entityHeaderCell.font = { size: 14, bold: true };
  entityHeaderCell.alignment = center;
  entityHeaderCell.fill = greyFill;

  // 4. Entity Details
  const detailRows = [
    { label: 'Name:', value: entity.name },
    { label: 'Phone:', value: entity.contactNumber || entity.phone || '—' },
    { label: 'Closing Balance:', value: `${company.settings?.currency || 'NPR'} ${finalBalance.toLocaleString()}` },
    { label: 'Pan/Vat:', value: entity.panVat || '—' },
    { label: 'Exported On:', value: new Date().toLocaleString() },
  ];

  detailRows.forEach((row, i) => {
    const rowNum = 5 + i;
    const labelCell = ws.getCell(`A${rowNum}`);
    labelCell.value = row.label;
    labelCell.font = bold;
    labelCell.alignment = left;

    ws.mergeCells(`B${rowNum}:E${rowNum}`);
    const valueCell = ws.getCell(`B${rowNum}`);
    valueCell.value = row.value;
    valueCell.alignment = right;

    ws.getRow(rowNum).fill = blueFill;
  });

  // Spacer
  ws.addRow([]);

  // 5. Table Header
  const tableHeaderRow = 11;
  const headers = ['Date', 'Ref/Type', 'Debit (+)', 'Credit (-)', 'Balance'];
  headers.forEach((h, i) => {
    const cell = ws.getCell(tableHeaderRow, i + 1);
    cell.value = h;
    cell.font = bold;
    cell.alignment = left;
    cell.border = borderThin;
  });

  // 6. Data Rows
  let currentRow = tableHeaderRow + 1;
  entries.forEach(e => {
    const row = ws.getRow(currentRow);
    row.getCell(1).value = e.date instanceof Date ? e.date.toLocaleDateString() : e.date;
    row.getCell(2).value = `${e.type} ${e.ref || ''}`.toUpperCase();
    row.getCell(3).value = e.type === 'INVOICE' || e.type === 'PURCHASE' ? e.amount : '';
    row.getCell(4).value = e.type === 'PAYMENT' ? e.amount : '';
    row.getCell(5).value = e.runningBalance;

    row.eachCell({ includeEmpty: true }, cell => {
      cell.border = borderThin;
      cell.alignment = { vertical: 'middle' };
      if (typeof cell.value === 'number') {
        cell.alignment = right;
      }
    });
    currentRow++;
  });

  // 7. Footer
  currentRow += 2;
  ws.mergeCells(`D${currentRow}:E${currentRow}`);
  const poweredBy = ws.getCell(`D${currentRow}`);
  poweredBy.value = 'Powered By:';
  poweredBy.alignment = right;
  poweredBy.font = bold;

  currentRow++;
  ws.mergeCells(`D${currentRow}:E${currentRow}`);
  const bsCell = ws.getCell(`D${currentRow}`);
  bsCell.value = 'Business Sarthi';
  bsCell.alignment = right;
  bsCell.font = { size: 12, bold: true };

  currentRow++;
  ws.mergeCells(`D${currentRow}:E${currentRow}`);
  const taglineCell = ws.getCell(`D${currentRow}`);
  taglineCell.value = 'Driving Business Forward';
  taglineCell.alignment = right;
  taglineCell.font = { size: 8, italic: true };

  // Adjust Column Widths
  ws.columns = [
    { width: 15 }, // Date
    { width: 35 }, // Ref/Type
    { width: 15 }, // Debit
    { width: 15 }, // Credit
    { width: 15 }, // Balance
  ];

  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}.xlsx"`);
  await wb.xlsx.write(res);
  res.end();
}

/**
 * Stream a simple tabular PDF report.
 * sections: [{ heading, lines: [string] , table?: { headers: [], rows: [[]] } }]
 */
export function sendPdf(res, { filename, title, subtitle, sections = [], company = null }) {
  const doc = new PDFDocument({ margin: 40, size: 'A4' });
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}.pdf"`);
  doc.pipe(res);

  const appLogo = imageBuffer(company?.appLogo);
  const companyLogo = imageBuffer(company?.logo);
  const appName = company?.appName || APP_NAME;

  doc.rect(0, 0, doc.page.width, 88).fill('#2563eb');
  if (appLogo) doc.image(appLogo, 40, 16, { fit: [48, 48] });
  else {
    doc.roundedRect(40, 16, 48, 48, 12).fill('#1d4ed8');
    doc.fill('#ffffff').fontSize(14).font('Helvetica-Bold').text('BS', 40, 31, { width: 48, align: 'center' });
  }
  doc.fill('#ffffff').fontSize(18).font('Helvetica-Bold').text(appName, 96, 24);
  doc.fontSize(9).font('Helvetica').text(new Date().toLocaleString(), 96, 48);

  if (company?.name) {
    if (companyLogo) doc.image(companyLogo, doc.page.width - 92, 16, { fit: [48, 48] });
    else {
      doc.roundedRect(doc.page.width - 92, 16, 48, 48, 10).fill('#1d4ed8');
      doc.fill('#ffffff').fontSize(14).font('Helvetica-Bold').text((company.name || 'C').slice(0, 2).toUpperCase(), doc.page.width - 92, 32, { width: 48, align: 'center' });
    }
    doc.fill('#ffffff').fontSize(10).font('Helvetica-Bold').text(company.name, 168, 24, { align: 'right', width: doc.page.width - 260 });
    const detailLines = [company.email, company.phone, company.address].filter(Boolean);
    doc.fill('#dbeafe').fontSize(8).font('Helvetica').text(detailLines.join(' · '), 168, 42, { align: 'right', width: doc.page.width - 260 });
  }
  doc.moveDown(2);
  doc.fill('#0f172a').fontSize(16).font('Helvetica-Bold').text(title, 40, 90);
  if (subtitle) doc.fontSize(10).fill('#64748b').font('Helvetica').text(subtitle);
  doc.moveDown();

  for (const sec of sections) {
    if (doc.y > doc.page.height - 120) doc.addPage();
    doc.moveDown(0.8);
    if (sec.heading) {
      doc.fontSize(11).fill('#1e40af').font('Helvetica-Bold').text(sec.heading.toUpperCase());
      doc.moveDown(0.2);
      doc.moveTo(40, doc.y).lineTo(150, doc.y).lineWidth(1.5).strokeColor('#3b82f6').stroke();
      doc.moveDown(0.4);
    }
    if (sec.lines) {
      doc.fontSize(10).fill('#334155').font('Helvetica');
      sec.lines.forEach((l) => doc.text(l, { lineGap: 2 }));
    }
    if (sec.table) {
      const { headers, rows } = sec.table;
      const colWidth = (doc.page.width - 80) / headers.length;
      let y = doc.y + 10;

      // header background
      doc.rect(40, y - 4, doc.page.width - 80, 20).fill('#f8fafc');

      // header text
      doc.fontSize(9).font('Helvetica-Bold').fill('#1e293b');
      headers.forEach((h, i) => doc.text(String(h).toUpperCase(), 40 + i * colWidth, y, { width: colWidth - 6 }));

      y = doc.y + 6;
      doc.moveTo(40, y).lineTo(doc.page.width - 40, y).lineWidth(0.5).strokeColor('#cbd5e1').stroke();

      // rows
      doc.font('Helvetica').fill('#334155').fontSize(9);
      for (const row of rows) {
        y = doc.y + 6;
        if (y > doc.page.height - 100) {
          doc.addPage();
          y = 40;
          // Redraw header on new page? (Optional improvement)
        }
        row.forEach((cell, i) =>
          doc.text(String(cell ?? ''), 40 + i * colWidth, y, { width: colWidth - 6 })
        );
        doc.moveDown(0.5);
      }
      doc.moveDown();
    }
  }

  // Footer / Signatories
  if (doc.y > doc.page.height - 100) doc.addPage();
  const footerY = doc.page.height - 80;
  doc.moveTo(40, footerY).lineTo(180, footerY).lineWidth(0.5).strokeColor('#000').stroke();
  doc.moveTo(doc.page.width - 180, footerY).lineTo(doc.page.width - 40, footerY).stroke();

  doc.fontSize(9).fill('#000').font('Helvetica-Bold');
  doc.text('PREPARED BY', 40, footerY + 8, { width: 140, align: 'center' });
  doc.text('AUTHORIZED SIGNATORY', doc.page.width - 180, footerY + 8, { width: 140, align: 'center' });

  doc.fontSize(8).fill('#94a3b8').text('Generated automatically by Business Sarthi ERP System', 0, doc.page.height - 30, { align: 'center', width: doc.page.width });

  doc.end();
}
