const { body } = require('express-validator');

const registerValidator = [
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('email').isEmail().withMessage('Valid email is required'),
  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters'),
  body('role')
    .optional()
    .isIn(['patient', 'doctor'])
    .withMessage('Role must be patient or doctor'),
  body('phone').optional().trim().isString(),
  body('address').optional().trim().isString(),
];

const loginValidator = [
  body('email').isEmail().withMessage('Valid email is required'),
  body('password').notEmpty().withMessage('Password is required'),
];

module.exports = {
  registerValidator,
  loginValidator,
};
