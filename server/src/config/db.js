const Database = require('better-sqlite3');
const path = require('path');
const bcrypt = require('bcryptjs');

const dbPath = path.resolve(__dirname, '../../data/uav_practice.db');

// Ensure data folder exists
const fs = require('fs');
const dataDir = path.dirname(dbPath);
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const db = new Database(dbPath);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

// Initialize database schema
function initDatabase() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      full_name TEXT NOT NULL,
      role TEXT NOT NULL CHECK(role IN ('admin', 'teacher', 'student')),
      sso_id TEXT UNIQUE,
      email TEXT,
      department TEXT,
      is_active INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      last_login DATETIME
    );

    CREATE TABLE IF NOT EXISTS programs (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      code TEXT NOT NULL,
      description TEXT
    );

    CREATE TABLE IF NOT EXISTS modules (
      id TEXT PRIMARY KEY,
      program_id TEXT NOT NULL,
      code TEXT NOT NULL,
      category TEXT NOT NULL, -- 'Lý Thuyết' hoặc 'Thực Hành'
      title TEXT NOT NULL,
      description TEXT,
      order_num INTEGER DEFAULT 0,
      FOREIGN KEY (program_id) REFERENCES programs(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS topics (
      id TEXT PRIMARY KEY,
      module_id TEXT NOT NULL,
      title TEXT NOT NULL,
      order_num INTEGER DEFAULT 0,
      FOREIGN KEY (module_id) REFERENCES modules(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS questions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      code TEXT UNIQUE,
      topic_id TEXT NOT NULL,
      module_id TEXT NOT NULL,
      question_type TEXT NOT NULL, -- 'mcq' (trắc nghiệm 4 lựa chọn), 'true_false' (Đúng/Sai), 'oral' (Vấn đáp)
      bloom_level TEXT,
      target_role TEXT,
      stem TEXT NOT NULL,
      option_a TEXT,
      option_b TEXT,
      option_c TEXT,
      option_d TEXT,
      correct_answer TEXT NOT NULL,
      explanation TEXT,
      passing_criteria TEXT,
      follow_up_question TEXT,
      updated_by INTEGER,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (topic_id) REFERENCES topics(id) ON DELETE CASCADE,
      FOREIGN KEY (module_id) REFERENCES modules(id) ON DELETE CASCADE,
      FOREIGN KEY (updated_by) REFERENCES users(id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS practice_sessions (
      id TEXT PRIMARY KEY,
      user_id INTEGER NOT NULL,
      module_id TEXT,
      topic_id TEXT,
      title TEXT,
      mode TEXT DEFAULT 'practice', -- 'practice' (tự luyện), 'zoom' (trình chiếu zoom), 'exam' (thi thử)
      total_questions INTEGER DEFAULT 0,
      completed_questions INTEGER DEFAULT 0,
      correct_count INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS session_answers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      session_id TEXT NOT NULL,
      question_id INTEGER NOT NULL,
      selected_answer TEXT,
      is_correct INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (session_id) REFERENCES practice_sessions(id) ON DELETE CASCADE,
      FOREIGN KEY (question_id) REFERENCES questions(id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_questions_topic ON questions(topic_id);
    CREATE INDEX IF NOT EXISTS idx_questions_module ON questions(module_id);
    CREATE INDEX IF NOT EXISTS idx_topics_module ON topics(module_id);
  `);

  // Seed initial default users if not exists
  const checkUser = db.prepare('SELECT COUNT(*) as count FROM users').get();
  if (checkUser.count === 0) {
    const salt = bcrypt.genSaltSync(10);
    const defaultPasswordHash = bcrypt.hashSync('Ngangiang2026', salt);

    const insertUser = db.prepare(`
      INSERT INTO users (username, password_hash, full_name, role, email, department)
      VALUES (?, ?, ?, ?, ?, ?)
    `);

    insertUser.run('admin', defaultPasswordHash, 'Quản Trị Viên Hệ Thống', 'admin', 'admin@uav.edu.vn', 'Phòng Đào tạo & Khảo thí');
    insertUser.run('giaovien', defaultPasswordHash, 'Thầy Giáo Giảng Dạy UAV', 'teacher', 'giaovien@uav.edu.vn', 'Bộ môn Kỹ thuật Bay');
    insertUser.run('hocvien', defaultPasswordHash, 'Học Viên Sát Hạch', 'student', 'hocvien@uav.edu.vn', 'Lớp Huấn luyện UAV Khóa 01');
    
    console.log('[Database] Seeded 3 default users (admin, giaovien, hocvien) with password: "Ngangiang2026"');
  }
}

initDatabase();

module.exports = db;
