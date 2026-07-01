const express = require('express');
const { protect, authorize } = require('../middleware/auth');
const { createReview, getDoctorReviews } = require('../controllers/reviewController');

const router = express.Router();

router.post('/', protect, authorize('patient'), createReview);
router.get('/doctor/:doctorId', getDoctorReviews);

module.exports = router;
