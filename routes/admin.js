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

// User dashboard stats (public for authenticated users)
router.get('/user-dashboard', protect, async (req, res) => {
  try {
    const userId = req.user.id;

    // Get user's items stats
    const [
      userLostItems,
      userFoundItems,
      userMatches,
      userSuccessfulReturns
    ] = await Promise.all([
      Item.countDocuments({ reporter: userId, status: 'lost' }),
      Item.countDocuments({ reporter: userId, status: 'found' }),
      Item.countDocuments({ reporter: userId, status: 'matched' }),
      Item.countDocuments({ reporter: userId, status: 'claimed' })
    ]);

    // Get recent activity for this user (last 5 items)
    const recentActivity = await Item.find({ reporter: userId })
      .sort({ createdAt: -1 })
      .limit(5)
      .select('title status createdAt');

    // Transform recent activity for frontend
    const transformedActivity = recentActivity.map(item => ({
      id: item._id,
      type: item.status === 'lost' ? 'lost' : 'found',
      item: item.title,
      date: item.createdAt.toISOString().split('T')[0],
      status: item.status === 'claimed' ? 'completed' : item.status === 'matched' ? 'matched' : 'active'
    }));

    res.json({
      success: true,
      data: {
        lostItems: userLostItems,
        foundItems: userFoundItems,
        matches: userMatches,
        successfulReturns: userSuccessfulReturns,
        recentActivity: transformedActivity
      }
    });
  } catch (error) {
    console.error('User dashboard stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching user dashboard stats'
    });
  }
});

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