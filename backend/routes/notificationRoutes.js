const express = require('express');
const { protect } = require('../middleware/auth');
const {
  getNotifications,
  markRead,
  markAllRead,
  deleteNotification,
} = require('../controllers/notificationController');

const router = express.Router();

router.use(protect);

router.get('/', getNotifications);
router.patch('/read-all', markAllRead);
router.patch('/:id/read', markRead);
router.delete('/:id', deleteNotification);

module.exports = router;
