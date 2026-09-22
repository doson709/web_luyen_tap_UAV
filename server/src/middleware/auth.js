const jwt = require('jsonwebtoken');
const config = require('../config/config');
const db = require('../config/db');
const { touchUser } = require('../utils/onlineTracker');

function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ success: false, message: 'Yêu cầu đăng nhập để truy cập tài nguyên.' });
  }

  try {
    const decoded = jwt.verify(token, config.JWT_SECRET);
    // Fetch latest user info from DB
    const user = db.prepare('SELECT id, username, full_name, role, email, department, is_active FROM users WHERE id = ?').get(decoded.id);
    
    if (!user || !user.is_active) {
      return res.status(403).json({ success: false, message: 'Tài khoản không tồn tại hoặc đã bị khóa.' });
    }

    // Touch user in onlineTracker
    touchUser(user.id);

    req.user = user;
    next();
  } catch (err) {
    return res.status(403).json({ success: false, message: 'Phiên đăng nhập không hợp lệ hoặc đã hết hạn.' });
  }
}

function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Chưa đăng nhập.' });
    }
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ 
        success: false, 
        message: `Bạn không có quyền thực hiện thao tác này. Quyền yêu cầu: [${roles.join(', ')}], quyền hiện tại: [${req.user.role}].` 
      });
    }
    next();
  };
}

module.exports = {
  authenticateToken,
  requireRole
};
