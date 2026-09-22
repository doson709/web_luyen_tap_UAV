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

// Record/update a user's answer for a question (upsert, latest attempt wins)
exports.recordAnswer = (req, res, next) => {
  try {
    const userId = req.user.id;
    const questionId = Number(req.body.questionId);
    const isCorrect = req.body.isCorrect ? 1 : 0;
    const selectedAnswer = req.body.selectedAnswer ? String(req.body.selectedAnswer) : null;
    const { moduleId, topicId } = req.body;

    if (moduleId) req.query.moduleId = moduleId;
    if (topicId) req.query.topicId = topicId;

    if (!questionId) {
      return res.status(400).json({ success: false, message: 'Thiếu questionId.' });
    }

    db.prepare(`
      INSERT INTO user_progress (user_id, question_id, is_correct, selected_answer, updated_at)
      VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)
      ON CONFLICT(user_id, question_id)
      DO UPDATE SET is_correct = excluded.is_correct, selected_answer = excluded.selected_answer, updated_at = CURRENT_TIMESTAMP
    `).run(userId, questionId, isCorrect, selectedAnswer);

    return exports.getProgress(req, res, next);
  } catch (err) {
    next(err);
  }
};

// Remove a user's answer (used when "Làm lại" resets a question)
exports.deleteAnswer = (req, res, next) => {
  try {
    const userId = req.user.id;
    const questionId = Number(req.params.questionId);

    db.prepare('DELETE FROM user_progress WHERE user_id = ? AND question_id = ?').run(userId, questionId);

    return exports.getProgress(req, res, next);
  } catch (err) {
    next(err);
  }
};

// Reset all answers within current selected scope (module, topic, or all mode questions)
exports.resetScope = (req, res, next) => {
  try {
    const userId = req.user.id;
    const { moduleId, topicId, filterType } = req.body;

    let typeFilterClause = " AND q.question_type IN ('mcq', 'true_false')";
    if (filterType === 'oral') {
      typeFilterClause = " AND q.question_type = 'oral'";
    } else if (filterType === 'all') {
      typeFilterClause = "";
    }

    if (topicId) {
      db.prepare(`
        DELETE FROM user_progress
        WHERE user_id = ? AND question_id IN (
          SELECT id FROM questions WHERE topic_id = ?
        )
      `).run(userId, topicId);
    } else if (moduleId) {
      db.prepare(`
        DELETE FROM user_progress
        WHERE user_id = ? AND question_id IN (
          SELECT q.id FROM questions q WHERE q.module_id = ? ${typeFilterClause}
        )
      `).run(userId, moduleId);
    } else {
      db.prepare(`
        DELETE FROM user_progress
        WHERE user_id = ? AND question_id IN (
          SELECT q.id FROM questions q WHERE 1=1 ${typeFilterClause}
        )
      `).run(userId);
    }

    if (moduleId) req.query.moduleId = moduleId;
    if (topicId) req.query.topicId = topicId;
    if (filterType) req.query.filterType = filterType;

    return exports.getProgress(req, res, next);
  } catch (err) {
    next(err);
  }
};

// Get current user's cumulative progress (both overall and scoped to module/topic)
exports.getProgress = (req, res, next) => {
  try {
    const userId = req.user.id;
    const moduleId = req.query?.moduleId || req.body?.moduleId || null;
    const topicId = req.query?.topicId || req.body?.topicId || null;
    const filterType = req.query?.filterType || req.body?.filterType || req.query?.type || 'mcq';

    // Type filter clause for SQL
    let typeFilterClause = " AND q.question_type IN ('mcq', 'true_false')";
    let typeFilterTotal = " WHERE question_type IN ('mcq', 'true_false')";
    if (filterType === 'oral') {
      typeFilterClause = " AND q.question_type = 'oral'";
      typeFilterTotal = " WHERE question_type = 'oral'";
    } else if (filterType === 'all') {
      typeFilterClause = "";
      typeFilterTotal = "";
    }

    // Overall stats based on filterType (default 600 MCQ or 49 Oral)
    const total = db.prepare(`SELECT COUNT(*) AS count FROM questions ${typeFilterTotal}`).get().count;
    const overallStats = db.prepare(`
      SELECT COUNT(*) AS answered, COALESCE(SUM(up.is_correct), 0) AS correct 
      FROM user_progress up
      JOIN questions q ON q.id = up.question_id
      WHERE up.user_id = ? ${typeFilterClause}
    `).get(userId);

    // Scoped stats for selected module / topic
    let scopedTotal = total;
    let scopedAnswered = overallStats.answered;
    let scopedCorrect = overallStats.correct;
    let scopedName = filterType === 'oral' ? 'Tất cả câu hỏi Vấn đáp (49 câu)' : 'Tất cả học phần Trắc nghiệm (600 câu)';
    let isFiltered = false;

    if (topicId) {
      isFiltered = true;
      const topicObj = db.prepare('SELECT title FROM topics WHERE id = ?').get(topicId);
      if (topicObj) scopedName = topicObj.title;

      scopedTotal = db.prepare('SELECT COUNT(*) AS count FROM questions WHERE topic_id = ?').get(topicId).count;
      const topicStats = db.prepare(`
        SELECT COUNT(*) AS answered, COALESCE(SUM(up.is_correct), 0) AS correct 
        FROM user_progress up
        JOIN questions q ON q.id = up.question_id
        WHERE up.user_id = ? AND q.topic_id = ?
      `).get(userId, topicId);
      scopedAnswered = topicStats.answered;
      scopedCorrect = topicStats.correct;
    } else if (moduleId) {
      isFiltered = true;
      const modObj = db.prepare('SELECT title FROM modules WHERE id = ?').get(moduleId);
      if (modObj) scopedName = modObj.title;

      scopedTotal = db.prepare(`SELECT COUNT(*) AS count FROM questions q WHERE q.module_id = ? ${typeFilterClause}`).get(moduleId).count;
      const modStats = db.prepare(`
        SELECT COUNT(*) AS answered, COALESCE(SUM(up.is_correct), 0) AS correct 
        FROM user_progress up
        JOIN questions q ON q.id = up.question_id
        WHERE up.user_id = ? AND q.module_id = ? ${typeFilterClause}
      `).get(userId, moduleId);
      scopedAnswered = modStats.answered;
      scopedCorrect = modStats.correct;
    }

    // Map of answered questions for quick client-side lookup
    const answeredMap = {};
    const userAnswers = db.prepare('SELECT question_id, is_correct, selected_answer FROM user_progress WHERE user_id = ?').all(userId);
    userAnswers.forEach(row => {
      answeredMap[row.question_id] = {
        isCorrect: Boolean(row.is_correct),
        selectedAnswer: row.selected_answer
      };
    });

    return res.json({
      success: true,
      data: {
        total,
        answered: overallStats.answered,
        correct: overallStats.correct,
        scoped: {
          total: scopedTotal,
          answered: scopedAnswered,
          correct: scopedCorrect,
          name: scopedName,
          isFiltered
        },
        userAnswersMap: answeredMap
      }
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
