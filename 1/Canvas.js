// utils/canvas.js
// إنشاء صور Level Up Card و Rank Card باستخدام @napi-rs/canvas

const { createCanvas, loadImage, GlobalFonts } = require('@napi-rs/canvas');
const path = require('path');
const fs   = require('fs');
const { getXpForLevel, getProgressInLevel } = require('./xp');

// مسار صورة الخلفية — غيّر هذا الملف لتغيير الخلفية
const BG_PATH = path.join(__dirname, '../assets/background.png');

// =================== مساعدات رسم ===================

/**
 * ارسم نص عربي مع محاذاة يمين (RTL)
 */
function drawRTLText(ctx, text, x, y) {
  // Canvas لا يدعم RTL الكامل؛ نعرض النص طبيعياً
  ctx.fillText(text, x, y);
}

/**
 * ارسم مستطيل بزوايا مدورة
 */
function roundRect(ctx, x, y, width, height, radius) {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + width - radius, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
  ctx.lineTo(x + width, y + height - radius);
  ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  ctx.lineTo(x + radius, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
}

/**
 * اجلب صورة من URL بشكل آمن
 */
async function safeLoadImage(url) {
  try {
    return await loadImage(url);
  } catch {
    return null;
  }
}

// =================== Level Up Card ===================
/**
 * @param {{ username: string, avatarUrl: string, serverIcon: string|null, level: number }} opts
 * @returns {Promise<Buffer>}
 */
async function generateLevelUpCard({ username, avatarUrl, serverIcon, level }) {
  const W = 700, H = 220;
  const canvas = createCanvas(W, H);
  const ctx    = canvas.getContext('2d');

  // --- خلفية ---
  if (fs.existsSync(BG_PATH)) {
    const bg = await loadImage(BG_PATH);
    ctx.drawImage(bg, 0, 0, W, H);
  } else {
    // تدرج لوني كخلفية افتراضية
    const grad = ctx.createLinearGradient(0, 0, W, H);
    grad.addColorStop(0, '#0f0c29');
    grad.addColorStop(0.5, '#302b63');
    grad.addColorStop(1, '#24243e');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, W, H);
  }

  // طبقة شفافة داكنة فوق الخلفية للقراءة الجيدة
  ctx.fillStyle = 'rgba(0, 0, 0, 0.55)';
  ctx.fillRect(0, 0, W, H);

  // --- توهج زخرفي ---
  const glow = ctx.createRadialGradient(W / 2, H / 2, 10, W / 2, H / 2, 300);
  glow.addColorStop(0, 'rgba(88, 101, 242, 0.25)');
  glow.addColorStop(1, 'rgba(0, 0, 0, 0)');
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, W, H);

  // --- Avatar ---
  const avatarSize = 150;
  const avatarX    = 35;
  const avatarY    = (H - avatarSize) / 2;

  const avatarImg = await safeLoadImage(avatarUrl);
  if (avatarImg) {
    // قص دائري
    ctx.save();
    ctx.beginPath();
    ctx.arc(avatarX + avatarSize / 2, avatarY + avatarSize / 2, avatarSize / 2, 0, Math.PI * 2);
    ctx.closePath();
    ctx.clip();
    ctx.drawImage(avatarImg, avatarX, avatarY, avatarSize, avatarSize);
    ctx.restore();

    // حلقة حول الـ Avatar
    ctx.beginPath();
    ctx.arc(avatarX + avatarSize / 2, avatarY + avatarSize / 2, avatarSize / 2 + 3, 0, Math.PI * 2);
    ctx.strokeStyle = '#5865f2';
    ctx.lineWidth   = 4;
    ctx.stroke();
  }

  // --- النصوص ---
  const textX = avatarX + avatarSize + 30;

  // نص المبروك
  ctx.font      = 'bold 22px sans-serif';
  ctx.fillStyle = '#a5b4fc';
  ctx.fillText('🎉 مبروك وصلت إلى', textX, avatarY + 38);

  // رقم الـ Level (كبير)
  ctx.font      = 'bold 72px sans-serif';
  ctx.fillStyle = '#ffffff';
  ctx.fillText(`LEVEL`, textX, avatarY + 108);

  ctx.font      = 'bold 72px sans-serif';
  ctx.fillStyle = '#5865f2';
  ctx.fillText(` ${level}`, textX + 110, avatarY + 108);

  // اسم العضو
  ctx.font      = 'bold 24px sans-serif';
  ctx.fillStyle = '#e2e8f0';
  const displayName = username.length > 20 ? username.slice(0, 20) + '…' : username;
  ctx.fillText(displayName, textX, avatarY + 145);

  // --- شعار السيرفر ---
  if (serverIcon) {
    const iconImg = await safeLoadImage(serverIcon);
    if (iconImg) {
      const iconSize = 40;
      const iconX    = W - iconSize - 20;
      const iconY    = 20;
      ctx.save();
      ctx.beginPath();
      ctx.arc(iconX + iconSize / 2, iconY + iconSize / 2, iconSize / 2, 0, Math.PI * 2);
      ctx.closePath();
      ctx.clip();
      ctx.drawImage(iconImg, iconX, iconY, iconSize, iconSize);
      ctx.restore();
    }
  }

  return canvas.toBuffer('image/png');
}

