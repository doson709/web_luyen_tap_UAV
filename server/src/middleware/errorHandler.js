function errorHandler(err, req, res, next) {
  console.error('[Error] Server error:', err);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Đã xảy ra lỗi máy chủ nội bộ. Vui lòng thử lại sau.',
    error: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
}

module.exports = errorHandler;
