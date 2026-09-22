const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const errorHandler = require('./middleware/errorHandler');

const authRoutes = require('./modules/auth/authRoutes');
const userRoutes = require('./modules/users/userRoutes');
const curriculumRoutes = require('./modules/curriculum/curriculumRoutes');
const questionRoutes = require('./modules/questions/questionRoutes');
const practiceRoutes = require('./modules/practice/practiceRoutes');
const classRoutes = require('./modules/classes/classRoutes');

const app = express();

app.use(cors({ origin: '*' }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check
app.get(['/api/health', '/uav-web/api/health'], (req, res) => {
  res.json({ status: 'ok', service: 'UAV Practice & Exam API', timestamp: new Date().toISOString() });
});

// Mount API modules (hỗ trợ cả /api và /uav-web/api)
const mountApis = (prefix) => {
  app.use(`${prefix}/auth`, authRoutes);
  app.use(`${prefix}/users`, userRoutes);
  app.use(`${prefix}/classes`, classRoutes);
  app.use(`${prefix}/curriculum`, curriculumRoutes);
  app.use(`${prefix}/questions`, questionRoutes);
  app.use(`${prefix}/practice`, practiceRoutes);
};
mountApis('/api');
mountApis('/uav-web/api');

// Serve static frontend from client/dist if built
const clientDistPath = path.resolve(__dirname, '../../client/dist');
if (fs.existsSync(clientDistPath)) {
  app.use('/uav-web', express.static(clientDistPath));
  app.use(express.static(clientDistPath));
  app.use((req, res, next) => {
    if (req.method === 'GET' && !req.path.includes('/api')) {
      return res.sendFile(path.join(clientDistPath, 'index.html'));
    }
    next();
  });
}

// Error handler
app.use(errorHandler);

module.exports = app;
