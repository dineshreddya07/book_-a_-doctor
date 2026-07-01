const express = require('express');
const { askAssistant, getAiHistory, clearAiHistory } = require('../controllers/aiController');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.use(protect);

router.post('/chat', askAssistant);
router.get('/history', getAiHistory);
router.delete('/history', clearAiHistory);

module.exports = router;
