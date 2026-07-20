const PDFDocument = require('pdfkit');

/**
 * Draw a simple horizontal rule line across the page.
 */
function drawHRule(doc, y) {
  doc.moveTo(50, y).lineTo(545, y).lineWidth(0.5).strokeColor('#cccccc').stroke();
  doc.lineWidth(1).strokeColor('#000000'); // reset
}

/**
 * Render the common branded header on the current page.
 */
function renderHeader(doc, title) {
  doc
    .rect(0, 0, doc.page.width, 70)
    .fill('#1976d2');

  doc
    .fillColor('#ffffff')
    .fontSize(22)
    .font('Helvetica-Bold')
    .text('CareSync', 50, 18);

  doc
    .fontSize(11)
    .font('Helvetica')
    .text(title, 50, 44);

  doc.fillColor('#000000');
  doc.y = 90;
}

/**
 * Render patient info block.
 */
function renderPatientInfo(doc, user) {
  doc
    .fontSize(12)
    .font('Helvetica-Bold')
    .fillColor('#1976d2')
    .text('Patient Information', 50, doc.y);

  drawHRule(doc, doc.y + 4);
  doc.moveDown(0.8);

  const info = [
    ['Name', user.name || 'N/A'],
    ['Email', user.email || 'N/A'],
    ['Age', user.age || 'N/A'],
    ['Blood Group', user.bloodGroup || 'N/A'],
    ['Allergies', user.allergies || 'None recorded'],
    ['Report Generated', new Date().toLocaleString('en-US')],
  ];

  doc.fontSize(10).font('Helvetica').fillColor('#000000');
  info.forEach(([label, value]) => {
    doc
      .font('Helvetica-Bold')
      .text(`${label}: `, { continued: true })
      .font('Helvetica')
      .text(value);
  });

  doc.moveDown(1);
}

/**
 * Render health metrics section.
 */
function renderHealthMetrics(doc, metrics) {
  doc
    .fontSize(12)
    .font('Helvetica-Bold')
    .fillColor('#1976d2')
    .text('Health Metrics', 50, doc.y);

  drawHRule(doc, doc.y + 4);
  doc.moveDown(0.8);
  doc.fillColor('#000000');

  if (!metrics || metrics.length === 0) {
    doc.fontSize(10).font('Helvetica').text('No health metrics recorded.');
    doc.moveDown(1);
    return;
  }

  // Latest vitals summary box
  const latest = metrics[0];
  doc.fontSize(11).font('Helvetica-Bold').text('Latest Vitals Summary');
  doc.moveDown(0.3);

  const vitals = [
    latest.weight && `Weight: ${latest.weight} kg`,
    latest.systolic && latest.diastolic && `Blood Pressure: ${latest.systolic}/${latest.diastolic} mmHg`,
    latest.heartRate && `Heart Rate: ${latest.heartRate} bpm`,
    latest.temperature && `Temperature: ${latest.temperature}°C`,
    latest.bloodSugar && `Blood Sugar: ${latest.bloodSugar} mg/dL`,
    latest.oxygenSaturation && `Oxygen Saturation: ${latest.oxygenSaturation}%`,
  ].filter(Boolean);

  doc.fontSize(10).font('Helvetica');
  vitals.forEach(v => doc.text(`• ${v}`));
  if (latest.notes) {
    doc.moveDown(0.3).font('Helvetica-Bold').text('Notes: ', { continued: true }).font('Helvetica').text(latest.notes);
  }

  doc.moveDown(0.8);

  // History table
  doc.fontSize(11).font('Helvetica-Bold').text('Metrics History (last 20 entries)');
  doc.moveDown(0.4);

  const cols = { date: 50, weight: 140, bp: 210, hr: 300, temp: 370, sugar: 440, o2: 500 };
  const rowH = 18;
  let ty = doc.y;

  // Table header
  doc.fontSize(8).font('Helvetica-Bold').fillColor('#ffffff');
  doc.rect(50, ty, 495, rowH).fill('#1976d2');
  doc.text('Date', cols.date + 2, ty + 5);
  doc.text('Weight', cols.weight, ty + 5);
  doc.text('BP', cols.bp, ty + 5);
  doc.text('HR', cols.hr, ty + 5);
  doc.text('Temp', cols.temp, ty + 5);
  doc.text('Sugar', cols.sugar, ty + 5);
  doc.text('O₂%', cols.o2, ty + 5);
  ty += rowH;

  doc.font('Helvetica').fillColor('#000000');
  const rows = metrics.slice(0, 20);
  rows.forEach((m, i) => {
    if (ty > 740) { doc.addPage(); renderHeader(doc, 'Health Report — Metrics (continued)'); ty = doc.y; }
    if (i % 2 === 0) doc.rect(50, ty, 495, rowH).fill('#f0f4ff');
    doc.fillColor('#000000').fontSize(8);
    doc.text(new Date(m.recordedAt).toLocaleDateString('en-US'), cols.date + 2, ty + 5);
    doc.text(m.weight ? `${m.weight}` : '—', cols.weight, ty + 5);
    doc.text(m.systolic && m.diastolic ? `${m.systolic}/${m.diastolic}` : '—', cols.bp, ty + 5);
    doc.text(m.heartRate ? `${m.heartRate}` : '—', cols.hr, ty + 5);
    doc.text(m.temperature ? `${m.temperature}` : '—', cols.temp, ty + 5);
    doc.text(m.bloodSugar ? `${m.bloodSugar}` : '—', cols.sugar, ty + 5);
    doc.text(m.oxygenSaturation ? `${m.oxygenSaturation}` : '—', cols.o2, ty + 5);
    ty += rowH;
  });

  doc.y = ty;
  doc.moveDown(1);
}

