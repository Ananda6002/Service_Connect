const express = require('express');
const router = express.Router();
const { getNotifications, markAllAsRead, markAsRead } = require('../controllers/notificationController');
const { protect } = require('../middleware/auth');

router.get('/', protect, getNotifications);
router.put('/read', protect, markAllAsRead);
router.put('/:id/read', protect, markAsRead);

module.exports = router;
