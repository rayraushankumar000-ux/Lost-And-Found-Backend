// routes/dashboard.js
const express = require('express');
const router = express.Router();
const Item = require('../models/Item');

// GET /api/dashboard/summary
// returns { totalLost, totalFound, totalItems, matchesCount }
router.get('/summary', async (req, res) => {
  try {
    const [lostCount, foundCount, totalItems] = await Promise.all([
      Item.countDocuments({ status: 'lost' }),
      Item.countDocuments({ status: 'found' }),
      Item.countDocuments({})
    ]);

    const matchesCount = Math.min(lostCount, foundCount);

    res.json({
      totalLost: lostCount,
      totalFound: foundCount,
      totalItems,
      matchesCount
    });
  } catch (err) {
    console.error('Error GET /api/dashboard/summary', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/dashboard/recent?limit=10
router.get('/recent', async (req, res) => {
  try {
    const limit = Math.max(1, Math.min(50, parseInt(req.query.limit || '10', 10)));
    const items = await Item.find()
      .sort({ createdAt: -1 })
      .limit(limit)
      .populate('reporter', 'name email')
      .lean();

    // normalize shape for frontend
    const mapped = items.map(it => ({
      _id: it._id,
      title: it.title || it.description || 'Untitled',
      type: it.status || 'lost',
      status: it.status || 'active',
      reporter: it.reporter || null,
      createdAt: it.createdAt
    }));

    res.json(mapped);
  } catch (err) {
    console.error('Error GET /api/dashboard/recent', err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
