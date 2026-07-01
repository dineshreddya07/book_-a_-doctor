const ApiError = require('../utils/ApiError');
const ApiResponse = require('../utils/ApiResponse');
const asyncHandler = require('../utils/asyncHandler');
const Message = require('../models/Message');
const User = require('../models/User');
const { uploadToCloud } = require('../services/uploadService');
const { sendLiveMessage } = require('../utils/socket');

// Send a message
const sendMessage = asyncHandler(async (req, res) => {
  const { recipientId, text } = req.body;

  if (!recipientId) {
    throw new ApiError(400, 'Recipient ID is required');
  }

  if (!text && !req.file) {
    throw new ApiError(400, 'Message text or attachment is required');
  }

  let fileUrl = null;
  if (req.file) {
    fileUrl = await uploadToCloud(req.file, 'chat');
  }

  const message = await Message.create({
    sender: req.user._id,
    recipient: recipientId,
    text,
    fileUrl,
  });

  // Populate sender details for live broadcast
  const populatedMessage = await Message.findById(message._id)
    .populate('sender', 'name profilePhoto role')
    .populate('recipient', 'name profilePhoto role');

  // Trigger realtime socket emit
  sendLiveMessage(recipientId, populatedMessage);

  res.status(201).json(new ApiResponse(201, 'Message sent successfully', populatedMessage));
});

// Get chat history with a specific partner
const getChatHistory = asyncHandler(async (req, res) => {
  const { partnerId } = req.params;
  const userId = req.user._id;

  const messages = await Message.find({
    $or: [
      { sender: userId, recipient: partnerId },
      { sender: partnerId, recipient: userId },
    ],
  })
    .populate('sender', 'name profilePhoto role')
    .populate('recipient', 'name profilePhoto role')
    .sort({ createdAt: 1 });

  res.status(200).json(new ApiResponse(200, 'Chat history retrieved', messages));
});

// Get list of conversations with last messages and unread counts
const getConversations = asyncHandler(async (req, res) => {
  const userId = req.user._id;

  // Retrieve all messages for the current user
  const messages = await Message.find({
    $or: [{ sender: userId }, { recipient: userId }],
  })
    .sort({ createdAt: -1 });

  const conversationsMap = {};
  for (const msg of messages) {
    const partnerId =
      msg.sender.toString() === userId.toString()
        ? msg.recipient.toString()
        : msg.sender.toString();

    if (!conversationsMap[partnerId]) {
      conversationsMap[partnerId] = msg;
    }
  }

  const conversationList = [];
  for (const partnerId of Object.keys(conversationsMap)) {
    const user = await User.findById(partnerId).select('name role profilePhoto email');
    if (user) {
      const unreadCount = await Message.countDocuments({
        sender: partnerId,
        recipient: userId,
        seen: false,
      });

      conversationList.push({
        user,
        lastMessage: conversationsMap[partnerId],
        unreadCount,
      });
    }
  }

  // Sort by latest message date
  conversationList.sort((a, b) => b.lastMessage.createdAt - a.lastMessage.createdAt);

  res.status(200).json(new ApiResponse(200, 'Conversations list retrieved', conversationList));
});

// Mark messages from a partner as read
const markAsRead = asyncHandler(async (req, res) => {
  const { partnerId } = req.body;

  if (!partnerId) {
    throw new ApiError(400, 'Partner ID is required');
  }

  await Message.updateMany(
    { sender: partnerId, recipient: req.user._id, seen: false },
    { seen: true }
  );

  res.status(200).json(new ApiResponse(200, 'Messages marked as read', null));
});

module.exports = {
  sendMessage,
  getChatHistory,
  getConversations,
  markAsRead,
};
