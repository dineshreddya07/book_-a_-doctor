const ApiError = require('../utils/ApiError');
const ApiResponse = require('../utils/ApiResponse');
const asyncHandler = require('../utils/asyncHandler');
const Report = require('../models/Report');
const { uploadToCloud } = require('../services/uploadService');
const { notifyUser } = require('../utils/socket');
const Notification = require('../models/Notification');
const { NOTIFICATION_TYPES } = require('../utils/constants');

// Create a new report (Patient uploads)
const uploadReport = asyncHandler(async (req, res) => {
  const { title, description, doctorId } = req.body;

  if (!req.file) {
    throw new ApiError(400, 'Report file is required');
  }

  const fileUrl = await uploadToCloud(req.file, 'reports');
  const fileType = req.file.mimetype === 'application/pdf' ? 'pdf' : 'image';

  const report = await Report.create({
    patient: req.user._id,
    doctor: doctorId || null,
    title,
    description,
    fileUrl,
    fileType,
  });

  // If a doctor is specified, notify them about the uploaded report
  if (doctorId) {
    const notifyTitle = 'New Medical Report Uploaded';
    const notifyMsg = `${req.user.name} has shared a medical report: "${title}"`;
    
    const notification = await Notification.create({
      recipient: doctorId,
      type: NOTIFICATION_TYPES.REPORT_UPLOADED,
      title: notifyTitle,
      message: notifyMsg,
      link: `/doctor/patients`,
    });

    notifyUser(doctorId, NOTIFICATION_TYPES.REPORT_UPLOADED, notification);
  }

  res.status(201).json(new ApiResponse(201, 'Report uploaded successfully', report));
});

// Get reports for the currently logged in patient
const getMyReports = asyncHandler(async (req, res) => {
  const reports = await Report.find({ patient: req.user._id })
    .populate('doctor', 'user specialty clinicAddress')
    .sort({ createdAt: -1 });

  // Deep populate doctor name
  const populatedReports = await Report.populate(reports, {
    path: 'doctor.user',
    select: 'name profilePhoto',
  });

  res.status(200).json(new ApiResponse(200, 'Reports retrieved', populatedReports));
});

// Get reports for a patient (Doctor or Admin checks)
const getPatientReports = asyncHandler(async (req, res) => {
  const { patientId } = req.params;

  // Verify access permissions: Only doctor or admin can fetch others' reports
  if (req.user.role === 'patient' && req.user._id.toString() !== patientId) {
    throw new ApiError(403, 'You do not have access to view these reports');
  }

  const reports = await Report.find({ patient: patientId })
    .populate('doctor', 'user specialty')
    .sort({ createdAt: -1 });

  const populatedReports = await Report.populate(reports, {
    path: 'doctor.user',
    select: 'name profilePhoto',
  });

  res.status(200).json(new ApiResponse(200, 'Patient reports retrieved', populatedReports));
});

// Delete a report
const deleteReport = asyncHandler(async (req, res) => {
  const report = await Report.findById(req.params.id);

  if (!report) {
    throw new ApiError(404, 'Report not found');
  }

  // Check if patient owns it or user is admin
  if (report.patient.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
    throw new ApiError(403, 'Unauthorized to delete this report');
  }

  await Report.findByIdAndDelete(req.params.id);
  res.status(200).json(new ApiResponse(200, 'Report deleted successfully', null));
});

module.exports = {
  uploadReport,
  getMyReports,
  getPatientReports,
  deleteReport,
};
