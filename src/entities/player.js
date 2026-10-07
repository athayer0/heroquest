import { PLAYER, SWORD, SWORDS, ARMOR, POTION } from '../config.js';
import { ROOM_W, ROOM_H } from '../constants.js';
import { makeSprite, solidColors } from '../gfx/sprites.js';
import { PLAYER_ART, SWORD_ART } from '../gfx/art.js';
import { SWORD_COLORS, ARMOR_COLORS } from '../gfx/palette.js';
import { dirTo } from '../util.js';
import { newRunStats } from '../systems/save.js';

// Collision box relative to the sprite's top-left (the lower body, Zelda-style,
// so the head can overlap walls and 1-tile gaps feel roomy).
const HB = { x: 3, y: 7, w: 10, h: 8 };
const NUDGE = 6; // max pixels of corner-assist when sliding past tile corners
const WALK_FPS = 8;

// Sword sweep: the blade rotates around the hero's hand through SWORD.arcDegrees.
const FACING_ANGLE = { right: 0, down: Math.PI / 2, left: Math.PI, up: -Math.PI / 2 };
const PIVOT = { x: 8, y: 10 }; // hand position relative to the sprite's top-left
const SWEEP_PORTION = 0.7; // fraction of the swing spent sweeping; the rest holds at the end
const BLADE_START = 6; // px from the hand where the blade starts to hurt
const BLADE_TIP = 18; // px from the hand to the drawn blade tip
const easeOut = (t) => 1 - (1 - t) * (1 - t);

// Base hero colors; the tunic (g/G) comes from the equipped armor.
const BASE_COLORS = { k: '#1b1b23', s: '#f2c08a', h: '#8a4b1e', b: '#6b3d1e' };

export function heroColors(armorId) {
  return { ...BASE_COLORS, ...ARMOR_COLORS[armorId] };
}

const spriteCache = new Map();
export function getPlayerSprites(colors) {
  const key = JSON.stringify(colors);
  if (!spriteCache.has(key)) {
    const build = (frames, flip = false) => frames.map((f) => makeSprite(f, colors, flip));
    spriteCache.set(key, {
      down: build(PLAYER_ART.down),
      up: build(PLAYER_ART.up),
      right: build(PLAYER_ART.right),
      left: build(PLAYER_ART.right, true),
    });
  }
  return spriteCache.get(key);
}

const swordCache = new Map();
export function getSwordSprite(tier) {
  if (!swordCache.has(tier)) swordCache.set(tier, makeSprite(SWORD_ART, SWORD_COLORS[tier]));
  return swordCache.get(tier);
}

export class Player {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.facing = 'down';
    this.moving = false;
    this.animT = 0;

    this.maxHp = PLAYER.maxHp;
    this.hp = PLAYER.maxHp;
    this.baseDamage = PLAYER.baseDamage;
    this.gold = PLAYER.gold;
    this.potions = 0;
    this.level = 1;
    this.xp = 0; // progress toward the next level
    this.stats = newRunStats(); // play time, kills, deaths, gold collected

    this.swordTier = 0; // index into SWORDS
    this.armorTier = 0; // index into ARMOR

