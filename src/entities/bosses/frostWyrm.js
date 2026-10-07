// The Frost Wyrm, the Frozen Peaks' boss. It turns slowly toward the hero, so getting behind it
// is possible but punished:
//   walk → breathWindup (a cold mist shows the cone) → breath (chills) → stunned → walk ...
//   walk, with the hero behind it for a moment → tailWindup → sweep → recover → walk ...
// Its armored hide halves sword damage except while stunned (spells always do full damage).
// Phase 2 (below 50%) adds volleys of falling icicles, each marked by a growing shadow.
// It ignores ice entirely and, like every boss, can't be frozen.
//
// ctx (from the play scene): { player, room, hurtPlayer, slam, shake, clearProjectiles,
//                              addEffect, onBossDefeated }
import { FROST_WYRM } from '../../config.js';
import { ROOM_W, ROOM_H, TILE } from '../../constants.js';
import { Boss } from '../boss.js';
import { enemySprite } from '../enemy.js';
import { FloatText, Puff } from '../effects.js';
import { tinted } from '../../gfx/sprites.js';
import { drawStatusFx } from '../../gfx/statusFx.js';
import { FROST_WYRM as WYRM_ART } from '../../gfx/art.js';
import { applyChill } from '../../systems/status.js';
import { randRange, dirTo, clamp } from '../../util.js';

const COLORS = { k: '#0e1a2e', b: '#7ab8e8', B: '#4a80b8', l: '#e8f6ff', h: '#ffffff', e: '#ff3a5a' };
const SIZE = 32;
const HB = { x: 4, y: 4, w: 24, h: 24 };
const SNAP = Math.PI / 4; // it faces one of 8 directions (logic and drawing agree)
const CFG1 = FROST_WYRM;
const CFG2 = { ...FROST_WYRM, ...FROST_WYRM.phase2 };
const MIST = '#c8ecff';
const TEXT_COOLDOWN = 1.2; // between "ARMORED" pop-ups

const rad = (deg) => (deg * Math.PI) / 180;
// Signed difference a − b, wrapped to [−π, π].
const angleDiff = (a, b) => Math.atan2(Math.sin(a - b), Math.cos(a - b));

export class FrostWyrm extends Boss {
  static spawnAt = { x: ROOM_W / 2 - SIZE / 2, y: 2 * TILE };

  constructor(x, y) {
    super('frostWyrm', x, y, HB, FROST_WYRM, SIZE);
    this.angle = Math.PI / 2; // facing down, toward the door
    this.breathT = 0;
    this.behindT = 0;
    this.breathId = 0;
    this.chilledThisBreath = false;
    this.icicleT = 0;
    this.icicles = []; // { x, y, t } — t counts down to impact
    this.armorGlintT = 0;
    this.textT = 0;
    this.pendingText = null;
    this.enrageStarted = false;
  }

  get cfg() {
    return this.phase === 1 ? CFG1 : CFG2;
  }

  // The direction it faces, snapped to 8 directions.
  get facing() {
    return Math.round(this.angle / SNAP) * SNAP;
  }

  get protectedStates() {
    return [...super.protectedStates, 'enrage'];
  }

  get phaseMarkers() {
    return [FROST_WYRM.phase2At];
  }

  get barColor() {
    return this.phase === 2 ? '#3a7ae8' : '#6ab0f0';
  }

  get attack() {
    return FROST_WYRM.contactAttack;
  }

  // Dazed after breathing: walking into it doesn't hurt.
  get harmless() {
    return super.harmless || this.state === 'stunned';
  }

  get mouth() {
    const c = this.center;
    return { x: c.x + Math.cos(this.facing) * 14, y: c.y + Math.sin(this.facing) * 14 };
  }

  get tail() {
    const c = this.center;
    return { x: c.x - Math.cos(this.facing) * 16, y: c.y - Math.sin(this.facing) * 16 };
  }

  onIntroDone() {
    this.startWalk();
  }

  startWalk() {
    this.state = 'walk';
    this.breathT = randRange(...this.cfg.breathEvery);
    this.behindT = 0;
  }

