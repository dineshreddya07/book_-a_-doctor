const express = require('express');
const { protect } = require('../middleware/auth');
const { upload } = require('../middleware/upload');
const {
  sendMessage,
  getChatHistory,
  getConversations,
  markAsRead,
} = require('../controllers/messageController');

const router = express.Router();

const setUploadType = (type) => (req, res, next) => {
  req.uploadType = type;
  next();
};

router.use(protect);

router.post('/', setUploadType('chat'), upload.single('file'), sendMessage);
router.get('/', getConversations);
router.get('/history/:partnerId', getChatHistory);
router.patch('/read', markAsRead);

module.exports = router;
