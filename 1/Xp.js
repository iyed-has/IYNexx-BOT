// utils/xp.js
// معادلات حساب الـ XP والـ Level — نفس نمط Arcane/MEE6

/**
 * احسب إجمالي XP المطلوبة للوصول إلى level معين
 * المعادلة: 5 * (level^2) + 50 * level + 100
 *
 * مثال:
 *   Level 1 → 155 XP
 *   Level 5 → 475 XP
 *   Level 10 → 1100 XP
 *
 * @param {number} level
 * @returns {number}
 */
function getXpForLevel(level) {
  if (level <= 0) return 0;
  let total = 0;
  for (let i = 0; i < level; i++) {
    total += 5 * (i * i) + 50 * i + 100;
  }
  return total;
}

/**
 * احسب الـ Level الحالي من إجمالي XP
 *
 * @param {number} totalXp
 * @returns {number}
 */
function getLevelFromXp(totalXp) {
  let level = 0;
  while (getXpForLevel(level + 1) <= totalXp) {
    level++;
  }
  return level;
}

/**
 * احسب نسبة التقدم داخل الـ Level الحالي (0 ~ 1)
 *
 * @param {number} totalXp
 * @param {number} currentLevel
 * @returns {number}
 */
function getProgressInLevel(totalXp, currentLevel) {
  const currentLevelXp = getXpForLevel(currentLevel);
  const nextLevelXp    = getXpForLevel(currentLevel + 1);
  const range          = nextLevelXp - currentLevelXp;
  const progress       = totalXp - currentLevelXp;
  return Math.min(progress / range, 1);
}

module.exports = { getXpForLevel, getLevelFromXp, getProgressInLevel };