/**
 * Render medicines section.
 */
function renderMedicines(doc, medicines) {
  if (doc.y > 680) { doc.addPage(); renderHeader(doc, 'Health Report — Medicines'); }

  doc
    .fontSize(12)
    .font('Helvetica-Bold')
    .fillColor('#1976d2')
    .text('Medicine Schedule', 50, doc.y);

  drawHRule(doc, doc.y + 4);
  doc.moveDown(0.8);
  doc.fillColor('#000000');

  if (!medicines || medicines.length === 0) {
    doc.fontSize(10).font('Helvetica').text('No medicines recorded.');
    doc.moveDown(1);
    return;
  }

  const cols = { name: 50, time: 280, date: 380 };
  const rowH = 18;
  let ty = doc.y;

  doc.fontSize(8).font('Helvetica-Bold').fillColor('#ffffff');
  doc.rect(50, ty, 495, rowH).fill('#1976d2');
  doc.text('Medicine Name', cols.name + 2, ty + 5);
  doc.text('Time', cols.time, ty + 5);
  doc.text('Date', cols.date, ty + 5);
  ty += rowH;

  doc.font('Helvetica').fillColor('#000000');
  medicines.slice(0, 30).forEach((med, i) => {
    if (ty > 740) { doc.addPage(); renderHeader(doc, 'Health Report — Medicines (continued)'); ty = doc.y; }
    if (i % 2 === 0) doc.rect(50, ty, 495, rowH).fill('#f0f4ff');
    doc.fillColor('#000000').fontSize(8);
    doc.text(med.name, cols.name + 2, ty + 5, { width: 220, ellipsis: true });
    doc.text(med.time || '—', cols.time, ty + 5);
    doc.text(med.date || '—', cols.date, ty + 5);
    ty += rowH;
  });

  doc.y = ty;
  doc.moveDown(1);
}

/**
 * Render footer on current page.
 */
function renderFooter(doc) {
  const bottom = doc.page.height - 40;
  drawHRule(doc, bottom - 10);
  doc
    .fontSize(7)
    .font('Helvetica')
    .fillColor('#888888')
    .text(
      'This report is generated by CareSync and is for informational purposes only. Please consult a healthcare provider for medical advice.',
      50, bottom,
      { align: 'center', width: 495 }
    );
}

/**
 * Render symptoms section.
 */
function renderSymptoms(doc, symptoms) {
  if (doc.y > 680) { doc.addPage(); renderHeader(doc, 'Health Report — Symptoms'); }

  doc
    .fontSize(12)
    .font('Helvetica-Bold')
    .fillColor('#1976d2')
    .text('Symptom History', 50, doc.y);

  drawHRule(doc, doc.y + 4);
  doc.moveDown(0.8);
  doc.fillColor('#000000');

  if (!symptoms || symptoms.length === 0) {
    doc.fontSize(10).font('Helvetica').text('No symptom history recorded.');
    doc.moveDown(1);
    return;
  }

  symptoms.slice(0, 20).forEach((check) => {
    if (doc.y > 720) { doc.addPage(); renderHeader(doc, 'Health Report — Symptoms (continued)'); }
    
    doc.fontSize(10).font('Helvetica-Bold').text(new Date(check.checkedAt).toLocaleString('en-US'));
    doc.fontSize(9).font('Helvetica').text(`Symptoms: ${check.symptoms.join(', ')}`);
    
    if (check.results && check.results.length > 0) {
      const res = check.results[0];
      doc.text(`Probable Condition: ${res.condition} (${Math.round(res.probability * 100)}%) - Risk: ${res.risk.toUpperCase()}`);
    }
    doc.moveDown(0.5);
  });
  
  doc.moveDown(1);
}

/**
 * Generate a comprehensive health report PDF.
 * @param {Object} user - User document
 * @param {Array}  metrics - HealthMetric documents
 * @param {Array}  medicines - Medicine documents
 * @param {Array}  symptoms - SymptomCheck documents
 * @returns {Promise<Buffer>}
 */
function generateHealthReportPDF(user, metrics, medicines = [], symptoms = []) {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 50, size: 'A4', autoFirstPage: true });
      const buffers = [];
      doc.on('data', chunk => buffers.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(buffers)));
      doc.on('error', reject);

      renderHeader(doc, 'Comprehensive Health Report');
      renderPatientInfo(doc, user);
      renderHealthMetrics(doc, metrics);
      renderMedicines(doc, medicines);
      renderSymptoms(doc, symptoms);
      renderFooter(doc);

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
}

module.exports = { generateHealthReportPDF };
