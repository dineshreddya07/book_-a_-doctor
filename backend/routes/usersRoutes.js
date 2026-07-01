const express = require('express');
const validate = require('../middleware/validate');
const { protect, authorize } = require('../middleware/auth');
const {
  getUsers,
  getUserById,
  updateMe,
  deleteUser,
} = require('../controllers/userController');
const { updateUserValidator, idParamValidator } = require('../validators/userValidator');

const router = express.Router();

router.use(protect);

router.get('/', authorize('admin'), getUsers);
router.get('/:id', authorize('admin'), idParamValidator, validate, getUserById);
router.put('/me', updateUserValidator, validate, updateMe);
router.delete('/:id', authorize('admin'), idParamValidator, validate, deleteUser);

module.exports = router;
