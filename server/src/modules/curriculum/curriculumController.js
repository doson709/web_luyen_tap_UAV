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
    const modules = db.prepare(`
      SELECT m.*, COUNT(q.id) as total_questions 
      FROM modules m 
      LEFT JOIN questions q ON q.module_id = m.id 
      GROUP BY m.id 
      ORDER BY m.program_id ASC, m.category DESC, m.order_num ASC
    `).all();
    
    const topics = db.prepare(`
      SELECT t.*, COUNT(q.id) as total_questions 
      FROM topics t 
      LEFT JOIN questions q ON q.topic_id = t.id 
      GROUP BY t.id 
      ORDER BY t.order_num ASC
    `).all();

    // Assemble tree with extra level: Program -> Category (Lý Thuyết / Thực Hành) -> Modules -> Topics
    const tree = programs.map(p => {
      const pModules = modules.filter(m => m.program_id === p.id);
      
      const categories = ['Lý Thuyết', 'Thực Hành']
        .map(cat => {
          const catModules = pModules
            .filter(m => m.category === cat)
            .map(m => {
              const mTopics = topics.filter(t => t.module_id === m.id);
              return { ...m, topics: mTopics };
            });
          const catQuestions = catModules.reduce((acc, curr) => acc + (curr.total_questions || 0), 0);
          return {
            category: cat,
            total_questions: catQuestions,
            modules: catModules
          };
        })
        .filter(cat => cat.modules.length > 0);

      return { 
        ...p, 
        categories,
        modules: pModules.map(m => ({
          ...m,
          topics: topics.filter(t => t.module_id === m.id)
        }))
      };
    });

    return res.json({ success: true, data: tree });
  } catch (err) {
    next(err);
  }
};
