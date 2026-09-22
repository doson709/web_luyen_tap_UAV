const db = require('../../config/db');
const bcrypt = require('bcryptjs');
const { isUserOnline } = require('../../utils/onlineTracker');

// List all classes with student count and average progress
exports.listClasses = (req, res, next) => {
  try {
    const classes = db.prepare(`
      SELECT c.*, 
        COUNT(u.id) as total_students,
        ROUND(AVG(COALESCE((
          SELECT COUNT(*) FROM user_progress up WHERE up.user_id = u.id
        ), 0)), 1) as avg_answered,
        ROUND(AVG(COALESCE((
          SELECT COUNT(*) FROM user_progress up WHERE up.user_id = u.id AND up.is_correct = 1
        ), 0)), 1) as avg_correct
      FROM classes c
      LEFT JOIN users u ON u.class_id = c.id AND u.role = 'student'
      GROUP BY c.id
      ORDER BY c.id ASC
    `).all();

    // Calculate percent on 649 questions
    const totalQuestions = 649;
    const enrichedClasses = classes.map(c => ({
      ...c,
      total_questions: totalQuestions,
      avg_progress_percent: c.avg_answered ? Math.min(100, Math.round((c.avg_answered / totalQuestions) * 100)) : 0
    }));

    return res.json({ success: true, data: enrichedClasses });
  } catch (err) {
    next(err);
  }
};

// Create a new class
exports.createClass = (req, res, next) => {
  try {
    const { name, description } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, message: 'Vui lòng nhập tên lớp học.' });
    }

    const existing = db.prepare('SELECT id FROM classes WHERE name = ?').get(name.trim());
    if (existing) {
      return res.status(400).json({ success: false, message: 'Tên lớp học này đã tồn tại. Vui lòng chọn tên khác.' });
    }

    const result = db.prepare('INSERT INTO classes (name, description) VALUES (?, ?)').run(
      name.trim(),
      description ? description.trim() : null
    );

    const newClass = db.prepare('SELECT * FROM classes WHERE id = ?').get(result.lastInsertRowid);

    return res.status(201).json({
      success: true,
      message: 'Tạo lớp học mới thành công!',
      data: {
        ...newClass,
        total_students: 0,
        avg_answered: 0,
        avg_progress_percent: 0
      }
    });
  } catch (err) {
    next(err);
  }
};

// Update class details (Rename, description)
exports.updateClass = (req, res, next) => {
  try {
    const classId = Number(req.params.id);
    const { name, description } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, message: 'Tên lớp học không được để trống.' });
    }

    const existing = db.prepare('SELECT id FROM classes WHERE name = ? AND id != ?').get(name.trim(), classId);
    if (existing) {
      return res.status(400).json({ success: false, message: 'Tên lớp học này đã bị trùng lặp.' });
    }

    db.prepare('UPDATE classes SET name = ?, description = ? WHERE id = ?').run(
      name.trim(),
      description !== undefined ? description.trim() : null,
      classId
    );

    const updated = db.prepare('SELECT * FROM classes WHERE id = ?').get(classId);

    return res.json({
      success: true,
      message: 'Cập nhật thông tin lớp học thành công!',
      data: updated
    });
  } catch (err) {
    next(err);
  }
};

// Delete a class
exports.deleteClass = (req, res, next) => {
  try {
    const classId = Number(req.params.id);

    db.prepare('UPDATE users SET class_id = NULL WHERE class_id = ?').run(classId);
    db.prepare('DELETE FROM classes WHERE id = ?').run(classId);

    return res.json({
      success: true,
      message: 'Xóa lớp học thành công.'
    });
  } catch (err) {
    next(err);
  }
};

