const { body, param } = require('express-validator');

const idParamValidator = [
  param('id').isMongoId().withMessage('Valid id is required'),
];

const appointmentCreateValidator = [
  body('doctor').isMongoId().withMessage('Valid doctor id is required'),
  body('appointmentDate')
    .isISO8601()
    .toDate()
    .withMessage('Valid appointment date is required'),
  body('reason').optional().trim().isString(),
];

const appointmentUpdateValidator = [
  body('appointmentDate').optional().isISO8601().toDate().withMessage('Valid appointment date is required'),
  body('reason').optional().trim().isString(),
  body('status')
    .optional()
    .isIn(['pending', 'approved', 'rejected', 'completed', 'cancelled', 'rescheduled'])
    .withMessage('Invalid appointment status'),
];

module.exports = {
  appointmentCreateValidator,
  appointmentUpdateValidator,
  idParamValidator,
};
