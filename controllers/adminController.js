const User = require('../models/User');
const Item = require('../models/Item');

// Admin dashboard stats
const getDashboardStats = async (req, res) => {
  try {
    const [
      totalUsers,
      totalItems,
      activeItems,
      claimedItems
    ] = await Promise.all([
      User.countDocuments(),
      Item.countDocuments(),
      Item.countDocuments({ status: 'active' }),
      Item.countDocuments({ status: 'claimed' })
    ]);

    res.json({
      success: true,
      data: {
        totals: {
          users: totalUsers,
          items: totalItems,
          activeItems,
          claimedItems
        }
      }
    });
  } catch (error) {
    console.error('Admin stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching dashboard stats'
    });
  }
};

module.exports = { getDashboardStats };