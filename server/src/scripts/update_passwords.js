const db = require('../config/db');
const bcrypt = require('bcryptjs');

const salt = bcrypt.genSaltSync(10);

// Update admin password to 'admin'
const adminPassHash = bcrypt.hashSync('admin', salt);
db.prepare("UPDATE users SET password_hash = ? WHERE username = 'admin'").run(adminPassHash);
console.log("Updated admin password to: 'admin'");

// Update all students' password to their phone number
const students = db.prepare("SELECT id, username, phone, email, full_name FROM users WHERE role = 'student'").all();
for (const s of students) {
  const pwd = (s.phone && s.phone.trim()) ? s.phone.trim() : '123456';
  const hash = bcrypt.hashSync(pwd, salt);
  db.prepare('UPDATE users SET password_hash = ? WHERE id = ?').run(hash, s.id);
}
console.log(`Updated ${students.length} students password to their respective phone numbers.`);