// Get all students of a specific class with their progress out of 649 questions & live online status
exports.getClassStudents = (req, res, next) => {
  try {
    const classId = Number(req.params.id);

    const classInfo = db.prepare('SELECT * FROM classes WHERE id = ?').get(classId);
    if (!classInfo) {
      return res.status(404).json({ success: false, message: 'Lớp học không tồn tại.' });
    }

    const totalQuestions = 649;

    const students = db.prepare(`
      SELECT u.id, u.username, u.full_name, u.phone, u.department, u.unit, u.role, u.email, u.is_active, u.created_at, u.last_login,
        (SELECT COUNT(*) FROM user_progress up WHERE up.user_id = u.id) as answered_count,
        (SELECT COUNT(*) FROM user_progress up WHERE up.user_id = u.id AND up.is_correct = 1) as correct_count
      FROM users u
      WHERE u.class_id = ?
      ORDER BY u.id ASC
    `).all(classId);

    const enrichedStudents = students.map(s => {
      const answered = s.answered_count || 0;
      const correct = s.correct_count || 0;
      const progressPercent = Math.min(100, Math.round((answered / totalQuestions) * 100));
      const accuracyPercent = answered > 0 ? Math.round((correct / answered) * 100) : 0;
      const isOnline = isUserOnline(s.id);

      return {
        ...s,
        total_questions: totalQuestions,
        answered_count: answered,
        correct_count: correct,
        progress_percent: progressPercent,
        accuracy_percent: accuracyPercent,
        is_online: isOnline,
        is_active_online: isOnline
      };
    });

    return res.json({
      success: true,
      data: {
        class: classInfo,
        totalQuestions,
        students: enrichedStudents
      }
    });
  } catch (err) {
    next(err);
  }
};

// Add / Assign a student to class with Họ tên, SĐT, Phòng ban, Đơn vị, Email
exports.addStudentToClass = (req, res, next) => {
  try {
    const classId = Number(req.params.id);
    let { full_name, phone, department, unit, email, username, password } = req.body;

    if (!full_name || !full_name.trim()) {
      return res.status(400).json({ success: false, message: 'Vui lòng nhập Họ tên học viên.' });
    }
    if (!phone || !phone.trim()) {
      return res.status(400).json({ success: false, message: 'Vui lòng nhập Số điện thoại của học viên.' });
    }

    const trimmedPhone = phone.trim();
    const finalUsername = (username && username.trim()) ? username.trim() : trimmedPhone;
    const finalPassword = (password && password.trim()) ? password.trim() : trimmedPhone;

    // Check existing username or phone
    const existing = db.prepare('SELECT id FROM users WHERE username = ? OR phone = ? OR (email = ? AND email IS NOT NULL)').get(finalUsername, trimmedPhone, email || '');
    if (existing) {
      // If user already exists, we can link them to this class
      db.prepare(`
        UPDATE users 
        SET class_id = ?, full_name = ?, phone = ?, department = ?, unit = ?, email = ?
        WHERE id = ?
      `).run(
        classId,
        full_name.trim(),
        trimmedPhone,
        department ? department.trim() : null,
        unit ? unit.trim() : null,
        email ? email.trim() : null,
        existing.id
      );

      const updatedStudent = db.prepare(`
        SELECT u.id, u.username, u.full_name, u.phone, u.department, u.unit, u.role, u.email, u.is_active, u.created_at,
          (SELECT COUNT(*) FROM user_progress up WHERE up.user_id = u.id) as answered_count,
          (SELECT COUNT(*) FROM user_progress up WHERE up.user_id = u.id AND up.is_correct = 1) as correct_count
        FROM users u WHERE u.id = ?
      `).get(existing.id);

      const totalQuestions = 649;
      const answered = updatedStudent.answered_count || 0;
      const correct = updatedStudent.correct_count || 0;

      return res.json({
        success: true,
        message: 'Đã cập nhật và thêm học viên vào lớp thành công!',
        data: {
          ...updatedStudent,
          total_questions: totalQuestions,
          answered_count: answered,
          correct_count: correct,
          progress_percent: Math.min(100, Math.round((answered / totalQuestions) * 100)),
          accuracy_percent: answered > 0 ? Math.round((correct / answered) * 100) : 0,
          is_online: isUserOnline(existing.id),
          is_active_online: isUserOnline(existing.id)
        }
      });
    }

    const salt = bcrypt.genSaltSync(10);
    const password_hash = bcrypt.hashSync(finalPassword, salt);

    const result = db.prepare(`
      INSERT INTO users (username, password_hash, full_name, phone, department, unit, role, email, class_id)
      VALUES (?, ?, ?, ?, ?, ?, 'student', ?, ?)
    `).run(
      finalUsername,
      password_hash,
      full_name.trim(),
      trimmedPhone,
      department ? department.trim() : null,
      unit ? unit.trim() : null,
      email ? email.trim() : null,
      classId
    );

    const newStudent = db.prepare(`
      SELECT u.id, u.username, u.full_name, u.phone, u.department, u.unit, u.role, u.email, u.is_active, u.created_at,
        0 as answered_count, 0 as correct_count, 0 as progress_percent, 649 as total_questions
      FROM users u WHERE u.id = ?
    `).get(result.lastInsertRowid);

    return res.status(201).json({
      success: true,
      message: 'Thêm học viên vào lớp thành công!',
      data: {
        ...newStudent,
        is_online: false,
        is_active_online: false
      }
    });
  } catch (err) {
    next(err);
  }
};

