const express = require('express');
const { protect, authorize } = require('../middleware/auth');
const {
  getAdminStats,
  toggleUserStatus,
  getAllAIChats,
  broadcastNotification,
} = require('../controllers/adminController');

const router = express.Router();

router.use(protect);
router.use(authorize('admin'));

router.get('/stats', getAdminStats);
router.patch('/users/:userId/status', toggleUserStatus);
router.get('/ai-logs', getAllAIChats);
router.post('/broadcast', broadcastNotification);

module.exports = router;
