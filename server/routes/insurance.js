const express = require('express');
const router = express.Router();
const InsurancePolicy = require('../models/InsurancePolicy');
const authMiddleware = require('../middleware/authMiddleware');
const PDFDocument = require('pdfkit');

// Static insurance plans available for comparison & purchase
const INSURANCE_PLANS = [
  {
    id: 'coreshield-bronze',
    name: 'CareShield Bronze Saver',
    provider: 'CareShield',
    tier: 'Bronze',
    premium: 150,
    deductible: 5000,
    copay: 40,
    networkType: 'HMO',
    benefits: [
      'Free preventive care & checkups',
      'Low monthly premium payments',
      'Virtual doctor visits covered at 100%',
      'Prescription discount benefits included'
    ]
  },
  {
    id: 'apexhealth-silver',
    name: 'ApexHealth Silver Standard',
    provider: 'ApexHealth',
    tier: 'Silver',
    premium: 280,
    deductible: 2500,
    copay: 25,
    networkType: 'PPO',
    benefits: [
      'Balanced out-of-pocket costs',
      'No referrals required for specialists',
      'Covers 80% of emergency services',
      'Extensive national provider network'
    ]
  },
  {
    id: 'metrolife-gold',
    name: 'MetroLife Gold Premium',
    provider: 'MetroLife',
    tier: 'Gold',
    premium: 420,
    deductible: 500,
    copay: 10,
    networkType: 'EPO',
    benefits: [
      'Ultra-low deductibles',
      'Lowest copay options',
      'Comprehensive mental health coverage',
      'Zero out-of-pocket for top tier hospitals'
    ]
  },
  {
    id: 'coreshield-senior',
    name: 'CareShield Senior Wellness',
    provider: 'CareShield',
    tier: 'Silver',
    premium: 200,
    deductible: 1500,
    copay: 15,
    networkType: 'PPO',
    benefits: [
      'Tailored senior diagnostics support',
      'Geriatric specialty checkups included',
      'Free annual cardiovascular scan',
      'Subsidized physical therapy visits'
    ]
  },
  {
    id: 'apexhealth-family',
    name: 'ApexHealth Family Guard',
    provider: 'ApexHealth',
    tier: 'Gold',
    premium: 450,
    deductible: 3000,
    copay: 20,
    networkType: 'HMO',
    benefits: [
      'Flat copays for all pediatric visits',
      'Covers up to 5 family members',
      'Prenatal & postnatal care fully covered',
      'Complimentary dental wellness exam'
    ]
  }
];

