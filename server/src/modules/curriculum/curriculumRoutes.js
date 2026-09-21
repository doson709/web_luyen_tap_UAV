const express = require('express');
const router = express.Router();
const curriculumController = require('./curriculumController');
const { authenticateToken } = require('../../middleware/auth');

// Public or authenticated reading
router.get('/tree', curriculumController.getCurriculumTree);
router.get('/programs', curriculumController.getPrograms);
router.get('/modules', curriculumController.getModules);
router.get('/modules/:moduleId/topics', curriculumController.getTopics);

module.exports = router;
