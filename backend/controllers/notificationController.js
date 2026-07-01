const ApiError = require('../utils/ApiError');
const ApiResponse = require('../utils/ApiResponse');
const asyncHandler = require('../utils/asyncHandler');
const Notification = require('../models/Notification');

// Get all notifications for current user
const getNotifications = asyncHandler(async (req, res) => {
  const notifications = await Notification.find({ recipient: req.user._id }).sort({ createdAt: -1 });
  res.status(200).json(new ApiResponse(200, 'Notifications retrieved', notifications));
});

// Mark single notification as read
const markRead = asyncHandler(async (req, res) => {
  const notification = await Notification.findOneAndUpdate(
    { _id: req.params.id, recipient: req.user._id },
    { isRead: true },
    { new: true }
  );

  if (!notification) {
    throw new ApiError(404, 'Notification not found');
  }

  res.status(200).json(new ApiResponse(200, 'Notification marked as read', notification));
});

// Mark all notifications as read
const markAllRead = asyncHandler(async (req, res) => {
  await Notification.updateMany({ recipient: req.user._id, isRead: false }, { isRead: true });
  res.status(200).json(new ApiResponse(200, 'All notifications marked as read', null));
});

// Delete a notification
const deleteNotification = asyncHandler(async (req, res) => {
  const notification = await Notification.findOneAndDelete({ _id: req.params.id, recipient: req.user._id });

  if (!notification) {
    throw new ApiError(404, 'Notification not found');
  }

  res.status(200).json(new ApiResponse(200, 'Notification deleted successfully', null));
});

module.exports = {
  getNotifications,
  markRead,
  markAllRead,
  deleteNotification,
};
