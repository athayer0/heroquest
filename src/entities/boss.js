// The Dark Lord. A state machine where every attack has a visible wind-up and
// a recovery window afterwards:
//   intro → walk → volleyWindup → recover → walk ...
//   (phase 2 adds) walk → slamWindup → recover → walk ...
//   enrage between phases (invulnerable), dying at 0 HP.
//
// ctx (from the play scene): { player, room, spawnProjectile, slam, shake, clearProjectiles,
//                              addEffect, onBossDefeated }
import { BOSS, ENEMY_HIT } from '../config.js';
import { Enemy, enemySprite } from './enemy.js';
import { Projectile } from './projectile.js';
import { Puff, FloatText } from './effects.js';
import { makeSprite, solidColors } from '../gfx/sprites.js';
import { DARK_LORD } from '../gfx/art.js';
import { randRange, dirTo } from '../util.js';

const COLORS = {
  k: '#120a18', a: '#2a2238', A: '#4a3a60', l: '#7a6a98', g: '#e0b040',
  c: '#7a1a3a', C: '#4a0a24', h: '#e8e0d0', H: '#9a9080', e: '#ff3a3a', E: '#ffb0a0',
};
const SIZE = 32;

let redSprite = null;
function getRedSprite() {
  return (redSprite ??= makeSprite(DARK_LORD, solidColors(COLORS, '#ff3030')));
}

export class DarkLord extends Enemy {
  constructor(x, y) {
    super('darkLord', x, y, { x: 6, y: 8, w: 20, h: 22 }, BOSS);
    this.isBoss = true;
    this.maxHp = BOSS.hp;
    this.spawnT = 0; // the intro state handles its entrance
    this.phase = 1;
    this.state = 'intro';
    this.timer = BOSS.introTime;
    this.volleyT = 1.5;
    this.slamT = 0;
    this.slamTarget = null;
    this.animT = 0;
    this.puffT = 0;
    this.enrageStarted = false;
  }

  get cfg() {
    return this.phase === 1 ? BOSS.phase1 : BOSS.phase2;
  }

  // Can hurt and be hurt only while actually fighting.
  get active() {
    return !this.dead && !['intro', 'enrage', 'dying'].includes(this.state);
  }

  get attack() {
    return BOSS.contactAttack;
  }

  update(dt, ctx) {
    this.animT += dt;
    this.flashT = Math.max(0, this.flashT - dt);
    this.hitCooldownT = Math.max(0, (this.hitCooldownT ?? 0) - dt);
    this.timer -= dt;
    const { player, room } = ctx;
    const c = this.center;
    const p = player.center;

    switch (this.state) {
      case 'intro':
        if (this.timer <= 0) this.state = 'walk';
        break;

      case 'walk': {
        const d = dirTo(c.x, c.y, p.x, p.y);
        this.move(d.x * this.cfg.speed * dt, d.y * this.cfg.speed * dt, room);
        this.volleyT -= dt;
        if (this.phase === 2) this.slamT -= dt;
        if (this.phase === 2 && this.slamT <= 0) {
          this.state = 'slamWindup';
          this.timer = this.cfg.slamWarning;
          this.slamTarget = { x: p.x, y: p.y }; // locked in: step out of the circle
        } else if (this.volleyT <= 0) {
          this.state = 'volleyWindup';
          this.timer = this.cfg.windup;
        }
        break;
      }

      case 'volleyWindup':
        if (this.timer <= 0) {
          this.fireVolley(ctx);
          this.recover(this.cfg.recover);
          this.volleyT = randRange(...this.cfg.volleyInterval);
        }
        break;

      case 'slamWindup':
        if (this.timer <= 0) {
          ctx.slam(this.slamTarget.x, this.slamTarget.y, this.cfg.slamRadius, BOSS.attack);
          ctx.shake(0.35);
          this.slamTarget = null;
          this.recover(this.cfg.slamRecover);
          this.slamT = randRange(...this.cfg.slamInterval);
          this.volleyT = Math.max(this.volleyT, 1);
        }
        break;

      case 'recover':
        if (this.timer <= 0) this.state = 'walk';
        break;

      case 'enrage':
        if (!this.enrageStarted) {
          this.enrageStarted = true;
          ctx.clearProjectiles();
          ctx.shake(BOSS.phaseChangeTime * 0.6);
          ctx.addEffect(new FloatText('ENOUGH!', c.x, this.y - 4, '#ff6060', BOSS.phaseChangeTime));
        }
        if (this.timer <= 0) {
          this.phase = 2;
          this.state = 'walk';
          this.volleyT = 2.0;
          this.slamT = 0.8; // show off the new attack right away
        }
        break;

      case 'dying':
        if (!this.dyingStarted) {
          this.dyingStarted = true;
          ctx.clearProjectiles(); // nothing can hurt the hero once he's beaten
        }
        this.puffT -= dt;
        if (this.puffT <= 0) {
          this.puffT = 0.12;
          ctx.addEffect(new Puff(this.x + randRange(4, SIZE - 4), this.y + randRange(4, SIZE - 4), 0.4, '#ffb0e0'));
        }
        if (this.timer <= 0) {
          this.dead = true;
          ctx.onBossDefeated(this);
        }
        break;
    }
  }

