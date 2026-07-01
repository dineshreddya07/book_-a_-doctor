const jwt = require('jsonwebtoken');
const ApiError = require('../utils/ApiError');
const ApiResponse = require('../utils/ApiResponse');
const asyncHandler = require('../utils/asyncHandler');
const User = require('../models/User');
const Doctor = require('../models/Doctor');
const { jwt: jwtConfig } = require('../config/env');

const generateToken = (user) => {
  return jwt.sign({ id: user._id, role: user.role }, jwtConfig.secret, {
    expiresIn: jwtConfig.expiresIn,
  });
};

const sanitizeUser = (user) => {
  const safeUser = user.toObject({ getters: true });
  delete safeUser.password;
  return {
    id: safeUser._id,
    name: safeUser.name,
    email: safeUser.email,
    role: safeUser.role,
    phone: safeUser.phone,
    address: safeUser.address,
    profilePhoto: safeUser.profilePhoto,
    isEmailVerified: safeUser.isEmailVerified,
    createdAt: safeUser.createdAt,
    updatedAt: safeUser.updatedAt,
  };
};

const register = asyncHandler(async (req, res) => {
  const { name, email, password, role = 'patient', phone, address } = req.body;

  const existingUser = await User.findOne({ email });
  if (existingUser) {
    throw new ApiError(409, 'Email already registered');
  }

  const user = await User.create({ name, email, password, role, phone, address });

  if (role === 'doctor') {
    await Doctor.create({ user: user._id, status: 'approved' });
  }

  const token = generateToken(user);

  res.status(201).json(
    new ApiResponse(201, 'Registration successful', {
      token,
      user: sanitizeUser(user),
    })
  );
});

const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email }).select('+password');
  if (!user || !(await user.comparePassword(password))) {
    throw new ApiError(401, 'Invalid email or password');
  }

  if (user.status === 'suspended') {
    throw new ApiError(403, 'Your account has been suspended. Please contact support.');
  }

  const token = generateToken(user);

  res.status(200).json(
    new ApiResponse(200, 'Login successful', {
      token,
      user: sanitizeUser(user),
    })
  );
});

const getMe = asyncHandler(async (req, res) => {
  res.status(200).json(new ApiResponse(200, 'User profile retrieved', { user: sanitizeUser(req.user) }));
});

module.exports = {
  register,
  login,
  getMe,
};
