// Short-lived visual effects: floating numbers, hit sparks, spawn/death puffs.
import { drawTextShadow, textWidth } from '../gfx/font.js';
import { px } from '../gfx/sprites.js';

export class FloatText {
  constructor(text, x, y, color = '#f4f4f0', life = 0.8) {
    this.text = String(text);
    this.x = x;
    this.y = y;
    this.color = color;
    this.t = 0;
    this.life = life;
  }
  update(dt) {
    this.t += dt;
    this.y -= 18 * dt;
  }
  get done() {
    return this.t >= this.life;
  }
  draw(ctx, ox, oy) {
    drawTextShadow(ctx, this.text, Math.round(this.x - textWidth(this.text) / 2 + ox), Math.round(this.y + oy), this.color);
  }
}

// Small white star where a hit lands.
export class Spark {
  constructor(x, y, color = '#ffffff') {
    this.x = Math.round(x);
    this.y = Math.round(y);
    this.color = color;
    this.t = 0;
    this.life = 0.12;
  }
  update(dt) {
    this.t += dt;
  }
  get done() {
    return this.t >= this.life;
  }
  draw(ctx, ox, oy) {
    const x = this.x + ox;
    const y = this.y + oy;
    const r = this.t < this.life / 2 ? 3 : 2;
    px(ctx, this.color, x - r, y, r * 2 + 1, 1);
    px(ctx, this.color, x, y - r, 1, r * 2 + 1);
  }
}

// Expanding ring of puffs, used when enemies spawn in or are defeated.
export class Puff {
  constructor(x, y, life = 0.35, color = '#f4f4f0') {
    this.x = x;
    this.y = y;
    this.life = life;
    this.color = color;
    this.t = 0;
  }
  update(dt) {
    this.t += dt;
  }
  get done() {
    return this.t >= this.life;
  }
  draw(ctx, ox, oy) {
    const p = this.t / this.life;
    const r = 2 + p * 8;
    const size = p < 0.6 ? 3 : 2;
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2 + p;
      const x = Math.round(this.x + Math.cos(a) * r + ox - size / 2);
      const y = Math.round(this.y + Math.sin(a) * r + oy - size / 2);
      px(ctx, this.color, x, y, size, size);
    }
  }
}

// Level-up celebration that follows the hero: a golden ring bursts outward,
// then sparkles rise around them for the rest of the duration.
export class LevelUpBurst {
  constructor(target, life = 1) {
    this.target = target;
    this.life = life;
    this.t = 0;
    this.sparkles = Array.from({ length: 10 }, (_, i) => ({
      dx: Math.cos((i / 10) * Math.PI * 2) * (6 + Math.random() * 6),
      delay: Math.random() * 0.5,
      speed: 28 + Math.random() * 18,
    }));
  }
  update(dt) {
    this.t += dt;
  }
  get done() {
    return this.t >= this.life;
  }
  draw(ctx, ox, oy) {
    const c = this.target.center;
    const cx = c.x + ox;
    const cy = c.y + oy;

    // Expanding ring during the first 40%.
    const ringP = this.t / (this.life * 0.4);
    if (ringP < 1) {
      const r = 4 + ringP * 22;
      const size = ringP < 0.5 ? 3 : 2;
      ctx.fillStyle = ringP < 0.5 ? '#fff6c0' : '#ffe060';
      for (let i = 0; i < 16; i++) {
        const a = (i / 16) * Math.PI * 2;
        ctx.fillRect(Math.round(cx + Math.cos(a) * r - size / 2), Math.round(cy + Math.sin(a) * r * 0.8 - size / 2), size, size);
      }
    }

    // Rising, twinkling sparkles.
    for (const s of this.sparkles) {
      const st = this.t - s.delay;
      if (st < 0) continue;
      const y = cy + 6 - st * s.speed;
      const x = cx + s.dx;
      const twinkle = Math.floor((st + s.delay) * 12) % 3;
      ctx.fillStyle = twinkle === 0 ? '#ffffff' : '#ffe060';
      const px = Math.round(x);
      const py = Math.round(y);
      ctx.fillRect(px, py, 1, 1);
      if (twinkle !== 2) {
        ctx.fillRect(px - 1, py, 3, 1);
        ctx.fillRect(px, py - 1, 1, 3);
      }
    }
  }
}

// Ground-slam impact: a dotted ring expanding out to the slam radius.
export class Shockwave {
  constructor(x, y, radius, life = 0.35) {
    this.x = x;
    this.y = y;
    this.radius = radius;
    this.life = life;
    this.t = 0;
  }
  update(dt) {
    this.t += dt;
  }
  get done() {
    return this.t >= this.life;
  }
  draw(ctx, ox, oy) {
    const p = this.t / this.life;
    for (const [scale, color] of [[1, '#ffe0a0'], [0.7, '#ff6040']]) {
      const r = this.radius * scale * (0.4 + 0.6 * p);
      ctx.fillStyle = color;
      for (let i = 0; i < 24; i++) {
        const a = (i / 24) * Math.PI * 2 + p;
        ctx.fillRect(Math.round(this.x + Math.cos(a) * r + ox) - 1, Math.round(this.y + Math.sin(a) * r + oy) - 1, 3, 3);
      }
    }
  }
}

// A heart that drifts upward and fades (ending scene).
export class HeartFloat {
  constructor(x, y, icon, life = 1.4) {
    this.x = x;
    this.y = y;
    this.icon = icon;
    this.life = life;
    this.t = 0;
    this.phase = Math.random() * Math.PI * 2;
  }
  update(dt) {
    this.t += dt;
    this.y -= 16 * dt;
  }
  get done() {
    return this.t >= this.life;
  }
  draw(ctx, ox, oy) {
    ctx.save();
    ctx.globalAlpha = Math.max(0, 1 - this.t / this.life);
    const x = Math.round(this.x + Math.sin(this.t * 4 + this.phase) * 3 + ox - this.icon.width / 2);
    ctx.drawImage(this.icon, x, Math.round(this.y + oy));
    ctx.restore();
  }
}

// A jagged lightning bolt between two points that flickers and fades.
export class LightningArc {
  constructor(from, to, life = 0.28) {
    this.from = { ...from };
    this.to = { ...to };
    this.life = life;
    this.t = 0;
  }
  update(dt) {
    this.t += dt;
  }
  get done() {
    return this.t >= this.life;
  }
  draw(ctx, ox, oy) {
    if (Math.floor(this.t * 30) % 3 === 2) return; // flicker
    const { from, to } = this;
    const dx = to.x - from.x;
    const dy = to.y - from.y;
    const len = Math.hypot(dx, dy) || 1;
    const nx = -dy / len;
    const ny = dx / len;
    const segments = Math.max(3, Math.round(len / 10));
    const pts = [from];
    for (let i = 1; i < segments; i++) {
      const jitter = (Math.random() - 0.5) * 8;
      pts.push({ x: from.x + (dx * i) / segments + nx * jitter, y: from.y + (dy * i) / segments + ny * jitter });
    }
    pts.push(to);
    for (const [width, color] of [[3, 'rgba(255,240,120,0.5)'], [1, '#ffffff']]) {
      ctx.strokeStyle = color;
      ctx.lineWidth = width;
      ctx.beginPath();
      ctx.moveTo(pts[0].x + ox, pts[0].y + oy);
      for (const pt of pts.slice(1)) ctx.lineTo(pt.x + ox, pt.y + oy);
      ctx.stroke();
    }
  }
}
