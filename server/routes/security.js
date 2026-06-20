const express = require('express');
const router = express.Router();
const SecurityLog = require('../models/SecurityLog');
const authMiddleware = require('../middleware/authMiddleware');
const adminMiddleware = require('../middleware/adminMiddleware');
const { EVENT_TYPES, SEVERITY } = require('../utils/securityEvents');

// Every route below requires an authenticated admin.
router.use(authMiddleware, adminMiddleware);

// @route   GET /api/security/logs
// @desc    List security events (filterable, paginated, newest first)
// @access  Admin
// @query   page, limit, eventType, severity, ip, email, from, to
router.get('/logs', async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 25));
    const skip = (page - 1) * limit;

    // Guard against unbounded deep-offset pagination, which forces MongoDB to
    // scan and discard huge numbers of documents as the collection grows.
    const MAX_SKIP = 10000;
    if (skip > MAX_SKIP) {
      return res.status(400).json({
        message: 'Requested page is too deep; narrow the results with filters (eventType, severity, ip, email, from, to) and retry.',
      });
    }

    const filter = {};
    if (req.query.eventType) filter.eventType = { $eq: String(req.query.eventType) };
    if (req.query.severity) filter.severity = { $eq: String(req.query.severity) };
    if (req.query.ip) filter.ip = { $eq: String(req.query.ip) };
    if (req.query.email) filter.email = { $eq: String(req.query.email).trim().toLowerCase() };

    if (req.query.from || req.query.to) {
      const range = {};
      if (req.query.from) {
        const f = new Date(req.query.from);
        if (!Number.isNaN(f.getTime())) range.$gte = f;
      }
      if (req.query.to) {
        const t = new Date(req.query.to);
        if (!Number.isNaN(t.getTime())) range.$lte = t;
      }
      if (Object.keys(range).length > 0) filter.createdAt = range;
    }

    const [logs, total] = await Promise.all([
      SecurityLog.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('user', 'name email role')
        .lean(),
      SecurityLog.countDocuments(filter),
    ]);

    res.json({
      logs,
      page,
      limit,
      total,
      totalPages: Math.max(1, Math.ceil(total / limit)),
    });
  } catch (err) {
    console.error('Fetch security logs error:', err.message);
    res.status(500).json({ message: 'Server error fetching security logs' });
  }
});

// @route   GET /api/security/stats
// @desc    Aggregated security overview for dashboards / real-time alerting
// @access  Admin
// @query   hours (default 24, max 720)
router.get('/stats', async (req, res) => {
  try {
    const windowHours = Math.min(720, Math.max(1, parseInt(req.query.hours, 10) || 24));
    const since = new Date(Date.now() - windowHours * 60 * 60 * 1000);

    const [byEventType, bySeverity, topFailedIps, recentCritical, totalInWindow] = await Promise.all([
      SecurityLog.aggregate([
        { $match: { createdAt: { $gte: since } } },
        { $group: { _id: '$eventType', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
      ]),
      SecurityLog.aggregate([
        { $match: { createdAt: { $gte: since } } },
        { $group: { _id: '$severity', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
      ]),
      SecurityLog.aggregate([
        { $match: { eventType: EVENT_TYPES.AUTH_LOGIN_FAILURE, createdAt: { $gte: since }, ip: { $ne: null } } },
        { $group: { _id: '$ip', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 10 },
      ]),
      SecurityLog.find({ severity: SEVERITY.CRITICAL, createdAt: { $gte: since } })
        .sort({ createdAt: -1 })
        .limit(20)
        .lean(),
      SecurityLog.countDocuments({ createdAt: { $gte: since } }),
    ]);

    res.json({
      windowHours,
      since,
      totalEvents: totalInWindow,
      byEventType,
      bySeverity,
      topFailedLoginIps: topFailedIps,
      recentCriticalEvents: recentCritical,
    });
  } catch (err) {
    console.error('Fetch security stats error:', err.message);
    res.status(500).json({ message: 'Server error fetching security stats' });
  }
});

module.exports = router;