  update(dt, ctx) {
    super.update(dt, ctx);
    this.armorGlintT = Math.max(0, this.armorGlintT - dt);
    this.textT = Math.max(0, this.textT - dt);
    // hurt() has no scene to add effects to, so it leaves text here.
    if (this.pendingText) {
      const c = this.center;
      ctx.addEffect(new FloatText(this.pendingText, c.x, this.y - 2, '#c8ecff', 0.8));
      this.pendingText = null;
    }
    this.updateIcicles(dt, ctx);
  }

  act(dt, ctx) {
    const cfg = this.cfg;
    const c = this.center;
    const p = ctx.player.center;
    const dist = Math.hypot(p.x - c.x, p.y - c.y);

    if (this.phase === 2 && this.state !== 'enrage') {
      this.icicleT -= dt;
      if (this.icicleT <= 0) {
        this.dropIcicles(p);
        this.icicleT = randRange(...cfg.icicleEvery);
      }
    }

    switch (this.state) {
      case 'walk': {
        this.turnToward(p, dt);
        if (dist > 28) {
          const d = dirTo(c.x, c.y, p.x, p.y);
          this.move(d.x * cfg.speed * dt, d.y * cfg.speed * dt, ctx.room);
        }
        // Behind it for a moment: tail sweep.
        if (this.isBehind(p)) {
          this.behindT += dt;
          if (this.behindT >= cfg.tailDelay) {
            this.state = 'tailWindup';
            this.timer = cfg.tailWindup;
            this.behindT = 0;
            break;
          }
        } else {
          this.behindT = 0;
        }
        this.breathT -= dt;
        if (this.breathT <= 0 && this.inFront(p, rad(60)) && dist <= cfg.breathRange + 24) {
          this.state = 'breathWindup';
          this.timer = cfg.breathWindup;
        }
        break;
      }

      case 'breathWindup':
        if (this.timer <= 0) {
          this.state = 'breath';
          this.timer = cfg.breathTime;
          this.breathId++;
          this.chilledThisBreath = false;
        }
        break;

      case 'breath': {
        if (this.inCone(p)) {
          const m = this.mouth;
          const hit = ctx.hurtPlayer(FROST_WYRM.attack, m.x, m.y, `wyrm breath ${this.breathId}`);
          if (hit && !this.chilledThisBreath) {
            this.chilledThisBreath = true;
            applyChill(ctx.player);
          }
        }
        if (this.timer <= 0) {
          this.state = 'stunned';
          this.timer = cfg.stunTime;
          ctx.addEffect(new FloatText('STUNNED!', c.x, this.y - 2, '#ffe040', 1));
        }
        break;
      }

      case 'stunned':
        if (this.timer <= 0) this.startWalk();
        break;

      case 'tailWindup':
        if (this.timer <= 0) {
          const t = this.tail;
          ctx.slam(t.x, t.y, cfg.tailRadius, FROST_WYRM.attack);
          ctx.shake(0.2);
          this.state = 'recover';
          this.timer = cfg.tailRecover;
        }
        break;

      case 'recover':
        if (this.timer <= 0) this.startWalk();
        break;

      case 'enrage':
        if (!this.enrageStarted) {
          this.enrageStarted = true;
          ctx.shake(FROST_WYRM.phaseChangeTime * 0.6);
          ctx.addEffect(new FloatText('THE PEAKS ANSWER ME!', c.x, this.y - 4, '#c8ecff', FROST_WYRM.phaseChangeTime));
        }
        if (this.timer <= 0) {
          this.phase = 2;
          this.startWalk();
          this.icicleT = 1.0; // show off the new attack soon
        }
        break;
    }
  }

  turnToward(p, dt) {
    const c = this.center;
    const want = Math.atan2(p.y - c.y, p.x - c.x);
    const step = this.cfg.turnSpeed * dt;
    this.angle += clamp(angleDiff(want, this.angle), -step, step);
  }

  // Angle between where it faces and the direction to `p`.
  offAxis(p, from = this.center) {
    return Math.abs(angleDiff(Math.atan2(p.y - from.y, p.x - from.x), this.facing));
  }

