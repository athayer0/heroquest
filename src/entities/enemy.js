// Base class for all enemies: stats, spawn-in, hit flash, knockback and tile collision.
// Subclasses implement think(dt, ctx) for behavior and sprite() for drawing.
import { ENEMIES, ENEMY_HIT } from '../config.js';
import { makeSprite, solidColors } from '../gfx/sprites.js';
import { dirTo } from '../util.js';

const spriteCache = new Map();

// Builds (once per art/colors) the normal and white hit-flash versions of a sprite.
export function enemySprite(key, art, colors, flipX = false) {
  if (!spriteCache.has(key)) {
    spriteCache.set(key, {
      normal: makeSprite(art, colors, flipX),
      flash: makeSprite(art, solidColors(colors), flipX),
    });
  }
  return spriteCache.get(key);
}

export class Enemy {
  constructor(type, x, y, hitbox = { x: 2, y: 4, w: 12, h: 11 }, stats = ENEMIES[type]) {
    this.type = type;
    this.stats = stats;
    this.hp = this.stats.hp;
    this.x = x;
    this.y = y;
    this.hb = hitbox;
    this.spawnT = ENEMY_HIT.spawnTime;
    this.flashT = 0;
    this.kb = { x: 0, y: 0, t: 0 };
    this.lastSwingId = -1;
    this.dead = false;
    this.flying = false; // flyers pass over water
  }

  get hitbox() {
    return { x: this.x + this.hb.x, y: this.y + this.hb.y, w: this.hb.w, h: this.hb.h };
  }

  get center() {
    const hb = this.hitbox;
    return { x: hb.x + hb.w / 2, y: hb.y + hb.h / 2 };
  }

  // Harmless and untouchable while spawning in.
  get active() {
    return this.spawnT <= 0 && !this.dead;
  }

  get attack() {
    return this.stats.attack;
  }

  update(dt, ctx) {
    if (this.spawnT > 0) {
      this.spawnT -= dt;
      return;
    }
    this.flashT = Math.max(0, this.flashT - dt);
    if (this.kb.t > 0) {
      this.kb.t -= dt;
      this.move(this.kb.x * dt, this.kb.y * dt, ctx.room);
      return;
    }
    this.think(dt, ctx);
  }

  think() {}

  // Returns true if the hit landed, 'blocked' if deflected (see Knight), false otherwise.
  // A single sword swing can only hit once.
  hurt(damage, fromX, fromY, swingId) {
    if (!this.active || swingId === this.lastSwingId) return false;
    this.lastSwingId = swingId;
    this.hp -= damage;
    this.flashT = ENEMY_HIT.flashTime;
    const c = this.center;
    const d = dirTo(fromX, fromY, c.x, c.y);
    this.kb = { x: d.x * ENEMY_HIT.knockbackSpeed, y: d.y * ENEMY_HIT.knockbackSpeed, t: ENEMY_HIT.knockbackTime };
    if (this.hp <= 0) this.dead = true;
    this.onHurt?.();
    return true;
  }

  // Axis-separated movement that stops at walls and room edges. Returns which axes were blocked.
  move(dx, dy, room) {
    const blocked = { x: false, y: false };
    const hb = this.hitbox;
    if (dx) {
      if (room.rectBlocked(hb.x + dx, hb.y, hb.w, hb.h, true, this.flying)) blocked.x = true;
      else this.x += dx;
    }
    if (dy) {
      const hb2 = this.hitbox;
      if (room.rectBlocked(hb2.x, hb2.y + dy, hb2.w, hb2.h, true, this.flying)) blocked.y = true;
      else this.y += dy;
    }
    return blocked;
  }

  // Subclasses return { img: {normal, flash}, dx, dy, w?, h? }.
  sprite() {
    return null;
  }

  draw(ctx, ox, oy) {
    if (this.spawnT > 0) return; // the spawn puff effect is drawn instead
    const s = this.sprite();
    if (!s) return;
    const img = this.flashT > 0 && Math.floor(this.flashT * 40) % 2 === 0 ? s.img.flash : s.img.normal;
    const x = Math.round(this.x + (s.dx ?? 0) + ox);
    const y = Math.round(this.y + (s.dy ?? 0) + oy);
    ctx.drawImage(img, x, y, s.w ?? img.width, s.h ?? img.height);
  }
}