// Helper to generate professional-grade insurance PDF certificate
function generatePolicyPDF(policy) {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 40, size: 'A4' });
      let buffers = [];
      doc.on('data', data => buffers.push(data));
      doc.on('end', () => resolve(Buffer.concat(buffers)));
      doc.on('error', reject);

      // Header block with brand colors (primary: #1976d2, secondary: #43e97b)
      doc.rect(0, 0, 595.28, 120).fill('#1976d2');
      doc.fillColor('white').fontSize(24).font('Helvetica-Bold').text('CareSync Insurance Services', 40, 35);
      doc.fontSize(12).font('Helvetica').text('Official Certificate of Health Coverage', 40, 65);

      // CareSync Logo Symbol
      doc.rect(480, 30, 60, 60).fill('#43e97b');
      doc.fillColor('#1976d2').fontSize(14).font('Helvetica-Bold').text('CS', 500, 52);

      // Content setup
      doc.fillColor('#333333');
      doc.y = 150;
      doc.x = 40;

      // Policy Overview Section Header
      doc.fontSize(16).font('Helvetica-Bold').fillColor('#1976d2').text('POLICY DETAILS');
      doc.moveTo(40, doc.y + 4).lineTo(555, doc.y + 4).strokeColor('#e0e0e0').lineWidth(1).stroke();
      doc.moveDown(1.5);

      doc.fillColor('#333333').fontSize(10).font('Helvetica');
      const startY = doc.y;
      
      // Column 1
      doc.text('Policy Holder:', 40, startY);
      doc.font('Helvetica-Bold').text(policy.primaryInsured.name, 150, startY);
      
      doc.font('Helvetica').text('Policy Number:', 40, startY + 22);
      doc.font('Helvetica-Bold').text(policy.policyNumber, 150, startY + 22);

      doc.font('Helvetica').text('Plan Tier / Name:', 40, startY + 44);
      doc.font('Helvetica-Bold').text(`${policy.planName} (${policy.networkType})`, 150, startY + 44);

      doc.font('Helvetica').text('Provider:', 40, startY + 66);
      doc.font('Helvetica-Bold').text(policy.provider, 150, startY + 66);

      // Column 2
      doc.font('Helvetica').text('Monthly Premium:', 320, startY);
      doc.font('Helvetica-Bold').text(`$${policy.premium}.00`, 430, startY);

      doc.font('Helvetica').text('Deductible:', 320, startY + 22);
      doc.font('Helvetica-Bold').text(`$${policy.deductible}.00`, 430, startY + 22);

      doc.font('Helvetica').text('Primary Co-pay:', 320, startY + 44);
      doc.font('Helvetica-Bold').text(`$${policy.copay}.00 / visit`, 430, startY + 44);

      doc.font('Helvetica').text('Status:', 320, startY + 66);
      doc.font('Helvetica-Bold')
        .fillColor(policy.status === 'active' ? '#2e7d32' : '#c62828')
        .text(policy.status.toUpperCase(), 430, startY + 66);

      // Reset text color
      doc.fillColor('#333333');

      // Term Dates
      doc.y = startY + 100;
      doc.x = 40;
      doc.fontSize(11).font('Helvetica-Bold').text('Coverage Period:');
      doc.font('Helvetica').text(`Effective Date: ${new Date(policy.startDate).toLocaleDateString()}  |  Expiration Date: ${new Date(policy.endDate).toLocaleDateString()}`);

      doc.moveDown(2.5);

      // Covered Members Section Header
      doc.fontSize(14).font('Helvetica-Bold').fillColor('#1976d2').text('COVERED INDIVIDUALS');
      doc.moveTo(40, doc.y + 4).lineTo(555, doc.y + 4).strokeColor('#e0e0e0').stroke();
      doc.moveDown(1.5);

      doc.fillColor('#333333').fontSize(10);
      doc.font('Helvetica-Bold').text('Name', 40, doc.y, { width: 250, continued: true });
      doc.text('Relationship', 250, doc.y);
      doc.font('Helvetica');

      // Primary Insured Row
      const rowY = doc.y + 15;
      doc.text(policy.primaryInsured.name, 40, rowY, { width: 250, continued: true });
      doc.text('Self (Primary Insured)', 250, rowY);

      let currentY = rowY;
      if (policy.coveredMembers && policy.coveredMembers.length > 0) {
        policy.coveredMembers.forEach(member => {
          currentY += 18;
          doc.text(member.name, 40, currentY, { width: 250, continued: true });
          doc.text(member.relationship, 250, currentY);
        });
      }

      // Footer Notice Block
      doc.rect(40, 520, 515, 80).fill('#f5f5f5');
      doc.fillColor('#555555').fontSize(8.5).font('Helvetica-Oblique')
        .text('Important Notice: This certificate serves as official proof of active health coverage under CareSync. Present this document alongside valid photo identification at participating medical facilities. For claims, benefit breakdowns, or provider network validation, please log in to your CareSync online portal.', 55, 532, { width: 485, lineGap: 3 });

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
}

// @route   GET /api/insurance/plans
// @desc    Get all available marketplace plans
// @access  Public
router.get('/plans', (req, res) => {
  res.json(INSURANCE_PLANS);
});

