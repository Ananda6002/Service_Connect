const Booking = require('../models/Booking');
const User = require('../models/User');

// @desc    Get all service providers with optional skill/location filters
// @route   GET /api/bookings/providers
// @access  Private (Registered Users)
const getProviders = async (req, res) => {
  try {
    const { serviceType, location } = req.query;
    const query = { role: 'provider' };

    if (serviceType) {
      // Find providers that have this skill (case-insensitive)
      query.skills = { $in: [new RegExp(`^${serviceType}$`, 'i')] };
    }

    if (location) {
      // Find providers matching location (case-insensitive regex)
      query.location = { $regex: location, $options: 'i' };
    }

    const providers = await User.find(query).select('-password');

    res.json({
      success: true,
      count: providers.length,
      providers
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Create a service booking request
// @route   POST /api/bookings
// @access  Private (Clients)
const createBooking = async (req, res) => {
  try {
    const { providerId, serviceType, description, location } = req.body;

    if (!providerId || !serviceType || !description || !location) {
      return res.status(400).json({
        success: false,
        message: 'Please provide providerId, serviceType, description, and location'
      });
    }

    // Verify provider exists and has role 'provider'
    const provider = await User.findById(providerId);
    if (!provider || provider.role !== 'provider') {
      return res.status(404).json({
        success: false,
        message: 'Service provider not found'
      });
    }

    const booking = await Booking.create({
      user: req.user._id,
      provider: providerId,
      serviceType,
      description,
      location,
      status: 'Pending'
    });

    res.status(201).json({
      success: true,
      message: 'Service request sent successfully',
      booking
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get bookings submitted by the logged-in user (client)
// @route   GET /api/bookings/user
// @access  Private (Clients)
const getUserBookings = async (req, res) => {
  try {
    const bookings = await Booking.find({ user: req.user._id })
      .populate('provider', 'name email phone location skills bio hourlyRate')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: bookings.length,
      bookings
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get bookings received by the logged-in provider
// @route   GET /api/bookings/provider
// @access  Private (Providers)
const getProviderBookings = async (req, res) => {
  try {
    if (req.user.role !== 'provider') {
      return res.status(403).json({
        success: false,
        message: 'Access denied: Only service providers can fetch these bookings'
      });
    }

    const bookings = await Booking.find({ provider: req.user._id })
      .populate('user', 'name email')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: bookings.length,
      bookings
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update status of a service booking (Accept/Reject/Complete)
// @route   PUT /api/bookings/:id/status
// @access  Private (Providers)
const updateBookingStatus = async (req, res) => {
  try {
    const { status } = req.body;

    if (!status || !['Pending', 'Accepted', 'Rejected', 'Completed'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid status: Pending, Accepted, Rejected, Completed'
      });
    }

    // Find the booking
    const booking = await Booking.findById(req.params.id);

    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }

    // Check if the logged-in provider is the owner of the booking
    if (booking.provider.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to modify this booking'
      });
    }

    booking.status = status;
    await booking.save();

    res.json({
      success: true,
      message: `Booking status updated to ${status}`,
      booking
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getProviders,
  createBooking,
  getUserBookings,
  getProviderBookings,
  updateBookingStatus
};
