const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

/**
 * Generate a PDF report of health metrics
 * @param {Object} userData - User object with name and other details
 * @param {Array} metrics - Array of health metrics
 * @returns {Buffer} PDF buffer
 */
function generateHealthReportPDF(userData, metrics) {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({
        margin: 50,
        size: 'A4',
      });

      let buffers = [];
      doc.on('data', (data) => buffers.push(data));
      doc.on('end', () => {
        resolve(Buffer.concat(buffers));
      });
      doc.on('error', reject);

      // Header
      doc.fontSize(20).font('Helvetica-Bold').text('Health Report', { align: 'center' });
      doc.fontSize(10).font('Helvetica').text('', 2);
      doc.fontSize(11)
        .font('Helvetica-Bold')
        .text(`Patient: ${userData.name || 'Unknown'}`, { underline: true });
      doc.fontSize(10)
        .font('Helvetica')
        .text(`Email: ${userData.email || 'N/A'}`)
        .text(`Blood Group: ${userData.bloodGroup || 'Not specified'}`)
        .text(`Age: ${userData.age || 'Not specified'}`)
        .text(`Generated: ${new Date().toLocaleDateString('en-US')}`, { align: 'right' })
        .moveDown(1);

      // Summary section
      if (metrics && metrics.length > 0) {
        const latest = metrics[0];
        doc.fontSize(12).font('Helvetica-Bold').text('Latest Vitals', { underline: true });
        doc.fontSize(10).font('Helvetica');

        const vitalsList = [];
        if (latest.weight) vitalsList.push(`Weight: ${latest.weight} kg`);
        if (latest.systolic && latest.diastolic)
          vitalsList.push(`Blood Pressure: ${latest.systolic}/${latest.diastolic} mmHg`);
        if (latest.heartRate) vitalsList.push(`Heart Rate: ${latest.heartRate} bpm`);
        if (latest.temperature) vitalsList.push(`Temperature: ${latest.temperature}°C`);
        if (latest.bloodSugar) vitalsList.push(`Blood Sugar: ${latest.bloodSugar} mg/dL`);
        if (latest.oxygenSaturation) vitalsList.push(`Oxygen Saturation: ${latest.oxygenSaturation}%`);

        vitalsList.forEach((vital) => {
          doc.text(`• ${vital}`);
        });

        if (latest.notes) {
          doc.moveDown(0.5).font('Helvetica-Bold').text('Notes:').font('Helvetica').text(latest.notes);
        }
      }

      doc.moveDown(1);

      // Metrics history table
      if (metrics && metrics.length > 0) {
        doc.fontSize(12).font('Helvetica-Bold').text('Metrics History', { underline: true });
        doc.moveDown(0.5);

        const tableTop = doc.y;
        const col1 = 50;
        const col2 = 140;
        const col3 = 230;
        const col4 = 320;
        const col5 = 410;
        const rowHeight = 20;

        // Header row
        doc.fontSize(9).font('Helvetica-Bold');
        doc.text('Date', col1, tableTop);
        doc.text('Weight (kg)', col2, tableTop);
        doc.text('BP (mmHg)', col3, tableTop);
        doc.text('HR (bpm)', col4, tableTop);
        doc.text('Temp (°C)', col5, tableTop);

        // Draw line
        doc.moveTo(col1 - 10, tableTop + rowHeight - 5)
          .lineTo(550, tableTop + rowHeight - 5)
          .stroke();

        // Data rows (limit to last 15 entries for readability)
        doc.font('Helvetica').fontSize(8);
        const displayMetrics = metrics.slice(0, 15);
        let currentY = tableTop + rowHeight;

        displayMetrics.forEach((metric) => {
          const date = new Date(metric.recordedAt).toLocaleDateString('en-US');
          const weight = metric.weight ? metric.weight.toString() : '—';
          const bp =
            metric.systolic && metric.diastolic
              ? `${metric.systolic}/${metric.diastolic}`
              : '—';
          const hr = metric.heartRate ? metric.heartRate.toString() : '—';
          const temp = metric.temperature ? metric.temperature.toString() : '—';

          doc.text(date, col1, currentY);
          doc.text(weight, col2, currentY);
          doc.text(bp, col3, currentY);
          doc.text(hr, col4, currentY);
          doc.text(temp, col5, currentY);

          currentY += rowHeight;

          // Add new page if needed
          if (currentY > 750) {
            doc.addPage();
            currentY = 50;
          }
        });
      }

      // Footer
      doc.moveDown(2).fontSize(8).font('Helvetica').text(
        'This report is for informational purposes. Please consult with a healthcare provider for medical advice.',
        {
          align: 'center',
          color: '#888888',
        }
      );

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
}

module.exports = { generateHealthReportPDF };
