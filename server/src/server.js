const app = require('./app');
const config = require('./config/config');

const server = app.listen(config.PORT, () => {
  console.log(`====================================================`);
  console.log(` UAV Practice & Exam Server running on port ${config.PORT}`);
  console.log(` API URL: http://localhost:${config.PORT}/api`);
  console.log(` Health Check: http://localhost:${config.PORT}/api/health`);
  console.log(`====================================================`);
});

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`\n[FATAL ERROR] Cổng ${config.PORT} hiện đang bị chiếm dụng bởi tiến trình khác (EADDRINUSE)!`);
    console.error(`Hãy tắt tiến trình đang chiếm cổng ${config.PORT} hoặc đổi biến PORT sang cổng khác (ví dụ PORT=5001).\n`);
  } else {
    console.error('[FATAL ERROR] Server error:', err);
  }
  process.exit(1);
});

process.on('SIGTERM', () => {
  server.close(() => {
    console.log('Server terminated');
  });
});
