const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema(
  {
    patient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Patient reference is required'],
    },
    doctor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Doctor',
      required: [true, 'Doctor reference is required'],
    },
    rating: {
      type: Number,
      required: [true, 'Rating is required'],
      min: [1, 'Rating must be at least 1'],
      max: [5, 'Rating cannot exceed 5'],
    },
    comment: {
      type: String,
      trim: true,
      required: [true, 'Review comment is required'],
    },
  },
  {
    timestamps: true,
  }
);

// Prevent multiple reviews from the same patient for the same doctor
reviewSchema.index({ patient: 1, doctor: 1 }, { unique: true });

const Review = mongoose.model('Review', reviewSchema);

module.exports = Review;
