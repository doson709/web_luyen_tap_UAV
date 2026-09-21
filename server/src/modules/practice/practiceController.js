const db = require('../../config/db');

// Submit answer for practice
exports.submitAnswer = (req, res, next) => {
  try {
    const { questionId, selectedAnswer, sessionId } = req.body;

    if (!questionId || selectedAnswer === undefined) {
      return res.status(400).json({ success: false, message: 'Thiếu questionId hoặc selectedAnswer.' });
    }

    const question = db.prepare('SELECT id, correct_answer, explanation, stem FROM questions WHERE id = ?').get(questionId);
    if (!question) {
      return res.status(404).json({ success: false, message: 'Câu hỏi không tồn tại.' });
    }

    const isCorrect = String(selectedAnswer).trim().toLowerCase() === String(question.correct_answer).trim().toLowerCase();

    // If authenticated user and sessionId, record answer
    if (sessionId && req.user) {
      db.prepare(`
        INSERT INTO session_answers (session_id, question_id, selected_answer, is_correct)
        VALUES (?, ?, ?, ?)
      `).run(sessionId, questionId, String(selectedAnswer), isCorrect ? 1 : 0);

      // Increment completed and correct counts
      db.prepare(`
        UPDATE practice_sessions 
        SET completed_questions = completed_questions + 1,
            correct_count = correct_count + (CASE WHEN ? THEN 1 ELSE 0 END),
            updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).run(isCorrect ? 1 : 0, sessionId);
    }

    return res.json({
      success: true,
      isCorrect,
      correctAnswer: question.correct_answer,
      explanation: question.explanation
    });
  } catch (err) {
    next(err);
  }
};

// Create a new practice or exam session
exports.createSession = (req, res, next) => {
  try {
    const { moduleId, topicId, title, mode, totalQuestions } = req.body;
    const userId = req.user ? req.user.id : 1;
    const sessionId = `SES_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

    db.prepare(`
      INSERT INTO practice_sessions (id, user_id, module_id, topic_id, title, mode, total_questions)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(sessionId, userId, moduleId || null, topicId || null, title || 'Phiên luyện tập mới', mode || 'practice', totalQuestions || 0);

    return res.json({
      success: true,
      data: { sessionId }
    });
  } catch (err) {
    next(err);
  }
};

// Get stats
exports.getStats = (req, res, next) => {
  try {
    const totalQuestions = db.prepare('SELECT COUNT(*) as count FROM questions').get().count;
    const totalModules = db.prepare('SELECT COUNT(*) as count FROM modules').get().count;
    const totalTopics = db.prepare('SELECT COUNT(*) as count FROM topics').get().count;
    const totalUsers = db.prepare('SELECT COUNT(*) as count FROM users').get().count;

    return res.json({
      success: true,
      data: {
        totalQuestions,
        totalModules,
        totalTopics,
        totalUsers
      }
    });
  } catch (err) {
    next(err);
  }
};
