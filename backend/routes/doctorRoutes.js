const express = require('express');
const validate = require('../middleware/validate');
const { protect, authorize } = require('../middleware/auth');
const {
  getDoctors,
  getDoctorById,
  updateDoctor,
  updateDoctorStatus,
  createDoctor,
  getDoctorProfile,
} = require('../controllers/doctorController');
const {
  doctorUpdateValidator,
  doctorStatusValidator,
  doctorCreateValidator,
  idParamValidator,
} = require('../validators/doctorValidator');

const router = express.Router();

router.get('/', getDoctors);
router.get('/:id', idParamValidator, validate, getDoctorById);

router.use(protect);
router.get('/profile/me', authorize('doctor'), getDoctorProfile);
router.post('/', authorize('admin'), doctorCreateValidator, validate, createDoctor);
router.put('/:id', authorize('doctor'), doctorUpdateValidator, validate, updateDoctor);
router.patch('/:id/status', authorize('admin'), doctorStatusValidator, validate, updateDoctorStatus);

module.exports = router;
