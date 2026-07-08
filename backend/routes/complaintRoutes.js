const express = require('express');
const router = express.Router();
const {
  createComplaint,
  getUserComplaints,
  getAllComplaints,
  updateComplaintStatus,
  assignComplaintWorker,
  getComplaintStats
} = require('../controllers/complaintController');

const { protect, adminOnly } = require('../middleware/auth');
const upload = require('../middleware/upload');

// User & Admin shared endpoints (Requires login)
router.post('/', protect, upload.single('image'), createComplaint);
router.get('/user', protect, getUserComplaints);

// Admin-only endpoints
router.get('/', protect, adminOnly, getAllComplaints);
router.get('/stats', protect, adminOnly, getComplaintStats);
router.put('/:id/status', protect, adminOnly, updateComplaintStatus);
router.put('/:id/assign', protect, adminOnly, assignComplaintWorker);

module.exports = router;
