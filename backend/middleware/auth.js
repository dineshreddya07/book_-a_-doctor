const jwt = require('jsonwebtoken');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');
const User = require('../models/User');
const { jwt: jwtConfig } = require('../config/env');

const protect = asyncHandler(async (req, res, next) => {
  const authorization = req.headers.authorization || '';
  const token = authorization.startsWith('Bearer ') ? authorization.split(' ')[1] : null;

  if (!token) {
    throw new ApiError(401, 'Authorization token required');
  }

  let decoded;
  try {
    decoded = jwt.verify(token, jwtConfig.secret);
  } catch (error) {
    throw new ApiError(401, 'Invalid or expired token');
  }

  const user = await User.findById(decoded.id);
  if (!user) {
    throw new ApiError(401, 'User not found');
  }

  req.user = user;
  next();
});

const authorize = (...roles) => (req, res, next) => {
  if (!roles.includes(req.user.role)) {
    return next(new ApiError(403, 'Forbidden'));
  }
  next();
};

module.exports = {
  protect,
  authorize,
};
