const User = require('../models/User');
const Booking = require('../models/Booking');
const Review = require('../models/Review');

// @desc    Get admin statistics and management lists
// @route   GET /api/admin/stats
// @access  Private (Admin Only)
const getAdminStats = async (req, res) => {
  try {
    // 1. Get User Counts
    const totalUsers = await User.countDocuments();
    const totalProviders = await User.countDocuments({ role: 'provider' });
    const totalClients = await User.countDocuments({ role: 'user' });
    const totalAdmins = await User.countDocuments({ role: 'admin' });

    // 2. Get Booking Counts
    const totalBookings = await Booking.countDocuments();
    const bookingsPending = await Booking.countDocuments({ status: 'Pending' });
    const bookingsAccepted = await Booking.countDocuments({ status: 'Accepted' });
    const bookingsRejected = await Booking.countDocuments({ status: 'Rejected' });
    const bookingsCompleted = await Booking.countDocuments({ status: 'Completed' });

    // 3. Get Review Count
    const totalReviews = await Review.countDocuments();

    // 4. Retrieve Lists for administration
    const users = await User.find().select('-password').sort({ createdAt: -1 });
    const bookings = await Booking.find()
      .populate('user', 'name email')
      .populate('provider', 'name email')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      stats: {
        users: {
          total: totalUsers,
          providers: totalProviders,
          clients: totalClients,
          admins: totalAdmins
        },
        bookings: {
          total: totalBookings,
          pending: bookingsPending,
          accepted: bookingsAccepted,
          rejected: bookingsRejected,
          completed: bookingsCompleted
        },
        reviews: {
          total: totalReviews
        }
      },
      users,
      bookings
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getAdminStats
};