  inFront(p, maxAngle) {
    return this.offAxis(p) <= maxAngle;
  }

  isBehind(p) {
    const c = this.center;
    return Math.hypot(p.x - c.x, p.y - c.y) <= this.cfg.tailRange && this.offAxis(p) >= rad(120);
  }

  inCone(p) {
    const m = this.mouth;
    const dist = Math.hypot(p.x - m.x, p.y - m.y);
    if (dist < 8) return true;
    return dist <= this.cfg.breathRange && this.offAxis(p, m) <= rad(this.cfg.breathHalfAngle);
  }

  // One icicle where the hero stands, the rest nearby, all kept inside the arena.
  dropIcicles(p) {
    const cfg = this.cfg;
    for (let i = 0; i < cfg.icicles; i++) {
      const spread = i === 0 ? 0 : cfg.icicleSpread;
      const a = Math.random() * Math.PI * 2;
      this.icicles.push({
        x: clamp(p.x + Math.cos(a) * spread * Math.random(), TILE + 8, ROOM_W - TILE - 8),
        y: clamp(p.y + Math.sin(a) * spread * Math.random(), TILE + 8, ROOM_H - TILE - 8),
        t: cfg.icicleFallTime,
      });
    }
  }

  updateIcicles(dt, ctx) {
    if (this.state === 'dying') {
      this.icicles = [];
      return;
    }
    for (const ic of this.icicles) {
      ic.t -= dt;
      if (ic.t > 0) continue;
      ctx.addEffect(new Puff(ic.x, ic.y, 0.35, MIST));
      if (ctx.slam(ic.x, ic.y, this.cfg.icicleRadius, FROST_WYRM.attack)) applyChill(ctx.player);
    }
    this.icicles = this.icicles.filter((ic) => ic.t > 0);
  }

  // Armored hide: sword hits do half damage unless it's stunned.
  hurt(damage, fromX, fromY, swingId = null) {
    const armored = swingId !== null && this.state !== 'stunned';
    const dealt = armored ? Math.max(1, Math.round(damage * FROST_WYRM.armorMult)) : damage;
    const result = super.hurt(dealt, fromX, fromY, swingId);
    if (result && armored) {
      this.armorGlintT = 0.2;
      if (this.textT <= 0) {
        this.textT = TEXT_COOLDOWN;
        this.pendingText = 'ARMORED';
      }
    }
    return result;
  }

  checkPhase() {
    if (this.phase === 1 && this.hp <= this.maxHp * FROST_WYRM.phase2At) {
      this.state = 'enrage';
      this.timer = FROST_WYRM.phaseChangeTime;
    }
  }

  // Ground layer: icicle shadows and the breath cone (a faint mist during the wind-up).
  drawGround(ctx, ox, oy) {
    const cfg = this.cfg;
    for (const ic of this.icicles) {
      const progress = 1 - ic.t / cfg.icicleFallTime;
      const r = 3 + progress * (cfg.icicleRadius - 3);
      ctx.fillStyle = `rgba(20,40,80,${(0.2 + 0.4 * progress).toFixed(3)})`;
      ctx.beginPath();
      ctx.ellipse(ic.x + ox, ic.y + oy, r, r * 0.6, 0, 0, Math.PI * 2);
      ctx.fill();
    }
    if (this.state === 'breathWindup') {
      const pulse = 0.12 + 0.1 * Math.sin(this.animT * 20);
      this.drawCone(ctx, ox, oy, pulse, true);
    } else if (this.state === 'breath') {
      this.drawCone(ctx, ox, oy, 0.5, false);
    }
  }

