const ApiError = require('../utils/ApiError');
const ApiResponse = require('../utils/ApiResponse');
const asyncHandler = require('../utils/asyncHandler');
const Appointment = require('../models/Appointment');
const Doctor = require('../models/Doctor');
const Notification = require('../models/Notification');
const { notifyUser } = require('../utils/socket');
const { NOTIFICATION_TYPES } = require('../utils/constants');

const getAppointments = asyncHandler(async (req, res) => {
  let query = {};

  if (req.user.role === 'patient') {
    query.patient = req.user._id;
  }

  if (req.user.role === 'doctor') {
    const doctor = await Doctor.findOne({ user: req.user._id });
    if (!doctor) {
      throw new ApiError(404, 'Doctor profile not found');
    }
    query.doctor = doctor._id;
  }

  const appointments = await Appointment.find(query)
    .populate('patient', 'name email role profilePhoto phone address')
    .populate({
      path: 'doctor',
      populate: {
        path: 'user',
        select: 'name email role profilePhoto phone address',
      },
    })
    .sort({ appointmentDate: 1 });

  res.status(200).json(new ApiResponse(200, 'Appointments retrieved', appointments));
});

const getAppointmentById = asyncHandler(async (req, res) => {
  const appointment = await Appointment.findById(req.params.id)
    .populate('patient', 'name email role profilePhoto phone address')
    .populate({
      path: 'doctor',
      populate: {
        path: 'user',
        select: 'name email role profilePhoto phone address',
      },
    });

  if (!appointment) {
    throw new ApiError(404, 'Appointment not found');
  }

  if (
    req.user.role === 'patient' &&
    appointment.patient._id.toString() !== req.user._id.toString()
  ) {
    throw new ApiError(403, 'Forbidden');
  }

  if (req.user.role === 'doctor') {
    const doctor = await Doctor.findOne({ user: req.user._id });
    if (!doctor || appointment.doctor._id.toString() !== doctor._id.toString()) {
      throw new ApiError(403, 'Forbidden');
    }
  }

  res.status(200).json(new ApiResponse(200, 'Appointment retrieved', appointment));
});

const createAppointment = asyncHandler(async (req, res) => {
  const { doctor: doctorId, appointmentDate, reason } = req.body;

  const doctor = await Doctor.findById(doctorId).populate('user', 'name');
  if (!doctor || doctor.status !== 'approved') {
    throw new ApiError(400, 'Doctor is unavailable for booking');
  }

  const appointment = await Appointment.create({
    patient: req.user._id,
    doctor: doctor._id,
    appointmentDate,
    reason,
    status: 'pending',
  });

  // Create notification for Doctor
  const notification = await Notification.create({
    recipient: doctor.user._id,
    type: NOTIFICATION_TYPES.APPOINTMENT_BOOKED,
    title: 'New Appointment Booking',
    message: `Patient ${req.user.name} has requested an appointment on ${new Date(appointmentDate).toLocaleDateString()}`,
    link: `/doctor`,
  });

  // Broadcast via Socket.io
  notifyUser(doctor.user._id, NOTIFICATION_TYPES.APPOINTMENT_BOOKED, notification);

  res.status(201).json(new ApiResponse(201, 'Appointment created', appointment));
});

