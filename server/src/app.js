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

const app = express();

app.use(cors({ origin: '*' }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', service: 'UAV Practice & Exam API', timestamp: new Date().toISOString() });
});

// Mount API modules
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/curriculum', curriculumRoutes);
app.use('/api/questions', questionRoutes);
app.use('/api/practice', practiceRoutes);

// Serve static frontend from client/dist if built
const clientDistPath = path.resolve(__dirname, '../../client/dist');
if (fs.existsSync(clientDistPath)) {
  app.use(express.static(clientDistPath));
  app.use((req, res, next) => {
    if (req.method === 'GET' && !req.path.startsWith('/api')) {
      return res.sendFile(path.join(clientDistPath, 'index.html'));
    }
    next();
  });
}

// Error handler
app.use(errorHandler);

module.exports = app;
