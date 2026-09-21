const express = require('express');
const router = express.Router();
const practiceController = require('./practiceController');

router.post('/submit', practiceController.submitAnswer);
router.post('/session', practiceController.createSession);
router.get('/stats', practiceController.getStats);

module.exports = router;
