const express = require('express');
const router = express.Router();
const classController = require('./classController');
const { authenticateToken, requireRole } = require('../../middleware/auth');

// All class routes are strictly protected for Admin
router.use(authenticateToken);
router.use(requireRole('admin'));

router.get('/', classController.listClasses);
router.post('/', classController.createClass);
router.put('/:id', classController.updateClass);
router.delete('/:id', classController.deleteClass);

router.get('/:id/students', classController.getClassStudents);
router.post('/:id/students', classController.addStudentToClass);
router.delete('/:id/students/:studentId', classController.removeStudentFromClass);
router.get('/:id/students/:studentId/progress-detail', classController.getStudentProgressDetail);

module.exports = router;
