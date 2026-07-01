const asyncHandler = require('../utils/asyncHandler');
const ApiResponse = require('../utils/ApiResponse');

const getHealth = asyncHandler(async (req, res) => {
  res.status(200).json(
    new ApiResponse(200, 'Book a Doctor API is running', {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development',
    })
  );
});

module.exports = { getHealth };
