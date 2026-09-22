// Memory tracker for user online/active status
const activeUsers = new Map(); // userId (number) -> timestamp (ms)

const ONLINE_WINDOW_MS = 2 * 60 * 1000; // 2 minutes

function touchUser(userId) {
  if (userId) {
    activeUsers.set(Number(userId), Date.now());
  }
}

function removeUser(userId) {
  if (userId) {
    activeUsers.delete(Number(userId));
  }
}

function isUserOnline(userId) {
  if (!userId) return false;
  const lastSeen = activeUsers.get(Number(userId));
  if (!lastSeen) return false;
  return (Date.now() - lastSeen) < ONLINE_WINDOW_MS;
}

module.exports = {
  touchUser,
  removeUser,
  isUserOnline
};
