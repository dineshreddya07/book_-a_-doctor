const ApiError = require('../utils/ApiError');
const ApiResponse = require('../utils/ApiResponse');
const asyncHandler = require('../utils/asyncHandler');
const User = require('../models/User');

const getUsers = asyncHandler(async (req, res) => {
  const users = await User.find().select('-password').sort('-createdAt');
  res.status(200).json(new ApiResponse(200, 'Users retrieved', users));
});

const getUserById = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id).select('-password');
  if (!user) {
    throw new ApiError(404, 'User not found');
  }
  res.status(200).json(new ApiResponse(200, 'User retrieved', user));
});

const updateMe = asyncHandler(async (req, res) => {
  const updates = { ...req.body };
  const user = await User.findById(req.user._id).select('+password');

  if (!user) {
    throw new ApiError(404, 'User not found');
  }

  if (updates.password) {
    user.password = updates.password;
    delete updates.password;
  }

  Object.assign(user, updates);
  await user.save();

  const updatedUser = await User.findById(req.user._id).select('-password');
  res.status(200).json(new ApiResponse(200, 'Profile updated', updatedUser));
});

const deleteUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) {
    throw new ApiError(404, 'User not found');
  }
  await User.deleteOne({ _id: user._id });
  res.status(200).json(new ApiResponse(200, 'User deleted', null));
});

module.exports = {
  getUsers,
  getUserById,
  updateMe,
  deleteUser,
};
