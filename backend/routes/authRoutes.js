const express = require('express');
const { register, login, getMe } = require('../controllers/authController');
const validate = require('../middleware/validate');
const { protect } = require('../middleware/auth');
const { registerValidator, loginValidator } = require('../validators/authValidator');

const router = express.Router();

router.post('/register', registerValidator, validate, register);
router.post('/login', loginValidator, validate, login);
router.get('/me', protect, getMe);

module.exports = router;
