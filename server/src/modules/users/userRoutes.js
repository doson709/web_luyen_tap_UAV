const express = require('express');
const router = express.Router();
const userController = require('./userController');
const { authenticateToken, requireRole } = require('../../middleware/auth');

// All user management routes require admin role
router.use(authenticateToken);
router.use(requireRole('admin'));

router.get('/', userController.listUsers);
router.post('/', userController.createUser);
router.put('/:id', userController.updateUser);
router.delete('/:id', userController.deleteUser);

module.exports = router;