  recover(seconds) {
    this.state = 'recover';
    this.timer = seconds;
  }

  fireVolley(ctx) {
    const c = this.center;
    const p = ctx.player.center;
    const base = Math.atan2(p.y - c.y, p.x - c.x);
    const spread = (this.cfg.spreadDegrees * Math.PI) / 180;
    for (const offset of [-spread, 0, spread]) {
      const a = base + offset;
      ctx.spawnProjectile(new Projectile({
        x: c.x, y: c.y + 2,
        vx: Math.cos(a) * this.cfg.projectileSpeed,
        vy: Math.sin(a) * this.cfg.projectileSpeed,
        attack: BOSS.attack, kind: 'orb', size: 8, life: 8,
      }));
    }
  }

  // No knockback (he's huge). Crossing 50% HP triggers the phase change.
  hurt(damage, fromX, fromY, swingId) {
    if (!this.active || swingId === this.lastSwingId || this.hitCooldownT > 0) return false;
    this.lastSwingId = swingId;
    this.hitCooldownT = BOSS.hitCooldown;
    this.hp = Math.max(0, this.hp - damage);
    this.flashT = ENEMY_HIT.flashTime;
    if (this.hp <= 0) {
      this.state = 'dying';
      this.timer = BOSS.deathTime;
      this.slamTarget = null;
    } else if (this.phase === 1 && this.hp <= this.maxHp * BOSS.phase2At) {
      this.state = 'enrage';
      this.timer = BOSS.phaseChangeTime;
      this.slamTarget = null;
    }
    return true;
  }

  // Ground layer: the slam warning circle. The fill grows until impact.
  drawGround(ctx, ox, oy) {
    if (this.state !== 'slamWindup' || !this.slamTarget) return;
    const r = this.cfg.slamRadius;
    const progress = 1 - Math.max(0, this.timer) / this.cfg.slamWarning;
    const x = this.slamTarget.x + ox;
    const y = this.slamTarget.y + oy;
    ctx.fillStyle = `rgba(255,40,40,${(0.12 + 0.25 * progress).toFixed(3)})`;
    ctx.beginPath();
    ctx.arc(x, y, r * progress, 0, Math.PI * 2);
    ctx.fill();
    // Dotted outline, blinking faster as impact nears.
    const blink = Math.floor(this.timer * (6 + progress * 14)) % 2 === 0;
    ctx.fillStyle = blink ? '#ff4040' : '#ffc0c0';
    for (let i = 0; i < 28; i++) {
      const a = (i / 28) * Math.PI * 2;
      ctx.fillRect(Math.round(x + Math.cos(a) * r) - 1, Math.round(y + Math.sin(a) * r) - 1, 2, 2);
    }
  }

  draw(ctx, ox, oy) {
    if (this.state === 'dying' && Math.floor(this.timer * 14) % 2 === 0) return;

    const img = enemySprite('darkLord', DARK_LORD, COLORS);
    let dx = 0;
    let dy = Math.round(Math.sin(this.animT * 3) * 1); // hovering menace
    if (this.state === 'slamWindup') {
      dy = -3 + (Math.floor(this.timer * 30) % 2); // rears up and trembles
    } else if (this.state === 'enrage') {
      dx = Math.floor(this.timer * 40) % 2 ? 1 : -1;
    }
    const x = Math.round(this.x + dx + ox);
    const y = Math.round(this.y + dy + oy);

    // Shadow
    ctx.fillStyle = 'rgba(0,0,0,0.3)';
    ctx.fillRect(Math.round(this.x + 7 + ox), Math.round(this.y + 29 + oy), 18, 3);

    // Charging aura before a volley
    if (this.state === 'volleyWindup') {
      const p = 1 - Math.max(0, this.timer) / this.cfg.windup;
      ctx.save();
      ctx.globalAlpha = 0.35 + 0.3 * Math.sin(this.animT * 30);
      ctx.drawImage(getRedSprite(), x - 1, y);
      ctx.drawImage(getRedSprite(), x + 1, y);
      ctx.restore();
      ctx.drawImage(this.flashT > 0 ? img.flash : img.normal, x, y);
      // Orb growing between his hands
      const r = 1 + p * 4;
      ctx.fillStyle = '#d050f0';
      ctx.beginPath();
      ctx.arc(x + 16, y + 24, r + 1, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(x + 16, y + 24, r * 0.5, 0, Math.PI * 2);
      ctx.fill();
      return;
    }

    ctx.drawImage(this.flashT > 0 && Math.floor(this.flashT * 40) % 2 === 0 ? img.flash : img.normal, x, y);

    if (this.state === 'enrage') {
      ctx.save();
      ctx.globalAlpha = 0.3 + 0.3 * Math.sin(this.animT * 25);
      ctx.drawImage(getRedSprite(), x, y);
      ctx.restore();
    }
  }
}
