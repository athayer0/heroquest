// Status visuals drawn over a sprite: an orange flicker and embers while burning, a pale-blue
// tint while slowed, and an ice block while frozen.
import { tinted } from './sprites.js';
import { isBurning, isSlowed, isFrozen } from '../systems/status.js';

function overlay(ctx, img, x, y, w, h, color, alpha) {
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.drawImage(tinted(img, color), x, y, w, h);
  ctx.restore();
}

// img: the frame just drawn at (x, y), optionally scaled to w × h.
export function drawStatusFx(ctx, target, img, x, y, w = img.width, h = img.height) {
  const st = target.status;
  if (!st) return;
  if (isFrozen(target)) {
    overlay(ctx, img, x, y, w, h, '#c8ecff', 0.55);
    ctx.fillStyle = 'rgba(170,220,255,0.35)';
    ctx.fillRect(x - 1, y - 1, w + 2, h + 2);
    ctx.fillStyle = 'rgba(240,250,255,0.85)';
    ctx.fillRect(x - 1, y - 1, w + 2, 1);
    ctx.fillRect(x - 1, y - 1, 1, h + 2);
    ctx.fillStyle = 'rgba(120,180,230,0.85)';
    ctx.fillRect(x - 1, y + h, w + 2, 1);
    ctx.fillRect(x + w, y - 1, 1, h + 2);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(x + 2, y + 2, 2, 1);
    ctx.fillRect(x + 2, y + 3, 1, 2);
  } else if (isSlowed(target)) {
    overlay(ctx, img, x, y, w, h, '#a0d8ff', 0.4);
  }
  if (isBurning(target)) {
    const flick = Math.floor(st.burnT * 12) % 2 === 0;
    overlay(ctx, img, x, y, w, h, '#ff8a2a', flick ? 0.5 : 0.25);
    // Embers rising off the top of the sprite.
    for (let i = 0; i < 3; i++) {
      const rise = (st.burnT * 18 + i * 5) % 9;
      const ex = x + Math.round(((i * 37 + Math.floor(st.burnT * 6) * 13) % Math.max(1, w - 2)) + 1);
      ctx.fillStyle = rise < 4 ? '#ffe060' : '#ff7a20';
      ctx.fillRect(ex, Math.round(y + 2 - rise), 1, 2);
    }
  }
}