// =================== Rank Card ===================
/**
 * @param {{ username, avatarUrl, level, xp, nextLevelXp, rank, totalUsers }} opts
 * @returns {Promise<Buffer>}
 */
async function generateRankCard({ username, avatarUrl, level, xp, nextLevelXp, rank, totalUsers }) {
  const W = 800, H = 250;
  const canvas = createCanvas(W, H);
  const ctx    = canvas.getContext('2d');

  // --- خلفية ---
  if (fs.existsSync(BG_PATH)) {
    const bg = await loadImage(BG_PATH);
    ctx.drawImage(bg, 0, 0, W, H);
  } else {
    const grad = ctx.createLinearGradient(0, 0, W, H);
    grad.addColorStop(0, '#0f0c29');
    grad.addColorStop(0.5, '#302b63');
    grad.addColorStop(1, '#24243e');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, W, H);
  }

  ctx.fillStyle = 'rgba(0, 0, 0, 0.60)';
  ctx.fillRect(0, 0, W, H);

  // --- Avatar ---
  const avatarSize = 160;
  const avatarX    = 30;
  const avatarY    = (H - avatarSize) / 2;

  const avatarImg = await safeLoadImage(avatarUrl);
  if (avatarImg) {
    ctx.save();
    ctx.beginPath();
    ctx.arc(avatarX + avatarSize / 2, avatarY + avatarSize / 2, avatarSize / 2, 0, Math.PI * 2);
    ctx.closePath();
    ctx.clip();
    ctx.drawImage(avatarImg, avatarX, avatarY, avatarSize, avatarSize);
    ctx.restore();

    ctx.beginPath();
    ctx.arc(avatarX + avatarSize / 2, avatarY + avatarSize / 2, avatarSize / 2 + 4, 0, Math.PI * 2);
    ctx.strokeStyle = '#5865f2';
    ctx.lineWidth   = 5;
    ctx.stroke();
  }

  const textX = avatarX + avatarSize + 28;

  // --- Rank ---
  ctx.font      = 'bold 20px sans-serif';
  ctx.fillStyle = '#94a3b8';
  ctx.fillText(`RANK`, W - 130, 42);

  ctx.font      = 'bold 38px sans-serif';
  ctx.fillStyle = '#ffffff';
  ctx.fillText(`#${rank}`, W - 110, 85);

  // --- اسم العضو ---
  ctx.font      = 'bold 32px sans-serif';
  ctx.fillStyle = '#ffffff';
  const displayName = username.length > 18 ? username.slice(0, 18) + '…' : username;
  ctx.fillText(displayName, textX, avatarY + 42);

  // --- Level ---
  ctx.font      = 'bold 20px sans-serif';
  ctx.fillStyle = '#94a3b8';
  ctx.fillText('LEVEL', textX, avatarY + 80);

  ctx.font      = 'bold 38px sans-serif';
  ctx.fillStyle = '#5865f2';
  ctx.fillText(`${level}`, textX + 70, avatarY + 80);

  // --- XP ---
  const xpInLevel     = xp - getXpForLevel(level);
  const xpNeeded      = getXpForLevel(level + 1) - getXpForLevel(level);
  const progress      = Math.min(xpInLevel / xpNeeded, 1);

  ctx.font      = 'bold 18px sans-serif';
  ctx.fillStyle = '#94a3b8';
  ctx.fillText(`${xp.toLocaleString()} / ${nextLevelXp.toLocaleString()} XP`, textX, avatarY + 115);

  // --- شريط XP ---
  const barX      = textX;
  const barY      = avatarY + 130;
  const barW      = W - textX - 30;
  const barH      = 22;
  const barRadius = 11;

  // خلفية الشريط
  ctx.fillStyle = 'rgba(255,255,255,0.12)';
  roundRect(ctx, barX, barY, barW, barH, barRadius);
  ctx.fill();

  // تعبئة الشريط
  if (progress > 0) {
    const fillW   = Math.max(barRadius * 2, barW * progress);
    const fillGrd = ctx.createLinearGradient(barX, 0, barX + fillW, 0);
    fillGrd.addColorStop(0, '#5865f2');
    fillGrd.addColorStop(1, '#a78bfa');
    ctx.fillStyle = fillGrd;
    roundRect(ctx, barX, barY, fillW, barH, barRadius);
    ctx.fill();
  }

  // نسبة مئوية داخل الشريط
  ctx.font      = 'bold 12px sans-serif';
  ctx.fillStyle = '#ffffff';
  ctx.fillText(`${Math.round(progress * 100)}%`, barX + barW / 2 - 14, barY + 15);

  // --- إجمالي الأعضاء ---
  ctx.font      = '15px sans-serif';
  ctx.fillStyle = '#64748b';
  ctx.fillText(`من ${totalUsers} عضو`, barX, barY + barH + 22);

  return canvas.toBuffer('image/png');
}

module.exports = { generateLevelUpCard, generateRankCard };