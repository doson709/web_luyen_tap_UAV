const db = require('../../config/db');

// List questions with rich filters
exports.listQuestions = (req, res, next) => {
  try {
    const { moduleId, topicId, type, keyword, limit, offset } = req.query;

    let query = `
      SELECT q.*, 
        t.title as topic_title, 
        m.title as module_title, 
        m.code as module_code,
        u.full_name as updated_by_name
      FROM questions q
      JOIN topics t ON t.id = q.topic_id
      JOIN modules m ON m.id = q.module_id
      LEFT JOIN users u ON u.id = q.updated_by
      WHERE 1=1
    `;
    const params = [];

    if (moduleId) {
      query += ' AND q.module_id = ?';
      params.push(moduleId);
    }

    if (topicId) {
      query += ' AND q.topic_id = ?';
      params.push(topicId);
    }

    if (type && type !== 'all') {
      query += ' AND q.question_type = ?';
      params.push(type);
    }

    if (keyword) {
      query += ' AND (q.stem LIKE ? OR q.code LIKE ? OR q.explanation LIKE ?)';
      const k = `%${keyword}%`;
      params.push(k, k, k);
    }

    // Count total matching
    const countQuery = `SELECT COUNT(*) as total FROM (${query})`;
    const total = db.prepare(countQuery).get(...params).total;

    query += ' ORDER BY q.id ASC';

    if (limit) {
      query += ' LIMIT ? OFFSET ?';
      params.push(Number(limit), Number(offset || 0));
    }

    const questions = db.prepare(query).all(...params);

    return res.json({
      success: true,
      total,
      data: questions
    });
  } catch (err) {
    next(err);
  }
};

// Get single question by ID
exports.getQuestionById = (req, res, next) => {
  try {
    const { id } = req.params;
    const question = db.prepare(`
      SELECT q.*, 
        t.title as topic_title, 
        m.title as module_title, 
        m.code as module_code,
        u.full_name as updated_by_name
      FROM questions q
      JOIN topics t ON t.id = q.topic_id
      JOIN modules m ON m.id = q.module_id
      LEFT JOIN users u ON u.id = q.updated_by
      WHERE q.id = ?
    `).get(id);

    if (!question) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy câu hỏi.' });
    }

    return res.json({ success: true, data: question });
  } catch (err) {
    next(err);
  }
};

// Teacher & Admin: Update explanation
exports.updateExplanation = (req, res, next) => {
  try {
    const { id } = req.params;
    const { explanation } = req.body;

    if (explanation === undefined) {
      return res.status(400).json({ success: false, message: 'Thiếu nội dung giải thích.' });
    }

    const existing = db.prepare('SELECT id FROM questions WHERE id = ?').get(id);
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy câu hỏi để cập nhật.' });
    }

    db.prepare(`
      UPDATE questions 
      SET explanation = ?, updated_by = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(explanation.trim(), req.user.id, id);

    const updated = db.prepare(`
      SELECT q.*, 
        t.title as topic_title, 
        m.title as module_title, 
        u.full_name as updated_by_name
      FROM questions q
      JOIN topics t ON t.id = q.topic_id
      JOIN modules m ON m.id = q.module_id
      LEFT JOIN users u ON u.id = q.updated_by
      WHERE q.id = ?
    `).get(id);

    return res.json({
      success: true,
      message: 'Cập nhật lời giải thích thành công!',
      data: updated
    });
  } catch (err) {
    next(err);
  }
};

// Update full question details (Teacher & Admin)
exports.updateQuestion = (req, res, next) => {
  try {
    const { id } = req.params;
    const { stem, option_a, option_b, option_c, option_d, correct_answer, explanation, bloom_level, target_role } = req.body;

    const existing = db.prepare('SELECT id FROM questions WHERE id = ?').get(id);
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy câu hỏi.' });
    }

    db.prepare(`
      UPDATE questions
      SET stem = ?, option_a = ?, option_b = ?, option_c = ?, option_d = ?, correct_answer = ?, explanation = ?, bloom_level = ?, target_role = ?, updated_by = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(
      stem, 
      option_a || null, 
      option_b || null, 
      option_c || null, 
      option_d || null, 
      correct_answer, 
      explanation || null, 
      bloom_level || null, 
      target_role || null, 
      req.user.id, 
      id
    );

    const updated = db.prepare('SELECT * FROM questions WHERE id = ?').get(id);

    return res.json({
      success: true,
      message: 'Cập nhật câu hỏi thành công!',
      data: updated
    });
  } catch (err) {
    next(err);
  }
};

// Create new question (Teacher & Admin)
exports.createQuestion = (req, res, next) => {
  try {
    const { topic_id, module_id, question_type, stem, option_a, option_b, option_c, option_d, correct_answer, explanation, bloom_level, target_role, code } = req.body;

    if (!topic_id || !module_id || !stem || !correct_answer) {
      return res.status(400).json({ success: false, message: 'Vui lòng cung cấp đủ thông tin: Học phần, Đề mục, Câu dẫn, Đáp án đúng.' });
    }

    const qCode = code || `UAV-NEW-${Date.now().toString().slice(-6)}`;

    const stmt = db.prepare(`
      INSERT INTO questions 
      (code, topic_id, module_id, question_type, bloom_level, target_role, stem, option_a, option_b, option_c, option_d, correct_answer, explanation, updated_by)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const result = stmt.run(
      qCode,
      topic_id,
      module_id,
      question_type || 'mcq',
      bloom_level || 'Hiểu',
      target_role || 'Cả A và B',
      stem,
      option_a || null,
      option_b || null,
      option_c || null,
      option_d || null,
      correct_answer,
      explanation || null,
      req.user.id
    );

    const newQuestion = db.prepare('SELECT * FROM questions WHERE id = ?').get(result.lastInsertRowid);

    return res.status(201).json({
      success: true,
      message: 'Thêm câu hỏi mới thành công!',
      data: newQuestion
    });
  } catch (err) {
    next(err);
  }
};
