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
 * Stream an Excel workbook to the response.
 */
export async function sendExcel(res, { filename, sheetName, columns, rows }) {
  const wb = new ExcelJS.Workbook();
  wb.creator = 'Business Sarthi';
  const ws = wb.addWorksheet(sheetName || 'Report', {
    views: [{ state: 'frozen', ySplit: 2 }],
  });

  // 1. Add Report Title Row
  const title = (sheetName || 'Business Report').toUpperCase();
  ws.addRow([title]);
  ws.mergeCells(1, 1, 1, columns.length);
  const titleRow = ws.getRow(1);
  titleRow.height = 30;
  titleRow.getCell(1).font = { size: 16, bold: true, color: { argb: 'FFFFFFFF' } };
  titleRow.getCell(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E293B' } };
  titleRow.getCell(1).alignment = { vertical: 'middle', horizontal: 'center' };

  // 2. Setup Columns & Headers
  ws.columns = columns.map(c => ({
    header: c.header.toUpperCase(),
    key: c.key,
    width: c.width || 15
  }));

  const headerRow = ws.getRow(2);
  headerRow.height = 25;
  headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
  headerRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF2563EB' } };
  headerRow.alignment = { vertical: 'middle', horizontal: 'center' };

  // 3. Add Data Rows
  rows.forEach((r, idx) => {
    const row = ws.addRow(r);
    // Alternate row colors
    if (idx % 2 === 0) {
      row.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF8FAFC' } };
    }
    row.height = 20;
    row.alignment = { vertical: 'middle' };
  });

  // 4. Style all cells
  ws.eachRow((row, rowNumber) => {
    if (rowNumber > 1) {
      row.eachCell((cell) => {
        cell.border = {
          top: { style: 'thin', color: { argb: 'FFE2E8F0' } },
          left: { style: 'thin', color: { argb: 'FFE2E8F0' } },
          bottom: { style: 'thin', color: { argb: 'FFE2E8F0' } },
          right: { style: 'thin', color: { argb: 'FFE2E8F0' } }
        };
      });
    }
  });

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
