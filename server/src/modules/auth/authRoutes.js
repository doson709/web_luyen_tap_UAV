const express = require('express');
const router = express.Router();
const authController = require('./authController');
const { authenticateToken } = require('../../middleware/auth');

router.post('/login', authController.login);
router.post('/sso-login', authController.ssoLogin);
router.get('/me', authenticateToken, authController.getMe);
router.post('/heartbeat', authenticateToken, authController.heartbeat);
router.post('/logout', authenticateToken, authController.logout);

module.exports = router;