const updateAppointment = asyncHandler(async (req, res) => {
  const appointment = await Appointment.findById(req.params.id).populate({
    path: 'doctor',
    populate: { path: 'user', select: 'name' },
  });

  if (!appointment) {
    throw new ApiError(404, 'Appointment not found');
  }

  // Authorize
  if (
    req.user.role === 'patient' &&
    appointment.patient.toString() !== req.user._id.toString()
  ) {
    throw new ApiError(403, 'Forbidden');
  }

  let doctorProfileId = null;
  if (req.user.role === 'doctor') {
    const doctor = await Doctor.findOne({ user: req.user._id });
    if (!doctor || appointment.doctor._id.toString() !== doctor._id.toString()) {
      throw new ApiError(403, 'Forbidden');
    }
    doctorProfileId = doctor._id;
  }

  const oldStatus = appointment.status;
  const updates = req.body;

  Object.assign(appointment, updates);
  await appointment.save();

  // Trigger Notifications & Realtime updates based on status shifts
  if (updates.status && updates.status !== oldStatus) {
    let recipientId = appointment.patient;
    let notifyType = NOTIFICATION_TYPES.APPOINTMENT_APPROVED;
    let title = 'Appointment Status Updated';
    let message = `Your appointment status has changed to ${updates.status}`;
    let link = '/patient';

    const doctorName = appointment.doctor?.user?.name || 'Doctor';

    if (updates.status === 'approved') {
      notifyType = NOTIFICATION_TYPES.APPOINTMENT_APPROVED;
      title = 'Appointment Approved';
      message = `Your appointment with Dr. ${doctorName} has been approved.`;
    } else if (updates.status === 'rejected') {
      notifyType = NOTIFICATION_TYPES.APPOINTMENT_REJECTED;
      title = 'Appointment Rejected';
      message = `Your appointment with Dr. ${doctorName} has been rejected.`;
    } else if (updates.status === 'completed') {
      notifyType = NOTIFICATION_TYPES.APPOINTMENT_COMPLETED;
      title = 'Appointment Completed';
      message = `Your consultation with Dr. ${doctorName} is complete. You can download prescriptions.`;
    } else if (updates.status === 'cancelled') {
      notifyType = NOTIFICATION_TYPES.APPOINTMENT_CANCELLED;
      // If patient cancelled, recipient is doctor. If doctor cancelled, recipient is patient.
      if (req.user.role === 'patient') {
        recipientId = appointment.doctor.user;
        title = 'Appointment Cancelled';
        message = `Appointment scheduled for ${new Date(appointment.appointmentDate).toLocaleDateString()} was cancelled by patient ${req.user.name}.`;
        link = '/doctor';
      } else {
        recipientId = appointment.patient;
        title = 'Appointment Cancelled';
        message = `Your appointment on ${new Date(appointment.appointmentDate).toLocaleDateString()} was cancelled by Dr. ${doctorName}.`;
        link = '/patient';
      }
    } else if (updates.status === 'rescheduled') {
      notifyType = NOTIFICATION_TYPES.APPOINTMENT_RESCHEDULED;
      if (req.user.role === 'patient') {
        recipientId = appointment.doctor.user;
        title = 'Appointment Rescheduled Request';
        message = `Patient ${req.user.name} rescheduled their visit to ${new Date(appointment.appointmentDate).toLocaleString()}.`;
        link = '/doctor';
      } else {
        recipientId = appointment.patient;
        title = 'Appointment Rescheduled';
        message = `Dr. ${doctorName} has rescheduled your appointment to ${new Date(appointment.appointmentDate).toLocaleString()}.`;
        link = '/patient';
      }
    }

    const notification = await Notification.create({
      recipient: recipientId,
      type: notifyType,
      title,
      message,
      link,
    });

    notifyUser(recipientId, notifyType, notification);
  }

  res.status(200).json(new ApiResponse(200, 'Appointment updated', appointment));
});

const deleteAppointment = asyncHandler(async (req, res) => {
  const appointment = await Appointment.findById(req.params.id);
  if (!appointment) {
    throw new ApiError(404, 'Appointment not found');
  }

  if (
    req.user.role === 'patient' &&
    appointment.patient.toString() !== req.user._id.toString()
  ) {
    throw new ApiError(403, 'Forbidden');
  }

  if (req.user.role === 'doctor') {
    const doctor = await Doctor.findOne({ user: req.user._id });
    if (!doctor || appointment.doctor.toString() !== doctor._id.toString()) {
      throw new ApiError(403, 'Forbidden');
    }
  }

  await Appointment.findByIdAndDelete(appointment._id);
  res.status(200).json(new ApiResponse(200, 'Appointment deleted', null));
});

module.exports = {
  getAppointments,
  getAppointmentById,
  createAppointment,
  updateAppointment,
  deleteAppointment,
};
