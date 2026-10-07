// Base class for all enemies: stats, spawn-in, hit flash, knockback, status effects and tile collision.
// Subclasses implement think(dt, ctx) for behavior and sprite() for drawing.
// Optional stats flags: noKnockback, immune: ['fire' | 'ice'], weak: ['fire' | 'ice'] (double damage).
import { ENEMIES, ENEMY_HIT } from '../config.js';
import { makeSprite, solidColors } from '../gfx/sprites.js';
import { drawStatusFx } from '../gfx/statusFx.js';
import { newStatus, isFrozen, statusSpeedMult } from '../systems/status.js';
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
    this.status = newStatus();
    this.immune = this.stats.immune ?? [];
    this.weak = this.stats.weak ?? [];
    this.noKnockback = this.stats.noKnockback ?? false;
    this.freezeImmune = false;
  }

  get frozen() {
    return isFrozen(this);
  }

  // No contact damage right now (frozen; a boss may add states, e.g. stunned).
  get harmless() {
    return this.frozen;
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
    if (this.frozen) {
      this.kb.t = 0; // can't move or act (the freeze cancelled any wind-up; see onFrozen)
      return;
    }
    if (this.kb.t > 0) {
      this.kb.t -= dt;
      this.move(this.kb.x * dt, this.kb.y * dt, ctx.room);
      return;
    }
    // Slowed enemies run their whole behavior at reduced speed: movement and timers alike.
    this.think(dt * statusSpeedMult(this), ctx);
  }

  think() {}

  // Returns true if the hit landed, 'blocked' if deflected (see Knight), false otherwise.
  // A single sword swing can only hit once; swingId is null for hits that aren't swings (spells).
  hurt(damage, fromX, fromY, swingId = null) {
    if (!this.active || this.sameSwing(swingId)) return false;
    if (swingId !== null) this.lastSwingId = swingId;
    this.hp -= damage;
    this.flashT = ENEMY_HIT.flashTime;
    if (!this.noKnockback) {
      const c = this.center;
      const d = dirTo(fromX, fromY, c.x, c.y);
      this.kb = { x: d.x * ENEMY_HIT.knockbackSpeed, y: d.y * ENEMY_HIT.knockbackSpeed, t: ENEMY_HIT.knockbackTime };
    }
    if (this.hp <= 0) this.dead = true;
    this.onHurt?.();
    return true;
  }

  // Damage with no knockback, flash or swing check (burn ticks). Returns true if it was lethal.
  loseHp(damage) {
    if (!this.active) return false;
    this.hp -= damage;
    if (this.hp <= 0) this.dead = true;
    return this.dead;
  }

  sameSwing(swingId) {
    return swingId !== null && swingId === this.lastSwingId;
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
    const w = s.w ?? img.width;
    const h = s.h ?? img.height;
    ctx.drawImage(img, x, y, w, h);
    drawStatusFx(ctx, this, s.img.normal, x, y, w, h);
  }
}