  drawCone(ctx, ox, oy, alpha, dotted) {
    const m = this.mouth;
    const a = this.facing;
    const half = rad(this.cfg.breathHalfAngle);
    const r = this.cfg.breathRange;
    const x = m.x + ox;
    const y = m.y + oy;
    ctx.fillStyle = `rgba(200,236,255,${alpha.toFixed(3)})`;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.arc(x, y, r, a - half, a + half);
    ctx.closePath();
    ctx.fill();
    if (dotted) {
      // Dotted edges so the cone reads clearly against snow.
      ctx.fillStyle = '#5aa0e0';
      for (const edge of [a - half, a + half]) {
        for (let d = 8; d <= r; d += 6) ctx.fillRect(Math.round(x + Math.cos(edge) * d) - 1, Math.round(y + Math.sin(edge) * d) - 1, 2, 2);
      }
    } else {
      // Swirling frost inside the breath.
      ctx.fillStyle = '#ffffff';
      for (let i = 0; i < 18; i++) {
        const t = (i * 0.618 + this.animT * 1.7) % 1;
        const ang = a + (((i * 37) % 21) / 10 - 1) * half;
        ctx.fillRect(Math.round(x + Math.cos(ang) * r * t), Math.round(y + Math.sin(ang) * r * t), 2, 2);
      }
    }
  }

  draw(ctx, ox, oy) {
    if (this.state === 'dying' && Math.floor(this.timer * 14) % 2 === 0) return;
    const img = enemySprite('frostWyrm', WYRM_ART, COLORS);
    const cx = Math.round(this.x + SIZE / 2 + ox);
    const cy = Math.round(this.y + SIZE / 2 + oy);

    ctx.fillStyle = 'rgba(0,20,60,0.25)';
    ctx.beginPath();
    ctx.ellipse(cx, cy + 4, 15, 9, 0, 0, Math.PI * 2);
    ctx.fill();

    const shake = this.state === 'tailWindup' || this.state === 'enrage' ? (Math.floor(this.timer * 40) % 2 ? 1 : -1) : 0;
    ctx.save();
    ctx.translate(cx + shake, cy);
    ctx.rotate(this.facing - Math.PI / 2); // the art faces down
    const flash = this.flashT > 0 && Math.floor(this.flashT * 40) % 2 === 0;
    ctx.drawImage(flash ? img.flash : img.normal, -SIZE / 2, -SIZE / 2);
    drawStatusFx(ctx, this, img.normal, -SIZE / 2, -SIZE / 2);
    if (this.armorGlintT > 0) {
      // A cold glint off its scales: the sword barely scratched it.
      ctx.globalAlpha = 0.6;
      ctx.drawImage(tinted(img.normal, '#e8f6ff'), -SIZE / 2, -SIZE / 2);
      ctx.globalAlpha = 1;
    }
    if (this.state === 'breathWindup') {
      ctx.globalAlpha = 0.3 + 0.3 * Math.sin(this.animT * 30);
      ctx.drawImage(tinted(img.normal, MIST), -SIZE / 2, -SIZE / 2);
      ctx.globalAlpha = 1;
    }
    if (this.state === 'enrage') {
      ctx.globalAlpha = 0.3 + 0.3 * Math.sin(this.animT * 25);
      ctx.drawImage(tinted(img.normal, '#ffffff'), -SIZE / 2, -SIZE / 2);
      ctx.globalAlpha = 1;
    }
    ctx.restore();

    // Stunned: stars circling its head.
    if (this.state === 'stunned') {
      const m = this.mouth;
      ctx.fillStyle = '#ffe040';
      for (let i = 0; i < 3; i++) {
        const a = this.animT * 6 + (i / 3) * Math.PI * 2;
        ctx.fillRect(Math.round(m.x + ox + Math.cos(a) * 9) - 1, Math.round(m.y + oy - 6 + Math.sin(a) * 3) - 1, 3, 3);
      }
    }

    // Icicles falling for the last moment before impact.
    for (const ic of this.icicles) {
      if (ic.t > 0.4) continue;
      const fall = (ic.t / 0.4) * 60;
      const x = Math.round(ic.x + ox);
      const y = Math.round(ic.y + oy - fall);
      ctx.fillStyle = '#0e1a2e';
      ctx.fillRect(x - 3, y - 12, 7, 13);
      ctx.fillStyle = '#c8ecff';
      ctx.fillRect(x - 2, y - 11, 5, 8);
      ctx.fillRect(x - 1, y - 3, 3, 3);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(x - 1, y - 10, 1, 6);
    }
  }
}
