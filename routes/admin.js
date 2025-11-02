const express = require('express');
const { protect } = require('../middleware/auth');
const { getDashboardStats } = require('../controllers/adminController');
const User = require('../models/User');
const Item = require('../models/Item');

const router = express.Router();

// Admin middleware - check if user is admin
const adminOnly = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    return next();
  }
  return res.status(403).json({ 
    success: false,
    message: 'Admin access required' 
  });
};

// Admin dashboard stats
router.get('/dashboard', protect, adminOnly, getDashboardStats);

// Admin reports - GET /api/admin/reports
router.get('/reports', protect, adminOnly, async (req, res) => {
  try {
    const { status, category, startDate, endDate } = req.query;
    
    let query = {};
    if (status) query.status = status;
    if (category) query.category = category;
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }
    
    const items = await Item.find(query)
      .populate('reporter', 'name email phone')
      .sort({ createdAt: -1 })
      .limit(100);
    
    res.json({
      success: true,
      data: {
        items,
        count: items.length,
        filters: { status, category, startDate, endDate }
      }
    });
  } catch (error) {
    console.error('Admin reports error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error fetching reports' 
    });
  }
});

module.exports = router;