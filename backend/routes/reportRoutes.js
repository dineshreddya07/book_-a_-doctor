const express = require('express');
const { protect, authorize } = require('../middleware/auth');
const { upload } = require('../middleware/upload');
const {
  uploadReport,
  getMyReports,
  getPatientReports,
  deleteReport,
} = require('../controllers/reportController');

const router = express.Router();

const setUploadType = (type) => (req, res, next) => {
  req.uploadType = type;
  next();
};

router.use(protect);

router.post('/', setUploadType('reports'), upload.single('file'), uploadReport);
router.get('/', getMyReports);
router.get('/patient/:patientId', authorize('doctor', 'admin'), getPatientReports);
router.delete('/:id', deleteReport);

module.exports = router;
