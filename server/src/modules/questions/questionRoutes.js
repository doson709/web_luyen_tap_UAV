const express = require('express');
const router = express.Router();
const questionController = require('./questionController');
const { authenticateToken, requireRole } = require('../../middleware/auth');

// Public or authenticated query
router.get('/', questionController.listQuestions);
router.get('/:id', questionController.getQuestionById);

// Teacher and Admin routes for editing
router.put('/:id/explanation', authenticateToken, requireRole('teacher', 'admin'), questionController.updateExplanation);
router.put('/:id', authenticateToken, requireRole('teacher', 'admin'), questionController.updateQuestion);
router.post('/', authenticateToken, requireRole('teacher', 'admin'), questionController.createQuestion);

module.exports = router;
