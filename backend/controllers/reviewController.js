const ApiError = require('../utils/ApiError');
const ApiResponse = require('../utils/ApiResponse');
const asyncHandler = require('../utils/asyncHandler');
const Review = require('../models/Review');
const Doctor = require('../models/Doctor');

// Create a review for a doctor
const createReview = asyncHandler(async (req, res) => {
  const { doctorId, rating, comment } = req.body;

  if (!doctorId || !rating || !comment) {
    throw new ApiError(400, 'Doctor ID, rating, and comment are required');
  }

  // Verify the doctor exists
  const doctor = await Doctor.findById(doctorId);
  if (!doctor) {
    throw new ApiError(404, 'Doctor not found');
  }

  // Create review
  const review = await Review.create({
    patient: req.user._id,
    doctor: doctorId,
    rating,
    comment,
  });

  // Recalculate average rating and total reviews
  const reviews = await Review.find({ doctor: doctorId });
  const totalReviews = reviews.length;
  const averageRating = (
    reviews.reduce((acc, curr) => acc + curr.rating, 0) / totalReviews
  ).toFixed(1);

  await Doctor.findByIdAndUpdate(doctorId, {
    averageRating: parseFloat(averageRating),
    totalReviews,
  });

  res.status(201).json(new ApiResponse(201, 'Review submitted successfully', review));
});

// Get reviews for a specific doctor
const getDoctorReviews = asyncHandler(async (req, res) => {
  const { doctorId } = req.params;

  const reviews = await Review.find({ doctor: doctorId })
    .populate('patient', 'name profilePhoto')
    .sort({ createdAt: -1 });

  res.status(200).json(new ApiResponse(200, 'Reviews retrieved successfully', reviews));
});

module.exports = {
  createReview,
  getDoctorReviews,
};
