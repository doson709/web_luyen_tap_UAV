const express = require('express');
const router = express.Router();
const practiceController = require('./practiceController');
const { authenticateToken } = require('../../middleware/auth');

router.post('/submit', practiceController.submitAnswer);
router.post('/session', practiceController.createSession);
router.get('/stats', practiceController.getStats);

router.post('/answer', authenticateToken, practiceController.recordAnswer);
router.delete('/answer/:questionId', authenticateToken, practiceController.deleteAnswer);
router.get('/progress', authenticateToken, practiceController.getProgress);

module.exports = router;