// Remove student from class
exports.removeStudentFromClass = (req, res, next) => {
  try {
    const classId = Number(req.params.id);
    const studentId = Number(req.params.studentId);

    db.prepare('UPDATE users SET class_id = NULL WHERE id = ? AND class_id = ?').run(studentId, classId);

    return res.json({
      success: true,
      message: 'Đã xóa học viên khỏi lớp học.'
    });
  } catch (err) {
    next(err);
  }
};

// Get detailed progress breakdown for a single student (Oral vs Theory, by Module & Topic)
exports.getStudentProgressDetail = (req, res, next) => {
  try {
    const classId = Number(req.params.id);
    const studentId = Number(req.params.studentId);

    const student = db.prepare(`
      SELECT u.id, u.username, u.full_name, u.email, u.phone, u.department, u.unit, u.class_id, u.last_login,
             c.name as class_name
      FROM users u
      LEFT JOIN classes c ON c.id = u.class_id
      WHERE u.id = ?
    `).get(studentId);

    if (!student) {
      return res.status(404).json({ success: false, message: 'Học viên không tồn tại.' });
    }

    const isOnline = isUserOnline(student.id);

    // 1. Oral (Vấn đáp) - 49 questions
    const oralTotal = db.prepare("SELECT COUNT(*) as c FROM questions WHERE question_type = 'oral'").get().c;
    const oralAnswered = db.prepare("SELECT COUNT(*) as c FROM user_progress up JOIN questions q ON up.question_id = q.id WHERE up.user_id = ? AND q.question_type = 'oral'").get(studentId).c;
    
    const oralQuestions = db.prepare(`
      SELECT q.id, q.code, q.stem, q.module_id, q.topic_id, q.correct_answer, q.explanation,
        (CASE WHEN up.user_id IS NOT NULL THEN 1 ELSE 0 END) as is_answered,
        up.updated_at as answered_at
      FROM questions q
      LEFT JOIN user_progress up ON up.question_id = q.id AND up.user_id = ?
      WHERE q.question_type = 'oral'
      ORDER BY q.id ASC
    `).all(studentId);

    // 2. Theory (Lý thuyết / Trắc nghiệm) - 600 questions
    const theoryTotal = db.prepare("SELECT COUNT(*) as c FROM questions WHERE question_type != 'oral'").get().c;
    const theoryAnswered = db.prepare("SELECT COUNT(*) as c FROM user_progress up JOIN questions q ON up.question_id = q.id WHERE up.user_id = ? AND q.question_type != 'oral'").get(studentId).c;
    const theoryCorrect = db.prepare("SELECT COUNT(*) as c FROM user_progress up JOIN questions q ON up.question_id = q.id WHERE up.user_id = ? AND q.question_type != 'oral' AND up.is_correct = 1").get(studentId).c;
    const theoryWrong = theoryAnswered - theoryCorrect;

    const modules = db.prepare("SELECT m.id, m.code, m.title, m.order_num FROM modules m ORDER BY m.order_num ASC").all();
    const theoryBreakdown = modules.map(m => {
      const mTotal = db.prepare("SELECT COUNT(*) as c FROM questions WHERE module_id = ? AND question_type != 'oral'").get(m.id).c;
      if (mTotal === 0) return null;

      const mAnswered = db.prepare("SELECT COUNT(*) as c FROM user_progress up JOIN questions q ON up.question_id = q.id WHERE up.user_id = ? AND q.module_id = ? AND q.question_type != 'oral'").get(studentId, m.id).c;
      const mCorrect = db.prepare("SELECT COUNT(*) as c FROM user_progress up JOIN questions q ON up.question_id = q.id WHERE up.user_id = ? AND q.module_id = ? AND q.question_type != 'oral' AND up.is_correct = 1").get(studentId, m.id).c;
      const mWrong = mAnswered - mCorrect;

      const topics = db.prepare("SELECT t.id, t.title, t.order_num FROM topics t WHERE t.module_id = ? ORDER BY t.order_num ASC").all(m.id);
      const topicsData = topics.map(t => {
        const tTotal = db.prepare("SELECT COUNT(*) as c FROM questions WHERE topic_id = ? AND question_type != 'oral'").get(t.id).c;
        if (tTotal === 0) return null;

        const tAnswered = db.prepare("SELECT COUNT(*) as c FROM user_progress up JOIN questions q ON up.question_id = q.id WHERE up.user_id = ? AND q.topic_id = ? AND q.question_type != 'oral'").get(studentId, t.id).c;
        const tCorrect = db.prepare("SELECT COUNT(*) as c FROM user_progress up JOIN questions q ON up.question_id = q.id WHERE up.user_id = ? AND q.topic_id = ? AND q.question_type != 'oral' AND up.is_correct = 1").get(studentId, t.id).c;
        const tWrong = tAnswered - tCorrect;

        return {
          id: t.id,
          title: t.title,
          total: tTotal,
          answered: tAnswered,
          correct: tCorrect,
          wrong: tWrong,
          unanswered: tTotal - tAnswered,
          progress_percent: tTotal > 0 ? Math.round((tAnswered / tTotal) * 100) : 0,
          accuracy_percent: tAnswered > 0 ? Math.round((tCorrect / tAnswered) * 100) : 0
        };
      }).filter(Boolean);

      return {
        id: m.id,
        code: m.code,
        title: m.title,
        total: mTotal,
        answered: mAnswered,
        correct: mCorrect,
        wrong: mWrong,
        unanswered: mTotal - mAnswered,
        progress_percent: mTotal > 0 ? Math.round((mAnswered / mTotal) * 100) : 0,
        accuracy_percent: mAnswered > 0 ? Math.round((mCorrect / mAnswered) * 100) : 0,
        topics: topicsData
      };
    }).filter(Boolean);

    const totalQuestions = 649;
    const totalAnswered = oralAnswered + theoryAnswered;
    const totalCorrect = theoryCorrect;
    const totalWrong = theoryWrong;

    return res.json({
      success: true,
      data: {
        student: {
          ...student,
          is_online: isOnline,
          is_active_online: isOnline
        },
        summary: {
          total_questions: totalQuestions,
          answered_count: totalAnswered,
          unanswered_count: totalQuestions - totalAnswered,
          correct_count: totalCorrect,
          wrong_count: totalWrong,
          progress_percent: Math.min(100, Math.round((totalAnswered / totalQuestions) * 100)),
          accuracy_percent: totalAnswered > 0 ? Math.round((totalCorrect / totalAnswered) * 100) : 0
        },
        oral: {
          total: oralTotal,
          answered: oralAnswered,
          unanswered: oralTotal - oralAnswered,
          progress_percent: oralTotal > 0 ? Math.round((oralAnswered / oralTotal) * 100) : 0,
          questions: oralQuestions
        },
        theory: {
          total: theoryTotal,
          answered: theoryAnswered,
          unanswered: theoryTotal - theoryAnswered,
          correct: theoryCorrect,
          wrong: theoryWrong,
          progress_percent: theoryTotal > 0 ? Math.round((theoryAnswered / theoryTotal) * 100) : 0,
          accuracy_percent: theoryAnswered > 0 ? Math.round((theoryCorrect / theoryAnswered) * 100) : 0,
          modules: theoryBreakdown
        }
      }
    });
  } catch (err) {
    next(err);
  }
};
