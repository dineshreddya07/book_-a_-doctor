const mongoose = require('mongoose');

const reportSchema = new mongoose.Schema(
  {
    patient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    doctor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Doctor',
    },
    title: {
      type: String,
      required: [true, 'Report title is required'],
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    fileUrl: {
      type: String,
      required: [true, 'Report file URL is required'],
      trim: true,
    },
    fileType: {
      type: String,
      trim: true,
      default: 'pdf',
    },
  },
  {
    timestamps: true,
  }
);

const Report = mongoose.model('Report', reportSchema);

module.exports = Report;
