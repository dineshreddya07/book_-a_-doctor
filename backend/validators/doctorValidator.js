const { body, param } = require('express-validator');
const { DOCTOR_STATUS } = require('../utils/constants');

const idParamValidator = [
  param('id').isMongoId().withMessage('Valid id is required'),
];

const doctorUpdateValidator = [
  body('specialty').optional({ checkFalsy: true }).trim().notEmpty().withMessage('Specialty cannot be empty'),
  body('qualifications').optional({ nullable: true }).isArray().withMessage('Qualifications must be an array'),
  body('licenseNumber').optional({ checkFalsy: true }).trim().notEmpty().withMessage('License number cannot be empty'),
  body('experienceYears')
    .optional({ nullable: true })
    .isInt({ min: 0 })
    .withMessage('Experience years must be a non-negative integer'),
  body('clinicAddress').optional({ checkFalsy: true }).trim().notEmpty().withMessage('Clinic address cannot be empty'),
  body('bio').optional({ nullable: true }).trim().isString(),
];

const doctorStatusValidator = [
  ...idParamValidator,
  body('status')
    .isIn(Object.values(DOCTOR_STATUS))
    .withMessage('Invalid doctor status'),
];

const doctorCreateValidator = [
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('email').isEmail().withMessage('Valid email is required'),
  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters'),
  body('specialty').trim().notEmpty().withMessage('Specialty is required'),
  body('licenseNumber').trim().notEmpty().withMessage('License number is required'),
  body('experienceYears')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Experience years must be a non-negative integer'),
  body('fees')
    .optional()
    .isNumeric({ min: 0 })
    .withMessage('Fees must be a non-negative number'),
  body('clinicAddress').optional().trim().notEmpty().withMessage('Clinic address cannot be empty'),
  body('bio').optional().trim().isString(),
  body('qualifications').optional().isArray().withMessage('Qualifications must be an array'),
  body('education').optional().isArray().withMessage('Education must be an array'),
  body('availability').optional().isArray().withMessage('Availability must be an array'),
];

module.exports = {
  idParamValidator,
  doctorUpdateValidator,
  doctorStatusValidator,
  doctorCreateValidator,
};
