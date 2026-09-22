const db = require('../../config/db');

// Get all programs with summary stats
exports.getPrograms = (req, res, next) => {
  try {
    const programs = db.prepare(`
      SELECT p.*, 
        COUNT(DISTINCT m.id) as total_modules,
        COUNT(DISTINCT q.id) as total_questions
      FROM programs p
      LEFT JOIN modules m ON m.program_id = p.id
      LEFT JOIN questions q ON q.module_id = m.id
      GROUP BY p.id
      ORDER BY p.id ASC
    `).all();

    return res.json({ success: true, data: programs });
  } catch (err) {
    next(err);
  }
};

// Get modules with question counts
exports.getModules = (req, res, next) => {
  try {
    const { programId, category } = req.query;

    let query = `
      SELECT m.*, 
        COUNT(DISTINCT t.id) as total_topics,
        COUNT(DISTINCT q.id) as total_questions,
        SUM(CASE WHEN q.question_type = 'mcq' THEN 1 ELSE 0 END) as mcq_count,
        SUM(CASE WHEN q.question_type = 'true_false' THEN 1 ELSE 0 END) as tf_count,
        SUM(CASE WHEN q.question_type = 'oral' THEN 1 ELSE 0 END) as oral_count
      FROM modules m
      LEFT JOIN topics t ON t.module_id = m.id
      LEFT JOIN questions q ON q.module_id = m.id
      WHERE 1=1
    `;
    const params = [];

    if (programId) {
      query += ' AND m.program_id = ?';
      params.push(programId);
    }

    if (category) {
      query += ' AND m.category = ?';
      params.push(category);
    }

    query += ' GROUP BY m.id ORDER BY m.program_id ASC, m.category DESC, m.order_num ASC';

    const modules = db.prepare(query).all(...params);
    return res.json({ success: true, data: modules });
  } catch (err) {
    next(err);
  }
};

// Get topics within a module
exports.getTopics = (req, res, next) => {
  try {
    const { moduleId } = req.params;

    const topics = db.prepare(`
      SELECT t.*,
        COUNT(q.id) as total_questions,
        SUM(CASE WHEN q.question_type = 'mcq' THEN 1 ELSE 0 END) as mcq_count,
        SUM(CASE WHEN q.question_type = 'true_false' THEN 1 ELSE 0 END) as tf_count,
        SUM(CASE WHEN q.question_type = 'oral' THEN 1 ELSE 0 END) as oral_count
      FROM topics t
      LEFT JOIN questions q ON q.topic_id = t.id
      WHERE t.module_id = ?
      GROUP BY t.id
      ORDER BY t.order_num ASC
    `).all(moduleId);

    return res.json({ success: true, data: topics });
  } catch (err) {
    next(err);
  }
};

// Get complete hierarchy tree
exports.getCurriculumTree = (req, res, next) => {
  try {
    const programs = db.prepare('SELECT * FROM programs ORDER BY id ASC').all();
    
    // Modules with MCQ/True-False question counts (excluding oral)
    const mcqModules = db.prepare(`
      SELECT m.*, 
        COUNT(CASE WHEN q.question_type IN ('mcq', 'true_false') THEN q.id ELSE NULL END) as total_questions 
      FROM modules m 
      LEFT JOIN questions q ON q.module_id = m.id 
      GROUP BY m.id 
      ORDER BY m.program_id ASC, m.category DESC, m.order_num ASC
    `).all();
    
    // Topics with MCQ/True-False question counts (excluding oral)
    const mcqTopics = db.prepare(`
      SELECT t.*, 
        COUNT(CASE WHEN q.question_type IN ('mcq', 'true_false') THEN q.id ELSE NULL END) as total_questions 
      FROM topics t 
      LEFT JOIN questions q ON q.topic_id = t.id 
      GROUP BY t.id 
      HAVING total_questions > 0
      ORDER BY t.order_num ASC
    `).all();

    // Assemble MCQ Tree (Total 600 questions)
    const mcqTree = programs.map(p => {
      const pModules = mcqModules.filter(m => m.program_id === p.id);
      
      const categories = ['Lý Thuyết', 'Thực Hành']
        .map(cat => {
          const catModules = pModules
            .filter(m => m.category === cat)
            .map(m => {
              const mTopics = mcqTopics.filter(t => t.module_id === m.id);
              const mQuestionCount = mTopics.reduce((sum, t) => sum + (t.total_questions || 0), 0);
              return { ...m, total_questions: mQuestionCount, topics: mTopics };
            })
            .filter(m => m.total_questions > 0);

          const catQuestions = catModules.reduce((acc, curr) => acc + (curr.total_questions || 0), 0);
          return {
            category: cat,
            total_questions: catQuestions,
            modules: catModules
          };
        })
        .filter(cat => cat.modules.length > 0);

      const pTotalQuestions = categories.reduce((sum, c) => sum + (c.total_questions || 0), 0);

      return { 
        ...p, 
        total_questions: pTotalQuestions,
        categories,
        modules: pModules.map(m => ({
          ...m,
          topics: mcqTopics.filter(t => t.module_id === m.id)
        }))
      };
    });

    // Dedicated Oral Section Topics (Total 49 questions)
    const oralTopics = db.prepare(`
      SELECT t.id, t.module_id, t.title, m.title as module_title, m.code as module_code, p.name as program_name,
        COUNT(q.id) as total_questions
      FROM topics t
      JOIN modules m ON m.id = t.module_id
      JOIN programs p ON p.id = m.program_id
      JOIN questions q ON q.topic_id = t.id
      WHERE q.question_type = 'oral'
      GROUP BY t.id
      ORDER BY m.order_num ASC, t.order_num ASC
    `).all();

    const totalOral = oralTopics.reduce((sum, t) => sum + (t.total_questions || 0), 0);
    const totalMcq = mcqTree.reduce((sum, p) => sum + (p.total_questions || 0), 0);

    return res.json({ 
      success: true, 
      data: {
        tree: mcqTree,
        oralTopics,
        stats: {
          totalMcq,
          totalOral,
          totalAll: totalMcq + totalOral
        }
      } 
    });
  } catch (err) {
    next(err);
  }
};
