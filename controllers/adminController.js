const User = require('../models/User');
const Item = require('../models/Item');

// Admin dashboard stats
const getDashboardStats = async (req, res) => {
  try {
    const [
      totalUsers,
      totalItems,
      lostItems,
      foundItems,
      matches,
      successfulReturns
    ] = await Promise.all([
      User.countDocuments(),
      Item.countDocuments(),
      Item.countDocuments({ status: 'lost' }),
      Item.countDocuments({ status: 'found' }),
      Item.countDocuments({ status: 'matched' }),
      Item.countDocuments({ status: 'claimed' })
    ]);

    // Get recent activity (last 5 items)
    const recentActivity = await Item.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .select('title status createdAt')
      .populate('reporter', 'name');

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
        lostItems,
        foundItems,
        matches,
        successfulReturns,
        recentActivity: transformedActivity,
        totals: {
          users: totalUsers,
          items: totalItems,
          activeItems: lostItems + foundItems,
          claimedItems: successfulReturns
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