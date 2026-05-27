const express = require('express');
const router = express.Router();
const InterviewController = require('../controllers/interviewController');

router.post('/start-session', InterviewController.startSession);
router.post('/next-question', InterviewController.nextQuestion);
router.post('/end-session', InterviewController.endSession);

module.exports = router;