    this.attackT = 0;
    this.attackCd = 0;
    this.swingId = 0;
    this.invulnT = 0; // after taking a hit (flashing)
    this.glowT = 0; // level-up invincibility (golden glow, no flashing)
    this.kb = { x: 0, y: 0, t: 0 };
  }

  get sword() {
    return SWORDS[this.swordTier];
  }

  get armor() {
    return ARMOR[this.armorTier];
  }

  get swordBonus() {
    return this.sword.bonus;
  }

  get defense() {
    return PLAYER.defense + this.armor.defense;
  }

  get colors() {
    return heroColors(this.armor.id);
  }

  // Returns HP healed, or 0 if no potion was used.
  drinkPotion() {
    if (this.potions <= 0 || this.hp >= this.maxHp) return 0;
    this.potions--;
    return this.heal(POTION.heal);
  }

  get hitbox() {
    return { x: this.x + HB.x, y: this.y + HB.y, w: HB.w, h: HB.h };
  }

  get center() {
    return { x: this.x + HB.x + HB.w / 2, y: this.y + HB.y + HB.h / 2 };
  }

  get attacking() {
    return this.attackT > 0;
  }

  get pivot() {
    return { x: this.x + PIVOT.x, y: this.y + PIVOT.y };
  }

  // 0 → 1 over the sweeping part of the swing.
  get swingProgress() {
    const t = 1 - this.attackT / SWORD.swingTime;
    return easeOut(Math.min(1, t / SWEEP_PORTION));
  }

  swordAngle(progress) {
    const half = (SWORD.arcDegrees * Math.PI) / 360;
    return FACING_ANGLE[this.facing] - half + 2 * half * progress;
  }

  // True if the arc swept so far (from the start of the swing to now) touches `rect`.
  swordHits(rect) {
    if (!this.attacking) return false;
    const pad = SWORD.hitPadding;
    const r = { x: rect.x - pad, y: rect.y - pad, w: rect.w + pad * 2, h: rect.h + pad * 2 };
    const pv = this.pivot;
    const progress = this.swingProgress;
    const steps = Math.max(1, Math.ceil(progress * 12));
    for (let i = 0; i <= steps; i++) {
      const a = this.swordAngle((progress * i) / steps);
      const cos = Math.cos(a);
      const sin = Math.sin(a);
      for (let d = BLADE_START; d <= SWORD.reach; d += 3) {
        const x = pv.x + cos * d;
        const y = pv.y + sin * d;
        if (x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h) return true;
      }
    }
    return false;
  }

  update(dt, input, room) {
    this.invulnT = Math.max(0, this.invulnT - dt);
    this.glowT = Math.max(0, this.glowT - dt);
    this.attackCd = Math.max(0, this.attackCd - dt);

    if (this.kb.t > 0) {
      this.kb.t -= dt;
      this.tryMove(this.kb.x * dt, 0, room);
      this.tryMove(0, this.kb.y * dt, room);
      this.moving = false;
      return;
    }

    if (this.attackT > 0) {
      this.attackT -= dt;
      if (this.attackT <= 0) this.attackCd = SWORD.cooldown;
      return;
    }

    if (input.wasPressed('attack') && this.attackCd <= 0) {
      this.attackT = SWORD.swingTime;
      this.swingId++;
      this.moving = false;
      return;
    }

    const mx = (input.isDown('right') ? 1 : 0) - (input.isDown('left') ? 1 : 0);
    const my = (input.isDown('down') ? 1 : 0) - (input.isDown('up') ? 1 : 0);
    this.moving = mx !== 0 || my !== 0;

    if (!this.moving) {
      this.animT = 0;
      return;
    }

    this.updateFacing(mx, my, input.lastDir);
    const len = Math.hypot(mx, my);
    const dist = PLAYER.speed * dt;
    this.moveBy((mx / len) * dist, (my / len) * dist, room, dist);
    this.animT += dt;
  }

  get invincible() {
    return this.invulnT > 0 || this.glowT > 0;
  }

  // Level-up invincibility: golden glow instead of hit-flashing. Never shortens an existing glow.
  grantGlow(seconds) {
    this.glowT = Math.max(this.glowT, seconds);
  }

  // Returns true if the hit landed (false while invincible).
  takeHit(damage, fromX, fromY) {
    if (this.invincible) return false;
    this.hp = Math.max(0, this.hp - damage);
    this.invulnT = PLAYER.invincibleTime;
    const c = this.center;
    const d = dirTo(fromX, fromY, c.x, c.y);
    this.kb = { x: d.x * PLAYER.knockbackSpeed, y: d.y * PLAYER.knockbackSpeed, t: PLAYER.knockbackTime };
    this.attackT = 0;
    return true;
  }

  // Knockback with no damage or invincibility (e.g. bouncing off a shield).
  pushBack(fromX, fromY, strength = 0.7) {
    const c = this.center;
    const d = dirTo(fromX, fromY, c.x, c.y);
    const speed = PLAYER.knockbackSpeed * strength;
    this.kb = { x: d.x * speed, y: d.y * speed, t: PLAYER.knockbackTime };
    this.attackT = 0;
  }

  heal(amount) {
    const before = this.hp;
    this.hp = Math.min(this.maxHp, this.hp + amount);
    return this.hp - before;
  }

  // Face the most recently pressed direction that is still being moved in.
  updateFacing(mx, my, last) {
    const matches = { left: mx < 0, right: mx > 0, up: my < 0, down: my > 0 };
    if (last && matches[last]) this.facing = last;
    else if (mx && !my) this.facing = mx > 0 ? 'right' : 'left';
    else if (my && !mx) this.facing = my > 0 ? 'down' : 'up';
    else if (!matches[this.facing]) this.facing = mx > 0 ? 'right' : 'left';
  }

  moveBy(dx, dy, room, speed) {
    if (dx && !this.tryMove(dx, 0, room) && !dy) this.nudge('y', dx, room, speed);
    if (dy && !this.tryMove(0, dy, room) && !dx) this.nudge('x', dy, room, speed);
  }

  // Moves in small steps so the player ends flush against walls. Returns false if blocked.
  tryMove(dx, dy, room) {
    const total = Math.abs(dx || dy);
    const sx = Math.sign(dx);
    const sy = Math.sign(dy);
    let moved = 0;
    while (moved < total) {
      const step = Math.min(0.5, total - moved);
      const hb = this.hitbox;
      if (room.rectBlocked(hb.x + sx * step, hb.y + sy * step, hb.w, hb.h)) return false;
      this.x += sx * step;
      this.y += sy * step;
      moved += step;
    }
    return true;
  }

  // Corner assist: when blocked on one axis, slide along the other if a small
  // offset would let the player through (makes doorways forgiving).
  nudge(axis, d, room, speed) {
    const hb = this.hitbox;
    const ahead = Math.sign(d);
    for (let o = 1; o <= NUDGE; o++) {
      for (const s of [-1, 1]) {
        const tx = axis === 'x' ? s * o : ahead;
        const ty = axis === 'y' ? s * o : ahead;
        if (!room.rectBlocked(hb.x + tx, hb.y + ty, hb.w, hb.h)) {
          const step = s * Math.min(speed, o);
          this.tryMove(axis === 'x' ? step : 0, axis === 'y' ? step : 0, room);
          return;
        }
      }
    }
  }

  // Which room edge (if any) the player has walked past.
  exitEdge() {
    const hb = this.hitbox;
    if (hb.x < 0) return 'w';
    if (hb.x + hb.w > ROOM_W) return 'e';
    if (hb.y < 0) return 'n';
    if (hb.y + hb.h > ROOM_H) return 's';
    return null;
  }

  // Place the player just inside the opposite edge after a room change.
  enterFrom(dir) {
    if (dir === 'e') this.x = 1 - HB.x;
    if (dir === 'w') this.x = ROOM_W - 1 - HB.w - HB.x;
    if (dir === 's') this.y = 1 - HB.y;
    if (dir === 'n') this.y = ROOM_H - 1 - HB.h - HB.y;
  }

  // Reset transient combat state (used on room changes and respawn).
  clearCombatState() {
    this.attackT = 0;
    this.kb.t = 0;
  }

  draw(ctx, ox, oy) {
    // Flash while invincible.
    if (this.invulnT > 0 && Math.floor(this.invulnT * 16) % 2 === 0) return;

    const frames = getPlayerSprites(this.colors)[this.facing];
    const frame = this.moving ? 1 + (Math.floor(this.animT * WALK_FPS) % 2) : 0;
    const px = Math.round(this.x + ox);
    const py = Math.round(this.y + oy);

    if (this.glowT > 0) this.drawGlow(ctx, frame, px, py);

    if (!this.attacking) {
      ctx.drawImage(frames[frame], px, py);
      return;
    }

    // Blade drawn behind the body while it points upward, in front otherwise.
    const angle = this.swordAngle(this.swingProgress);
    const behind = Math.sin(angle) < -0.3;
    if (behind) this.drawSword(ctx, ox, oy, angle);
    ctx.drawImage(frames[frame], px, py);
    if (!behind) this.drawSword(ctx, ox, oy, angle);
  }

  // Pulsing golden outline: the hero's silhouette drawn 1px out in each direction.
  drawGlow(ctx, frame, px, py) {
    const glow = getPlayerSprites(solidColors(this.colors, '#ffe060'))[this.facing][frame];
    const pulse = 0.55 + 0.35 * Math.sin(this.glowT * 18);
    ctx.save();
    ctx.globalAlpha = pulse;
    for (const [dx, dy] of [[-1, 0], [1, 0], [0, -1], [0, 1]]) ctx.drawImage(glow, px + dx, py + dy);
    ctx.restore();
  }

  drawSword(ctx, ox, oy, angle) {
    const pv = this.pivot;
    const cx = Math.round(pv.x + ox);
    const cy = Math.round(pv.y + oy);

    // Swoosh trail: pixel dots along the arc swept so far, fading out once the sweep ends.
    const progress = this.swingProgress;
    const t = 1 - this.attackT / SWORD.swingTime;
    const fade = t < SWEEP_PORTION ? 0.55 : 0.55 * (1 - (t - SWEEP_PORTION) / (1 - SWEEP_PORTION));
    ctx.fillStyle = `rgba(255,255,255,${fade.toFixed(2)})`;
    const dots = Math.ceil(progress * 14);
    for (let i = 0; i <= dots; i++) {
      const a = this.swordAngle((progress * i) / Math.max(1, dots));
      for (const rad of [13, 16]) {
        ctx.fillRect(Math.round(cx + Math.cos(a) * rad) - 1, Math.round(cy + Math.sin(a) * rad) - 1, 2, 2);
      }
    }

    // The sword art points up (-90°), so rotate by angle + 90° around the hand.
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(angle + Math.PI / 2);
    ctx.drawImage(getSwordSprite(this.sword.id), -3, -BLADE_TIP);
    ctx.restore();
  }
}
