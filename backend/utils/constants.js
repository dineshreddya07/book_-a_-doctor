const USER_ROLES = {
  PATIENT: 'patient',
  DOCTOR: 'doctor',
  ADMIN: 'admin',
};

const APPOINTMENT_STATUS = {
  PENDING: 'pending',
  APPROVED: 'approved',
  REJECTED: 'rejected',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
  RESCHEDULED: 'rescheduled',
};

const DOCTOR_STATUS = {
  PENDING: 'pending',
  APPROVED: 'approved',
  REJECTED: 'rejected',
  SUSPENDED: 'suspended',
};

const NOTIFICATION_TYPES = {
  APPOINTMENT_BOOKED: 'appointment_booked',
  APPOINTMENT_CANCELLED: 'appointment_cancelled',
  APPOINTMENT_APPROVED: 'appointment_approved',
  APPOINTMENT_REJECTED: 'appointment_rejected',
  APPOINTMENT_COMPLETED: 'appointment_completed',
  APPOINTMENT_RESCHEDULED: 'appointment_rescheduled',
  DOCTOR_APPROVED: 'doctor_approved',
  DOCTOR_REJECTED: 'doctor_rejected',
  REPORT_UPLOADED: 'report_uploaded',
  AI_ANALYSIS_COMPLETED: 'ai_analysis_completed',
};

const ALLOWED_FILE_TYPES = {
  IMAGES: ['image/jpeg', 'image/jpg', 'image/png'],
  DOCUMENTS: ['application/pdf'],
};

const ALLOWED_EXTENSIONS = ['.pdf', '.jpg', '.jpeg', '.png'];

module.exports = {
  USER_ROLES,
  APPOINTMENT_STATUS,
  DOCTOR_STATUS,
  NOTIFICATION_TYPES,
  ALLOWED_FILE_TYPES,
  ALLOWED_EXTENSIONS,
};
