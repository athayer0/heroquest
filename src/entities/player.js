import { PLAYER, SWORD, DODGE, SWORDS, ARMOR, POTION, MANA, MANA_POTION, PERKS, TERRAIN } from '../config.js';
import { ROOM_W, ROOM_H, HUD_H } from '../constants.js';
import { makeSprite, solidColors } from '../gfx/sprites.js';
import { SWORD_ART } from '../gfx/art.js';
import { HERO_ART, HERO_COLORS } from '../gfx/characters.js';
import { SWORD_COLORS } from '../gfx/palette.js';
import { dirTo } from '../util.js';
import { newRunStats } from '../systems/save.js';
import { newSkills, hasPerk, heroBonus } from '../systems/skills.js';
import { newStatus, clearStatus, isFrozen, statusSpeedMult } from '../systems/status.js';
import { drawStatusFx } from '../gfx/statusFx.js';

// Collision box relative to the sprite's top-left (the lower body, Zelda-style,
// so the head can overlap walls and 1-tile gaps feel roomy).
const HB = { x: 3, y: 7, w: 10, h: 8 };
const NUDGE = 6; // max pixels of corner-assist when sliding past tile corners
const WALK_FPS = 8;
const WARD_RING = 15; // px radius of the drawn Ward shield

// Sword sweep: the blade rotates around the hero's hand through SWORD.arcDegrees,
// centered on the direction of the mouse click.
const FACING_ANGLE = { right: 0, down: Math.PI / 2, left: Math.PI, up: -Math.PI / 2 };
const FACING_VEC = { right: { x: 1, y: 0 }, down: { x: 0, y: 1 }, left: { x: -1, y: 0 }, up: { x: 0, y: -1 } };
const PIVOT = { x: 8, y: 10 }; // hand position relative to the sprite's top-left
const SWEEP_PORTION = 0.7; // fraction of the swing spent sweeping; the rest holds at the end
const BLADE_START = 6; // px from the hand where the blade starts to hurt
const BLADE_TIP = 18; // px from the hand to the drawn blade tip
const easeOut = (t) => 1 - (1 - t) * (1 - t);

