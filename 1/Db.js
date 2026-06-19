// database/db.js
// قاعدة بيانات SQLite بسيطة وسريعة باستخدام better-sqlite3

const Database = require('better-sqlite3');
const path     = require('path');
const fs       = require('fs');

// ضمان وجود مجلد database
const dbDir = path.join(__dirname);
if (!fs.existsSync(dbDir)) fs.mkdirSync(dbDir, { recursive: true });

const db = new Database(path.join(dbDir, 'levels.db'));

// إنشاء الجدول إن لم يكن موجوداً
db.exec(`
  CREATE TABLE IF NOT EXISTS levels (
    userId  TEXT NOT NULL,
    guildId TEXT NOT NULL,
    xp      INTEGER DEFAULT 0,
    level   INTEGER DEFAULT 0,
    PRIMARY KEY (userId, guildId)
  )
`);

// ========== الدوال المتاحة ==========

/**
 * جلب بيانات عضو معين في سيرفر معين
 * @returns {{ userId, guildId, xp, level }}
 */
function getUser(userId, guildId) {
  let row = db.prepare(
    'SELECT * FROM levels WHERE userId = ? AND guildId = ?'
  ).get(userId, guildId);

  if (!row) {
    db.prepare(
      'INSERT OR IGNORE INTO levels (userId, guildId, xp, level) VALUES (?, ?, 0, 0)'
    ).run(userId, guildId);
    row = { userId, guildId, xp: 0, level: 0 };
  }
  return row;
}

/**
 * تحديث أو إنشاء بيانات عضو
 * @param {string} userId
 * @param {string} guildId
 * @param {{ xp?: number, level?: number }} data
 */
function setUser(userId, guildId, { xp, level }) {
  db.prepare(`
    INSERT INTO levels (userId, guildId, xp, level)
    VALUES (?, ?, ?, ?)
    ON CONFLICT(userId, guildId) DO UPDATE SET
      xp    = excluded.xp,
      level = excluded.level
  `).run(userId, guildId, xp ?? 0, level ?? 0);
}

/**
 * جلب جميع الأعضاء في سيرفر مرتبين حسب Level ثم XP
 * @returns {Array<{ userId, guildId, xp, level }>}
 */
function getAllUsers(guildId) {
  return db.prepare(
    'SELECT * FROM levels WHERE guildId = ? ORDER BY level DESC, xp DESC'
  ).all(guildId);
}

module.exports = { getUser, setUser, getAllUsers };