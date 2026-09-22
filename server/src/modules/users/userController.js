const bcrypt = require('bcryptjs');
const db = require('../../config/db');

// List all users (Admin only)
exports.listUsers = (req, res, next) => {
  try {
    const { search, role, status } = req.query;

    let query = `SELECT id, username, full_name, role, email, department, sso_id, is_active, created_at, last_login,
      (SELECT COUNT(*) FROM user_progress up WHERE up.user_id = users.id) AS answered_count,
      (SELECT COUNT(*) FROM user_progress up WHERE up.user_id = users.id AND up.is_correct = 1) AS correct_count
      FROM users WHERE 1=1`;
    const params = [];

    if (search) {
      query += ' AND (username LIKE ? OR full_name LIKE ? OR department LIKE ? OR email LIKE ?)';
      const s = `%${search}%`;
      params.push(s, s, s, s);
    }

    if (role && ['admin', 'teacher', 'student'].includes(role)) {
      query += ' AND role = ?';
      params.push(role);
    }

    if (status !== undefined && status !== '') {
      query += ' AND is_active = ?';
      params.push(Number(status));
    }

    query += ' ORDER BY id DESC';

    const users = db.prepare(query).all(...params);
    return res.json({ success: true, data: users });
  } catch (err) {
    next(err);
  }
};

// Create new user (Admin only)
exports.createUser = (req, res, next) => {
  try {
    const { username, password, full_name, role, email, department, sso_id } = req.body;

    if (!username || !password || !full_name || !role) {
      return res.status(400).json({ 
        success: false, 
        message: 'Vui lòng điền đầy đủ các trường bắt buộc: Tên đăng nhập, Mật khẩu, Họ và tên, Quyền hạn.' 
      });
    }

    if (!['admin', 'teacher', 'student'].includes(role)) {
      return res.status(400).json({ success: false, message: 'Quyền hạn không hợp lệ. Chọn admin, teacher hoặc student.' });
    }

    // Check existing username
    const existing = db.prepare('SELECT id FROM users WHERE username = ?').get(username.trim());
    if (existing) {
      return res.status(400).json({ success: false, message: 'Tên đăng nhập này đã được sử dụng. Vui lòng chọn tên khác.' });
    }

    const salt = bcrypt.genSaltSync(10);
    const password_hash = bcrypt.hashSync(password, salt);

    const stmt = db.prepare(`
      INSERT INTO users (username, password_hash, full_name, role, email, department, sso_id)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    const result = stmt.run(
      username.trim(), 
      password_hash, 
      full_name.trim(), 
      role, 
      email ? email.trim() : null, 
      department ? department.trim() : null, 
      sso_id ? sso_id.trim() : null
    );

    const newUser = db.prepare('SELECT id, username, full_name, role, email, department, sso_id, is_active, created_at FROM users WHERE id = ?').get(result.lastInsertRowid);

    return res.status(201).json({
      success: true,
      message: 'Thêm người dùng mới thành công!',
      data: newUser
    });
  } catch (err) {
    next(err);
  }
};

// Update user (Admin only)
exports.updateUser = (req, res, next) => {
  try {
    const userId = Number(req.params.id);
    const { full_name, role, email, department, sso_id, is_active, new_password } = req.body;

    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy người dùng.' });
    }

    // Protect self-deactivation or self-demotion
    if (req.user.id === userId && is_active === 0) {
      return res.status(400).json({ success: false, message: 'Bạn không thể tự khóa tài khoản của chính mình!' });
    }

    let query = 'UPDATE users SET ';
    const updates = [];
    const params = [];

    if (full_name !== undefined) { updates.push('full_name = ?'); params.push(full_name.trim()); }
    if (role !== undefined) {
      if (!['admin', 'teacher', 'student'].includes(role)) {
        return res.status(400).json({ success: false, message: 'Vai trò không hợp lệ.' });
      }
      updates.push('role = ?'); 
      params.push(role);
    }
    if (email !== undefined) { updates.push('email = ?'); params.push(email ? email.trim() : null); }
    if (department !== undefined) { updates.push('department = ?'); params.push(department ? department.trim() : null); }
    if (sso_id !== undefined) { updates.push('sso_id = ?'); params.push(sso_id ? sso_id.trim() : null); }
    if (is_active !== undefined) { updates.push('is_active = ?'); params.push(Number(is_active)); }
    if (new_password) {
      const salt = bcrypt.genSaltSync(10);
      updates.push('password_hash = ?');
      params.push(bcrypt.hashSync(new_password, salt));
    }

    if (updates.length === 0) {
      return res.status(400).json({ success: false, message: 'Không có thông tin nào để cập nhật.' });
    }

    query += updates.join(', ') + ' WHERE id = ?';
    params.push(userId);

    db.prepare(query).run(...params);

    const updated = db.prepare('SELECT id, username, full_name, role, email, department, sso_id, is_active, created_at, last_login FROM users WHERE id = ?').get(userId);

    return res.json({
      success: true,
      message: 'Cập nhật thông tin người dùng thành công!',
      data: updated
    });
  } catch (err) {
    next(err);
  }
};

// Delete user (Admin only)
exports.deleteUser = (req, res, next) => {
  try {
    const userId = Number(req.params.id);

    if (req.user.id === userId) {
      return res.status(400).json({ success: false, message: 'Bạn không thể tự xóa tài khoản của chính mình!' });
    }

    const user = db.prepare('SELECT id, username FROM users WHERE id = ?').get(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'Người dùng không tồn tại.' });
    }

    db.prepare('DELETE FROM users WHERE id = ?').run(userId);

    return res.json({
      success: true,
      message: `Đã xóa người dùng [${user.username}] thành công.`
    });
  } catch (err) {
    next(err);
  }
};
