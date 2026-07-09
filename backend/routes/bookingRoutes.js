const express = require('express');
const router = express.Router();
const {
  getProviders,
  createBooking,
  getUserBookings,
  getProviderBookings,
  updateBookingStatus
} = require('../controllers/bookingController');
const { protect } = require('../middleware/auth');

router.get('/providers', protect, getProviders);
router.post('/', protect, createBooking);
router.get('/user', protect, getUserBookings);
router.get('/provider', protect, getProviderBookings);
router.put('/:id/status', protect, updateBookingStatus);

module.exports = router;
