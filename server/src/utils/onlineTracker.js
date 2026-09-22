const db = require('../config/db');

// In-memory active timestamps: userId -> timestamp (ms)
const activeUsers = new Map();

// Timeout window: 60 seconds (if no heartbeat/request received within 60s, mark offline)
const ONLINE_WINDOW_MS = 60 * 1000;

// Ensure last_active_at column exists in users table
try {
  const tableInfo = db.prepare('PRAGMA table_info(users)').all();
  const hasLastActive = tableInfo.some(c => c.name === 'last_active_at');
  if (!hasLastActive) {
    db.prepare('ALTER TABLE users ADD COLUMN last_active_at DATETIME').run();
  }
} catch (e) {
  console.warn('[OnlineTracker] Column check note:', e.message);
}

function touchUser(userId) {
  if (!userId) return;
  const id = Number(userId);
  const now = Date.now();
  activeUsers.set(id, now);

  // Update DB asynchronously without blocking
  try {
    db.prepare('UPDATE users SET last_active_at = CURRENT_TIMESTAMP WHERE id = ?').run(id);
  } catch (err) {
    // Ignore db write error
  }
}

function removeUser(userId) {
  if (!userId) return;
  const id = Number(userId);
  activeUsers.delete(id);
  try {
    db.prepare("UPDATE users SET last_active_at = datetime('now', '-2 hours') WHERE id = ?").run(id);
  } catch (err) {
    // Ignore db write error
  }
}

function isUserOnline(userId) {
  if (!userId) return false;
  const id = Number(userId);
  const lastSeen = activeUsers.get(id);
  if (!lastSeen) return false;
  return (Date.now() - lastSeen) <= ONLINE_WINDOW_MS;
}

module.exports = {
  touchUser,
  removeUser,
  isUserOnline,
  ONLINE_WINDOW_MS
};