// The hero's look comes from the equipped armor: peasant, leather, chainmail or plate.
// `tint` renders a single-color silhouette instead (used for the level-up glow).
const spriteCache = new Map();
export function getHeroSprites(armorId, tint = null) {
  const key = `${armorId}|${tint ?? ''}`;
  if (!spriteCache.has(key)) {
    const art = HERO_ART[armorId];
    const colors = tint ? solidColors(HERO_COLORS[armorId], tint) : HERO_COLORS[armorId];
    const build = (frames, flip = false) => frames.map((f) => makeSprite(f, colors, flip));
    spriteCache.set(key, {
      down: build(art.down),
      up: build(art.up),
      right: build(art.right),
      left: build(art.right, true),
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
    this.manaPotions = 0;
    this.maxMana = MANA.max;
    this.mana = MANA.max; // fractional while refilling; shown rounded down
    this.level = 1;
    this.xp = 0; // progress toward the next level (fractional, since skill XP counts too)
    this.skills = newSkills(); // { blade: { level, xp }, ... }
    this.perks = []; // owned perk ids
    this.perkPoints = 0;
    this.stats = newRunStats(); // play time, kills, deaths, gold collected
    this.cleared = false; // beat the game on this save file
    this.bossesDefeated = []; // boss ids, in the order beaten (mid-bosses stay beaten)
    this.openedChests = []; // chest ids
    this.visitedRooms = new Set(); // room ids, for the map
    this.lastVillage = null; // hub room of the last town entered: where you respawn

    this.swordTier = 0; // index into SWORDS
    this.armorTier = 0; // index into ARMOR
    this.knownSpells = []; // spell ids in the order learned (keys 1-4 select them)
    this.spellIndex = 0; // which known spell is equipped

    this.attackT = 0;
    this.attackCd = 0;
    this.attackAngle = 0; // center of the current swing (radians)
    this.swingDuration = SWORD.swingTime; // of the current swing (a Whirlwind spin lasts longer)
    this.swingArc = 0; // radians the current swing sweeps through
    this.spinning = false; // the current swing is a Whirlwind spin
    this.chargeT = 0; // Whirlwind: how long the mouse button has been held
    this.riposteT = 0; // Riposte: time left to start a swing after a perfect dodge
    this.riposteSwingId = -1; // the swing that gets Riposte's bonus
    this.queuedAim = null; // { x, y, t }: a click buffered during a swing or roll
    this.swingId = 0;
    this.rollT = 0;
    this.rollCd = 0;
    this.roll = { x: 0, y: 0 }; // unit direction of the current roll
    this.dodged = new Set(); // attack sources this roll has already dodged (one Evasion award each)
    this.rollChain = 0; // Double Roll: rolls made since the last cooldown
    this.rollChainT = 0; // Double Roll: time left to make the next roll in the chain
    this.regenAcc = 0; // Regeneration: fractional HP waiting to be healed
    this.secondWindUsed = false; // Second Wind: reset each time you return to the Village
    this.secondWindFired = false; // set when Second Wind saves you, for the scene to announce
    this.invulnT = 0; // after taking a hit (flashing)
    this.glowT = 0; // level-up invincibility (golden glow, no flashing)
    this.kb = { x: 0, y: 0, t: 0 };
    this.vel = { x: 0, y: 0 }; // walking velocity (px/s); only lags behind input on ice
    this.status = newStatus(); // burn, slow, freeze
    this.castCd = 0;
    this.wardT = 0; // Ward spell: time left on the shield
    this.manaRegenDelay = 0; // mana doesn't refill until this runs out
    this.manaFlashT = 0; // MP bar flashes after trying to cast without enough mana
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
    return PLAYER.defense + this.armor.defense + heroBonus.defense(this);
  }

  // Returns HP healed, or 0 if no potion was used.
  drinkPotion() {
    if (this.potions <= 0 || this.hp >= this.maxHp) return 0;
    this.potions--;
    return this.heal(Math.round(POTION.heal * heroBonus.potionHealMult(this)));
  }

  // Returns MP restored, or 0 if no mana potion was used.
  drinkManaPotion() {
    if (this.manaPotions <= 0 || this.mana >= this.maxMana) return 0;
    this.manaPotions--;
    return this.restoreMana(MANA_POTION.restore);
  }

  restoreMana(amount) {
    const before = Math.floor(this.mana);
    this.mana = Math.min(this.maxMana, this.mana + amount);
    return Math.floor(this.mana) - before;
  }

  // The equipped spell's id, or null before any spell is learned.
  get spellId() {
    return this.knownSpells[this.spellIndex] ?? null;
  }

  knowsSpell(id) {
    return this.knownSpells.includes(id);
  }

  // Learning a spell also equips it.
  learnSpell(id) {
    if (!this.knowsSpell(id)) this.knownSpells.push(id);
    this.spellIndex = this.knownSpells.indexOf(id);
  }

  selectSpell(index) {
    if (index >= 0 && index < this.knownSpells.length) this.spellIndex = index;
  }

  cycleSpell(step) {
    const n = this.knownSpells.length;
    if (n) this.spellIndex = (((this.spellIndex + step) % n) + n) % n;
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
    const t = 1 - this.attackT / this.swingDuration;
    return easeOut(Math.min(1, t / SWEEP_PORTION));
  }

  get rolling() {
    return this.rollT > 0;
  }

  swordAngle(progress) {
    const half = this.swingArc / 2;
    return this.attackAngle - half + 2 * half * progress;
  }

  // True if the arc swept so far (from the start of the swing to now) touches `rect`.
  swordHits(rect) {
    if (!this.attacking) return false;
    const pad = SWORD.hitPadding;
    const r = { x: rect.x - pad, y: rect.y - pad, w: rect.w + pad * 2, h: rect.h + pad * 2 };
    const pv = this.pivot;
    const progress = this.swingProgress;
    const steps = Math.max(1, Math.ceil((progress * this.swingArc) / 0.2)); // a sample every ~11 degrees
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
    this.rollCd = Math.max(0, this.rollCd - dt);
    this.castCd = Math.max(0, this.castCd - dt);
    this.wardT = Math.max(0, this.wardT - dt);
    this.manaFlashT = Math.max(0, this.manaFlashT - dt);
    if (this.manaRegenDelay > 0) this.manaRegenDelay -= dt;
    else this.mana = Math.min(this.maxMana, this.mana + MANA.regenPerSec * heroBonus.manaRegenMult(this) * dt);
    this.riposteT = Math.max(0, this.riposteT - dt);
    if (this.rollChainT > 0 && (this.rollChainT -= dt) <= 0) this.rollChain = 0;
    this.regenerate(dt);

    // Clicks are remembered briefly so a click just before a swing or roll ends still counts.
    if (input.clicked && input.pointer) {
      this.queuedAim = { x: input.pointer.x, y: input.pointer.y - HUD_H, t: SWORD.bufferTime };
    } else if (this.queuedAim) {
      this.queuedAim.t -= dt;
      if (this.queuedAim.t <= 0) this.queuedAim = null;
    }

    // Frozen: can't move, attack, roll or cast until it wears off.
    if (this.frozen) {
      this.attackT = 0;
      this.spinning = false;
      this.chargeT = 0;
      this.queuedAim = null;
      this.vel = { x: 0, y: 0 };
      this.moving = false;
      return;
    }

    this.updateWhirlwind(dt, input);

    if (this.kb.t > 0) {
      this.kb.t -= dt;
      this.tryMove(this.kb.x * dt, 0, room);
      this.tryMove(0, this.kb.y * dt, room);
      this.moving = false;
      return;
    }

    if (this.attackT > 0) {
      this.attackT -= dt;
      if (this.attackT <= 0) {
        this.attackCd = SWORD.cooldown;
        this.spinning = false;
      }
    }

    const mx = (input.isDown('right') ? 1 : 0) - (input.isDown('left') ? 1 : 0);
    const my = (input.isDown('down') ? 1 : 0) - (input.isDown('up') ? 1 : 0);

    if (this.rollT > 0) {
      this.rollT -= dt;
      if (this.rollT <= 0) this.endRoll();
      const dist = DODGE.speed * heroBonus.rollSpeedMult(this) * dt;
      this.moveBy(this.roll.x * dist, this.roll.y * dist, room, dist);
      return;
    }

    // Rolling cancels a swing in progress.
    if (input.wasPressed('dodge') && this.rollCd <= 0) {
      this.startRoll(mx, my, input.lastDir);
      return;
    }

    if (this.queuedAim && !this.attacking && this.attackCd <= 0) {
      this.startSwing(this.queuedAim);
      this.queuedAim = null;
    }

    this.moving = mx !== 0 || my !== 0;
    if (this.spinning) this.facing = this.facingFromAngle(this.swordAngle(this.swingProgress));
    else if (this.attacking) this.facing = this.facingFromAngle(this.attackAngle);
    else if (this.moving) this.updateFacing(mx, my, input.lastDir);

    if (this.moving) this.animT += dt;
    else this.animT = 0;
    this.walk(dt, mx, my, room);
  }

  // Quicksand halves your speed; on ice your velocity only slowly turns toward where you
  // steer, so you slide and keep momentum. A wall stops a slide on that axis.
  walk(dt, mx, my, room) {
    const c = this.center;
    const ground = room.groundAt(c.x, c.y);
    let speed = PLAYER.speed * statusSpeedMult(this);
    if (ground === 'quicksand') speed *= TERRAIN.quicksandSpeedMult;
    const len = Math.hypot(mx, my) || 1;
    const want = { x: (mx / len) * speed, y: (my / len) * speed };
    if (ground === 'ice') {
      const k = Math.min(1, TERRAIN.iceAccel * dt);
      this.vel.x += (want.x - this.vel.x) * k;
      this.vel.y += (want.y - this.vel.y) * k;
      if (Math.hypot(this.vel.x, this.vel.y) < 2 && !this.moving) this.vel = { x: 0, y: 0 };
    } else {
      this.vel = want;
    }
    if (!this.vel.x && !this.vel.y) return;
    const x0 = this.x;
    const y0 = this.y;
    const dist = Math.hypot(this.vel.x, this.vel.y) * dt;
    this.moveBy(this.vel.x * dt, this.vel.y * dt, room, dist);
    if (this.x === x0) this.vel.x = 0;
    if (this.y === y0) this.vel.y = 0;
  }

  // Swing centered on the line from the hero's hand to `target` (room pixels).
  startSwing(target) {
    const pv = this.pivot;
    const dx = target.x - pv.x;
    const dy = target.y - pv.y;
    this.attackAngle = dx || dy ? Math.atan2(dy, dx) : FACING_ANGLE[this.facing];
    this.facing = this.facingFromAngle(this.attackAngle);
    this.beginSwing(SWORD.swingTime, ((SWORD.arcDegrees + heroBonus.swordArcDegrees(this)) * Math.PI) / 180);
  }

  // Whirlwind: hold the mouse button to charge, release once charged to spin. Rolling cancels it.
  updateWhirlwind(dt, input) {
    if (!hasPerk(this, 'whirlwind')) return;
    if (input.mouseHeld && !this.rolling) {
      this.chargeT += dt;
      return;
    }
    if (!input.mouseHeld && !this.rolling && this.charged) {
      this.attackAngle = FACING_ANGLE[this.facing];
      this.beginSwing(PERKS.blade.whirlwind.spinTime, Math.PI * 2);
      this.spinning = true;
    }
    this.chargeT = 0;
  }

  get charged() {
    return hasPerk(this, 'whirlwind') && this.chargeT >= PERKS.blade.whirlwind.chargeTime;
  }

  beginSwing(duration, arc) {
    this.swingDuration = duration;
    this.swingArc = arc;
    this.attackT = duration;
    this.spinning = false;
    this.swingId++;
    // Riposte: the first swing soon after a perfect dodge hits harder.
    if (this.riposteT > 0) {
      this.riposteSwingId = this.swingId;
      this.riposteT = 0;
    }
  }

  get riposting() {
    return this.attacking && this.riposteSwingId === this.swingId;
  }

  // Called when a roll's i-frames absorb a hit.
  onPerfectDodge() {
    if (hasPerk(this, 'riposte')) this.riposteT = PERKS.evasion.riposte.time;
  }

  // The cooldown starts after the last roll in a chain (one roll, or two with Double Roll).
  endRoll() {
    this.vel = { x: this.roll.x * PLAYER.speed, y: this.roll.y * PLAYER.speed }; // keeps sliding on ice
    this.rollChain++;
    if (this.rollChain < heroBonus.rollsBeforeCooldown(this)) {
      this.rollCd = 0;
      this.rollChainT = DODGE.cooldown; // make the next roll within this time, or the chain resets
    } else {
      this.rollCd = DODGE.cooldown * heroBonus.rollCooldownMult(this);
      this.rollChain = 0;
      this.rollChainT = 0;
    }
  }

  // Regeneration perk: slowly heals while standing still.
  regenerate(dt) {
    const rate = heroBonus.regenHpPerSec(this);
    if (!rate || this.moving || this.rolling || this.hp <= 0 || this.hp >= this.maxHp) {
      this.regenAcc = 0;
      return;
    }
    this.regenAcc += rate * dt;
    if (this.regenAcc >= 1) {
      this.heal(Math.floor(this.regenAcc));
      this.regenAcc %= 1;
    }
  }

  // Roll the way the hero is moving, or the way they face when standing still.
  startRoll(mx, my, lastDir) {
    if (mx || my) {
      const len = Math.hypot(mx, my);
      this.roll = { x: mx / len, y: my / len };
      this.updateFacing(mx, my, lastDir);
    } else {
      this.roll = { ...FACING_VEC[this.facing] };
    }
    this.rollT = DODGE.time;
    this.rollChainT = 0;
    this.chargeT = 0;
    this.spinning = false;
    this.dodged.clear();
    this.attackT = 0;
    this.moving = true;
  }

  facingFromAngle(a) {
    const cos = Math.cos(a);
    const sin = Math.sin(a);
    if (Math.abs(cos) >= Math.abs(sin)) return cos > 0 ? 'right' : 'left';
    return sin > 0 ? 'down' : 'up';
  }

  get frozen() {
    return isFrozen(this);
  }

  get invincible() {
    return this.invulnT > 0 || this.glowT > 0 || this.rollT > 0;
  }

  // Level-up invincibility: golden glow instead of hit-flashing. Never shortens an existing glow.
  grantGlow(seconds) {
    this.glowT = Math.max(this.glowT, seconds);
  }

  // Returns true if the hit landed, 'dodged' if a roll's i-frames absorbed a hit that would
  // otherwise have landed (a perfect dodge), or false while otherwise invincible.
  takeHit(damage, fromX, fromY) {
    if (this.invulnT > 0 || this.glowT > 0) return false;
    if (this.rollT > 0) return 'dodged';
    this.loseHp(damage);
    this.invulnT = PLAYER.invincibleTime;
    const c = this.center;
    const d = dirTo(fromX, fromY, c.x, c.y);
    const kb = PLAYER.knockbackSpeed * heroBonus.knockbackMult(this);
    this.kb = { x: d.x * kb, y: d.y * kb, t: PLAYER.knockbackTime };
    this.attackT = 0;
    this.spinning = false;
    this.chargeT = 0;
    return true;
  }

  // Lowers HP. Second Wind: once per trip out of the Village, a lethal amount leaves you at 1 HP.
  loseHp(damage) {
    if (damage >= this.hp && this.hp > 0 && hasPerk(this, 'secondWind') && !this.secondWindUsed) {
      damage = this.hp - 1;
      this.secondWindUsed = true;
      this.secondWindFired = true;
    }
    this.hp = Math.max(0, this.hp - damage);
  }

  // Knockback with no damage or invincibility (e.g. bouncing off a shield).
  pushBack(fromX, fromY, strength = 0.7) {
    const c = this.center;
    const d = dirTo(fromX, fromY, c.x, c.y);
    const speed = PLAYER.knockbackSpeed * strength;
    this.kb = { x: d.x * speed, y: d.y * speed, t: PLAYER.knockbackTime };
    this.attackT = 0;
    this.rollT = 0;
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
    clearStatus(this);
    this.wardT = 0;
    this.vel = { x: 0, y: 0 };
    this.attackT = 0;
    this.spinning = false;
    this.chargeT = 0;
    this.riposteT = 0;
    this.rollT = 0;
    this.queuedAim = null;
    this.kb.t = 0;
  }

  draw(ctx, ox, oy) {
    // Flash while invincible.
    if (this.invulnT > 0 && Math.floor(this.invulnT * 16) % 2 === 0) return;

    const frames = getHeroSprites(this.armor.id)[this.facing];
    const frame = this.moving ? 1 + (Math.floor(this.animT * WALK_FPS) % 2) : 0;
    const px = Math.round(this.x + ox);
    const py = Math.round(this.y + oy);

    if (this.glowT > 0) this.drawGlow(ctx, frame, px, py);

    if (this.rolling) {
      this.drawRoll(ctx, frames[frame], px, py);
      return;
    }

    if (!this.attacking) {
      ctx.drawImage(frames[frame], px, py);
    } else {
      // Blade drawn behind the body while it points upward, in front otherwise.
      const angle = this.swordAngle(this.swingProgress);
      const behind = Math.sin(angle) < -0.3;
      if (behind) this.drawSword(ctx, ox, oy, angle);
      ctx.drawImage(frames[frame], px, py);
      if (!behind) this.drawSword(ctx, ox, oy, angle);
    }
    drawStatusFx(ctx, this, frames[frame], px, py);
    this.drawWard(ctx, ox, oy);
    this.drawCharge(ctx, ox, oy);
  }

  // Ward: a slowly turning ring of light around the hero, blinking as it runs out.
  drawWard(ctx, ox, oy) {
    if (this.wardT <= 0) return;
    if (this.wardT < 0.6 && Math.floor(this.wardT * 14) % 2 === 0) return;
    const c = this.center;
    const r = WARD_RING;
    const turn = this.wardT * 2;
    for (let i = 0; i < 16; i++) {
      const a = turn + (i / 16) * Math.PI * 2;
      ctx.fillStyle = i % 2 ? '#e0f4ff' : '#6ab0f0';
      ctx.fillRect(Math.round(c.x + ox + Math.cos(a) * r) - 1, Math.round(c.y + oy - 3 + Math.sin(a) * r) - 1, 2, 2);
    }
  }

  // Whirlwind charge: a ring of dots fills in around the hero, then blinks once charged.
  drawCharge(ctx, ox, oy) {
    const SHOW_AFTER = 0.15; // quick clicks don't flash the ring
    if (this.chargeT < SHOW_AFTER || !hasPerk(this, 'whirlwind')) return;
    const full = PERKS.blade.whirlwind.chargeTime;
    const fill = Math.min(1, (this.chargeT - SHOW_AFTER) / (full - SHOW_AFTER));
    const charged = this.charged;
    if (charged && Math.floor(this.chargeT * 12) % 2 === 0) return;
    const c = this.center;
    const DOTS = 12;
    ctx.fillStyle = charged ? '#ffe040' : '#f4f4f0';
    for (let i = 0; i < Math.round(DOTS * fill); i++) {
      const a = -Math.PI / 2 + (i / DOTS) * Math.PI * 2;
      ctx.fillRect(Math.round(c.x + ox + Math.cos(a) * 13) - 1, Math.round(c.y + oy - 3 + Math.sin(a) * 13) - 1, 2, 2);
    }
  }

  // Tumble: the sprite spins once around its center, trailed by two fading afterimages.
  drawRoll(ctx, img, px, py) {
    const t = 1 - this.rollT / DODGE.time;
    const spin = (this.roll.x < 0 ? -1 : 1) * t * Math.PI * 2;
    const cx = px + img.width / 2;
    const cy = py + img.height / 2;
    for (const [lag, alpha] of [[10, 0.2], [5, 0.4], [0, 1]]) {
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.translate(Math.round(cx - this.roll.x * lag), Math.round(cy - this.roll.y * lag));
      ctx.rotate(spin - (lag / 40) * Math.PI);
      ctx.drawImage(img, -img.width / 2, -img.height / 2);
      ctx.restore();
    }
  }

  // Pulsing golden outline: the hero's silhouette drawn 1px out in each direction.
  drawGlow(ctx, frame, px, py) {
    const glow = getHeroSprites(this.armor.id, '#ffe060')[this.facing][frame];
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
    const t = 1 - this.attackT / this.swingDuration;
    const fade = t < SWEEP_PORTION ? 0.55 : 0.55 * (1 - (t - SWEEP_PORTION) / (1 - SWEEP_PORTION));
    // A Riposte swing leaves a golden trail.
    const rgb = this.riposting ? '255,224,64' : '255,255,255';
    ctx.fillStyle = `rgba(${rgb},${(this.riposting ? Math.min(1, fade * 1.6) : fade).toFixed(2)})`;
    const dots = Math.ceil((progress * this.swingArc) / 0.17);
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
