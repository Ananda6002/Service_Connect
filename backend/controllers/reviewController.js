const Review = require('../models/Review');
const Booking = require('../models/Booking');
const User = require('../models/User');
const Notification = require('../models/Notification');

// @desc    Create a review for a completed booking
// @route   POST /api/reviews
// @access  Private (Clients)
const createReview = async (req, res) => {
  try {
    const { bookingId, rating, comment } = req.body;

    if (!bookingId || !rating || !comment) {
      return res.status(400).json({ success: false, message: 'Please provide bookingId, rating, and comment' });
    }

    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }

    // Verify booking belongs to user
    if (booking.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized to review this booking' });
    }

    // Verify booking is completed
    if (booking.status !== 'Completed') {
      return res.status(400).json({ success: false, message: 'You can only review completed service requests' });
    }

    // Verify review doesn't already exist
    if (booking.hasReview) {
      return res.status(400).json({ success: false, message: 'This booking has already been reviewed' });
    }

    // Create review
    const review = await Review.create({
      user: req.user._id,
      provider: booking.provider,
      booking: bookingId,
      rating,
      comment
    });

    // Update booking hasReview flag
    booking.hasReview = true;
    await booking.save({ validateBeforeSave: false });

    // Recalculate average rating for provider
    const reviews = await Review.find({ provider: booking.provider });
    const numReviews = reviews.length;
    const totalRating = reviews.reduce((sum, r) => sum + r.rating, 0);
    const averageRating = numReviews > 0 ? (totalRating / numReviews).toFixed(1) : 0;

    await User.findByIdAndUpdate(booking.provider, {
      averageRating: parseFloat(averageRating),
      numReviews
    });

    // Notify provider of new review
    await Notification.create({
      user: booking.provider,
      title: 'New Review Received',
      message: `You received a ${rating}-star review from ${req.user.name}: "${comment}"`,
      booking: bookingId
    });

    res.status(201).json({
      success: true,
      message: 'Review submitted successfully',
      review
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get all reviews for a provider
// @route   GET /api/reviews/provider/:providerId
// @access  Public/Private
const getProviderReviews = async (req, res) => {
  try {
    const reviews = await Review.find({ provider: req.params.providerId })
      .populate('user', 'name')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: reviews.length,
      reviews
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  createReview,
  getProviderReviews
};
