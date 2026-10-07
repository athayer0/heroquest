export const randRange = (min, max) => min + Math.random() * (max - min);
export const randInt = (min, max) => Math.floor(min + Math.random() * (max - min + 1));
export const chance = (p) => Math.random() < p;
export const clamp = (v, min, max) => Math.max(min, Math.min(max, v));

// 75 → "1:15", 3725 → "1:02:05"
export function formatTime(seconds) {
  const s = Math.floor(seconds);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = String(s % 60).padStart(2, '0');
  return h > 0 ? `${h}:${String(m).padStart(2, '0')}:${sec}` : `${m}:${sec}`;
}

export function rectsOverlap(a, b) {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}

export function rectCenter(r) {
  return { x: r.x + r.w / 2, y: r.y + r.h / 2 };
}

// Unit vector from (fx, fy) toward (tx, ty); falls back to `fallback` when they coincide.
export function dirTo(fx, fy, tx, ty, fallback = { x: 0, y: 1 }) {
  const dx = tx - fx;
  const dy = ty - fy;
  const len = Math.hypot(dx, dy);
  return len < 0.01 ? fallback : { x: dx / len, y: dy / len };
}
