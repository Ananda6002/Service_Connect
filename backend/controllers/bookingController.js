const Booking = require('../models/Booking');
const User = require('../models/User');
const Notification = require('../models/Notification');

// @desc    Get all service providers with optional skill/location filters
// @route   GET /api/bookings/providers
// @access  Private (Registered Users)
const getProviders = async (req, res) => {
  try {
    const { serviceType, location, lat, lng } = req.query;
    const query = { role: 'provider' };

    if (serviceType) {
      // Find providers that have any skill matching the query (case-insensitive substring match)
      query.skills = { $elemMatch: { $regex: serviceType, $options: 'i' } };
    }

    if (location) {
      // Find providers matching location (case-insensitive regex)
      query.location = { $regex: location, $options: 'i' };
    }

    let providers = await User.find(query).select('-password').lean();

    // Helper for Haversine formula
    const calculateDistance = (lat1, lon1, lat2, lon2) => {
      const R = 6371; // Radius of earth in km
      const dLat = (lat2 - lat1) * Math.PI / 180;
      const dLon = (lon2 - lon1) * Math.PI / 180;
      const a = 
        Math.sin(dLat/2) * Math.sin(dLat/2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
        Math.sin(dLon/2) * Math.sin(dLon/2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
      return R * c; // Distance in km
    };

    if (lat && lng) {
      const clientLat = parseFloat(lat);
      const clientLng = parseFloat(lng);

      providers = providers.map(p => {
        if (p.latitude !== null && p.longitude !== null && p.latitude !== undefined && p.longitude !== undefined) {
          const dist = calculateDistance(clientLat, clientLng, p.latitude, p.longitude);
          return { ...p, distance: parseFloat(dist.toFixed(2)) };
        }
        return { ...p, distance: null };
      });

      // Sort nearest first (distance !== null comes before distance === null)
      providers.sort((a, b) => {
        if (a.distance === null && b.distance === null) return 0;
        if (a.distance === null) return 1;
        if (b.distance === null) return -1;
        return a.distance - b.distance;
      });
    }

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
    const { providerId, serviceType, description, location, bookingDate, bookingTime } = req.body;

    if (!providerId || !serviceType || !description || !location || !bookingDate || !bookingTime) {
      return res.status(400).json({
        success: false,
        message: 'Please provide providerId, serviceType, description, location, bookingDate, and bookingTime'
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
      bookingDate,
      bookingTime,
      status: 'Pending'
    });

    // Create Notification for the provider
    await Notification.create({
      user: providerId,
      title: 'New Booking Request',
      message: `You have received a new booking request for ${serviceType} on ${new Date(bookingDate).toLocaleDateString()} at ${bookingTime} from ${req.user.name}.`,
      booking: booking._id
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
    await booking.save({ validateBeforeSave: false });

    // Create system Notification for the client (booking.user)
    await Notification.create({
      user: booking.user,
      title: `Booking Request ${status}`,
      message: `Your booking request for ${booking.serviceType} has been ${status.toLowerCase()} by ${req.user.name || 'the provider'}.`,
      booking: booking._id
    });

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
