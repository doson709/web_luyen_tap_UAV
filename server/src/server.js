const app = require('./app');
const config = require('./config/config');

const server = app.listen(config.PORT, () => {
  console.log(`====================================================`);
  console.log(` UAV Practice & Exam Server running on port ${config.PORT}`);
  console.log(` API URL: http://localhost:${config.PORT}/api`);
  console.log(` Health Check: http://localhost:${config.PORT}/api/health`);
  console.log(`====================================================`);
});

process.on('SIGTERM', () => {
  server.close(() => {
    console.log('Server terminated');
  });
});
