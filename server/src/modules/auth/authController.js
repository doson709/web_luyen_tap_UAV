const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../../config/db');
const config = require('../../config/config');

function generateToken(user) {
  return jwt.sign(
    { id: user.id, username: user.username, role: user.role },
    config.JWT_SECRET,
    { expiresIn: config.JWT_EXPIRES_IN }
  );
}

// Local login
exports.login = (req, res, next) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ success: false, message: 'Vui lòng nhập đầy đủ tên đăng nhập và mật khẩu.' });
    }

    const user = db.prepare('SELECT * FROM users WHERE username = ?').get(username.trim());
    if (!user) {
      return res.status(401).json({ success: false, message: 'Tên đăng nhập hoặc mật khẩu không chính xác.' });
    }

    if (!user.is_active) {
      return res.status(403).json({ success: false, message: 'Tài khoản của bạn đang bị khóa. Vui lòng liên hệ quản trị viên.' });
    }

    const isMatch = bcrypt.compareSync(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Tên đăng nhập hoặc mật khẩu không chính xác.' });
    }

    // Update last_login
    db.prepare('UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = ?').run(user.id);

    const token = generateToken(user);

    return res.json({
      success: true,
      message: 'Đăng nhập thành công!',
      token,
      user: {
        id: user.id,
        username: user.username,
        full_name: user.full_name,
        role: user.role,
        email: user.email,
        department: user.department
      }
    });
  } catch (err) {
    next(err);
  }
};

// SSO Login (Enterprise / Civil / Mock SSO)
exports.ssoLogin = (req, res, next) => {
  try {
    const { ssoId, email, fullName, department, targetRole } = req.body;

    if (!ssoId) {
      return res.status(400).json({ success: false, message: 'Thiếu định danh SSO (ssoId).' });
    }

    // Find user by sso_id or email
    let user = db.prepare('SELECT * FROM users WHERE sso_id = ? OR (email = ? AND email IS NOT NULL)').get(ssoId, email);

    if (!user) {
      // Auto-provision user from SSO directory
      const username = email ? email.split('@')[0] : `sso_${ssoId.substring(0, 8)}`;
      const role = targetRole && ['admin', 'teacher', 'student'].includes(targetRole) ? targetRole : 'student';
      const dummyPassword = bcrypt.hashSync(Math.random().toString(36), 10);

      const stmt = db.prepare(`
        INSERT INTO users (username, password_hash, full_name, role, sso_id, email, department)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `);
      const info = stmt.run(username, dummyPassword, fullName || username, role, ssoId, email || null, department || 'Đơn vị liên kết SSO');
      user = db.prepare('SELECT * FROM users WHERE id = ?').get(info.lastInsertRowid);
    } else {
      if (!user.is_active) {
        return res.status(403).json({ success: false, message: 'Tài khoản SSO này đã bị vô hiệu hóa trên hệ thống.' });
      }
      // Update sso_id if not present
      if (!user.sso_id) {
        db.prepare('UPDATE users SET sso_id = ? WHERE id = ?').run(ssoId, user.id);
      }
    }

    db.prepare('UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = ?').run(user.id);
    const token = generateToken(user);

    return res.json({
      success: true,
      message: 'Đăng nhập SSO thành công!',
      token,
      user: {
        id: user.id,
        username: user.username,
        full_name: user.full_name,
        role: user.role,
        email: user.email,
        department: user.department
      }
    });
  } catch (err) {
    next(err);
  }
};

// Get current profile
exports.getMe = (req, res) => {
  return res.json({
    success: true,
    user: req.user
  });
};
