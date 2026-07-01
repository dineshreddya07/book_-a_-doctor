const { body, param } = require('express-validator');
const { USER_ROLES } = require('../utils/constants');

const idParamValidator = [
  param('id').isMongoId().withMessage('Valid id is required'),
];

const updateUserValidator = [
  body('name').optional().trim().notEmpty().withMessage('Name cannot be empty'),
  body('email').optional().isEmail().withMessage('Valid email is required'),
  body('password')
    .optional()
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters'),
  body('role')
    .optional()
    .isIn(Object.values(USER_ROLES))
    .withMessage('Invalid role'),
  body('phone').optional().trim().isString(),
  body('address').optional().trim().isString(),
];

module.exports = {
  idParamValidator,
  updateUserValidator,
};