// @route   GET /api/insurance/policies
// @desc    Get user's purchased insurance policies
// @access  Private
router.get('/policies', authMiddleware, async (req, res) => {
  try {
    const policies = await InsurancePolicy.find({ user: { $eq: req.user._id } }).sort({ createdAt: -1 });
    res.json(policies);
  } catch (err) {
    console.error('Fetch policies error:', err.message);
    res.status(500).json({ message: 'Server error fetching insurance policies' });
  }
});

// @route   POST /api/insurance/policies
// @desc    Purchase a new insurance policy
// @access  Private
router.post('/policies', authMiddleware, async (req, res) => {
  const {
    planId,
    planName,
    provider,
    premium,
    deductible,
    copay,
    coverageType,
    networkType,
    primaryInsured,
    coveredMembers
  } = req.body;

  try {
    // Validate inputs
    if (
      !planId ||
      !planName ||
      !provider ||
      !premium ||
      !deductible ||
      !copay ||
      !coverageType ||
      !networkType ||
      !primaryInsured ||
      !primaryInsured.name ||
      !primaryInsured.dob ||
      !primaryInsured.ssnLastFour
    ) {
      return res.status(400).json({ message: 'Missing required checkout information' });
    }

    if (!/^\d{4}$/.test(primaryInsured.ssnLastFour)) {
      return res.status(400).json({ message: 'SSN must be the last 4 digits' });
    }

    // Generate unique policy number
    const randomSuffix = Math.floor(10000 + Math.random() * 90000);
    const policyNumber = `CS-2026-${randomSuffix}`;

    // Dates
    const startDate = new Date();
    const endDate = new Date();
    endDate.setFullYear(startDate.getFullYear() + 1); // 1-year coverage duration

    const newPolicy = new InsurancePolicy({
      user: req.user._id,
      policyNumber,
      planId,
      planName,
      provider,
      premium,
      deductible,
      copay,
      coverageType,
      networkType,
      status: 'active',
      startDate,
      endDate,
      primaryInsured,
      coveredMembers: coveredMembers || []
    });

    await newPolicy.save();
    res.status(201).json(newPolicy);
  } catch (err) {
    console.error('Purchase policy error:', err.message);
    res.status(500).json({ message: 'Server error saving policy purchase' });
  }
});

// @route   DELETE /api/insurance/policies/:id
// @desc    Cancel an insurance policy
// @access  Private
router.delete('/policies/:id', authMiddleware, async (req, res) => {
  const cleanId = String(req.params.id);
  try {
    const policy = await InsurancePolicy.findOne({
      _id: { $eq: cleanId },
      user: { $eq: req.user._id }
    });

    if (!policy) {
      return res.status(404).json({ message: 'Policy not found or unauthorized' });
    }

    if (policy.status === 'cancelled') {
      return res.status(400).json({ message: 'Policy is already cancelled' });
    }

    policy.status = 'cancelled';
    await policy.save();

    res.json({ message: 'Policy cancelled successfully', policy });
  } catch (err) {
    console.error('Cancel policy error:', err.message);
    res.status(500).json({ message: 'Server error cancelling insurance policy' });
  }
});

// @route   GET /api/insurance/policies/:id/download
// @desc    Download PDF Certificate of coverage
// @access  Private
router.get('/policies/:id/download', authMiddleware, async (req, res) => {
  const cleanId = String(req.params.id);
  try {
    const policy = await InsurancePolicy.findOne({
      _id: { $eq: cleanId },
      user: { $eq: req.user._id }
    });

    if (!policy) {
      return res.status(404).json({ message: 'Policy not found or unauthorized' });
    }

    const pdfBuffer = await generatePolicyPDF(policy);
    
    // Set headers for download
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename=CareSync_Policy_${policy.policyNumber}.pdf`
    );
    res.send(pdfBuffer);
  } catch (err) {
    console.error('Download policy PDF error:', err.message);
    res.status(500).json({ message: 'Server error generating policy PDF' });
  }
});

module.exports = router;
