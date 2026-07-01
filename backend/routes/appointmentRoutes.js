const express = require('express');
const validate = require('../middleware/validate');
const { protect, authorize } = require('../middleware/auth');
const {
  getAppointments,
  getAppointmentById,
  createAppointment,
  updateAppointment,
  deleteAppointment,
} = require('../controllers/appointmentController');
const {
  appointmentCreateValidator,
  appointmentUpdateValidator,
  idParamValidator,
} = require('../validators/appointmentValidator');

const router = express.Router();

router.use(protect);
router.get('/', getAppointments);
router.get('/:id', idParamValidator, validate, getAppointmentById);
router.post('/', appointmentCreateValidator, validate, authorize('patient'), createAppointment);
router.put('/:id', idParamValidator, appointmentUpdateValidator, validate, updateAppointment);
router.delete('/:id', idParamValidator, validate, deleteAppointment);

module.exports = router;
