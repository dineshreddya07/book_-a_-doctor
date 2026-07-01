const mongoose = require('mongoose');
const { DOCTOR_STATUS } = require('../utils/constants');

const doctorSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },
    specialty: {
      type: String,
      trim: true,
    },
    qualifications: [
      {
        type: String,
        trim: true,
      },
    ],
    licenseNumber: {
      type: String,
      trim: true,
    },
    experienceYears: {
      type: Number,
      min: 0,
      default: 0,
    },
    clinicAddress: {
      type: String,
      trim: true,
    },
    bio: {
      type: String,
      trim: true,
    },
    fees: {
      type: Number,
      default: 0,
      min: 0,
    },
    averageRating: {
      type: Number,
      default: 5.0,
      min: 0,
      max: 5,
    },
    totalReviews: {
      type: Number,
      default: 0,
    },
    education: [
      {
        type: String,
        trim: true,
      },
    ],
    availability: [
      {
        day: {
          type: String,
          enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
        },
        slots: [
          {
            type: String, // e.g., '09:00 AM'
          },
        ],
      },
    ],
    status: {
      type: String,
      enum: Object.values(DOCTOR_STATUS),
      default: DOCTOR_STATUS.PENDING,
    },
  },
  {
    timestamps: true,
  }
);

const Doctor = mongoose.model('Doctor', doctorSchema);

module.exports = Doctor;
