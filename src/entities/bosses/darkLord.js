// The Dark Lord. A state machine where every attack has a visible wind-up and
// a recovery window afterwards:
//   phase 1: intro → walk → volleyWindup → recover → walk ...
//   phase 2 adds: walk → slamWindup → recover → walk ...
//   phase 3: vanish (smoke where he'll appear) → orbWindup → homing orbs → recover
//            → volleyWindup → recover → vanish ...   (and the statues wake as gargoyles)
//   enrage between phases (invulnerable), dying at 0 HP (handled by Boss).
//
// ctx (from the play scene): { player, room, spawnProjectile, slam, shake, clearProjectiles,
//                              addEffect, awakenStatues, onBossDefeated }
import { BOSS } from '../../config.js';
import { ROOM_W, ROOM_H, TILE } from '../../constants.js';
import { Boss } from '../boss.js';
import { enemySprite } from '../enemy.js';
import { Projectile } from '../projectile.js';
import { FloatText, Puff } from '../effects.js';
import { makeSprite, solidColors } from '../../gfx/sprites.js';
import { drawStatusFx } from '../../gfx/statusFx.js';
import { DARK_LORD } from '../../gfx/art.js';
import { randRange, dirTo } from '../../util.js';

const COLORS = {
  k: '#120a18', a: '#2a2238', A: '#4a3a60', l: '#7a6a98', g: '#e0b040',
  c: '#7a1a3a', C: '#4a0a24', h: '#e8e0d0', H: '#9a9080', e: '#ff3a3a', E: '#ffb0a0',
};
const SIZE = 32;
const SMOKE = '#3a1a4a';
// Where he can teleport in phase 3 (sprite top-left), clear of pillars, braziers and statues.
const CORNERS = [
  { x: 2 * TILE, y: TILE },
  { x: ROOM_W - 4 * TILE, y: TILE },
  { x: 2 * TILE, y: ROOM_H - 4.5 * TILE },
  { x: ROOM_W - 4 * TILE, y: ROOM_H - 4.5 * TILE },
];

let redSprite = null;
function getRedSprite() {
  return (redSprite ??= makeSprite(DARK_LORD, solidColors(COLORS, '#ff3030')));
}

export class DarkLord extends Boss {
  // Spawns at the top of the throne room.
  static spawnAt = { x: ROOM_W / 2 - SIZE / 2, y: 2 * TILE };

  constructor(x, y) {
    super('darkLord', x, y, { x: 6, y: 8, w: 20, h: 22 }, BOSS, SIZE);
    this.volleyT = 1.5;
    this.slamT = 0;
    this.slamTarget = null;
    this.enrageStarted = false;
    this.dest = null; // phase 3: where he'll reappear
    this.next = 'walk'; // what follows the current recover
  }

  get cfg() {
    return BOSS[`phase${this.phase}`];
  }

  // Also untouchable while roaring between phases, and while vanished.
  get protectedStates() {
    return [...super.protectedStates, 'enrage', 'vanish'];
  }

  get phaseMarkers() {
    return [BOSS.phase2At, BOSS.phase3At];
  }

  get barColor() {
    return ['#b03ad8', '#e83a3a', '#ff7a20'][this.phase - 1];
  }

  get attack() {
    return BOSS.contactAttack;
  }

  act(dt, ctx) {
    const { player, room } = ctx;
    const c = this.center;
    const p = player.center;

    switch (this.state) {
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
          this.recover(this.cfg.recover, this.phase === 3 ? 'vanish' : 'walk');
          if (this.phase < 3) this.volleyT = randRange(...this.cfg.volleyInterval);
        }
        break;

      case 'vanish':
        if (this.timer <= 0) {
          this.x = this.dest.x;
          this.y = this.dest.y;
          this.dest = null;
          ctx.addEffect(new Puff(this.center.x, this.center.y, 0.5, SMOKE));
          this.state = 'orbWindup';
          this.timer = this.cfg.windup;
        }
        break;

      case 'orbWindup':
        if (this.timer <= 0) {
          this.fireHoming(ctx);
          this.recover(this.cfg.recover, 'volley');
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
        if (this.timer > 0) break;
        if (this.next === 'vanish') this.startVanish(ctx);
        else if (this.next === 'volley') {
          this.state = 'volleyWindup';
          this.timer = this.cfg.windup;
        } else this.state = 'walk';
        break;

      case 'enrage':
        if (!this.enrageStarted) {
          this.enrageStarted = true;
          ctx.clearProjectiles();
          ctx.shake(BOSS.phaseChangeTime * 0.6);
          const toThree = this.phase === 2;
          ctx.addEffect(new FloatText(toThree ? 'RISE, MY SENTINELS!' : 'ENOUGH!', c.x, this.y - 4, '#ff6060', BOSS.phaseChangeTime));
          if (toThree) ctx.awakenStatues();
        }
        if (this.timer <= 0) {
          this.phase++;
          if (this.phase === 2) {
            this.state = 'walk';
            this.volleyT = 2.0;
            this.slamT = 0.8; // show off the new attack right away
          } else {
            this.startVanish(ctx);
          }
        }
        break;

    }
  }

  recover(seconds, next = 'walk') {
    this.state = 'recover';
    this.timer = seconds;
    this.next = next;
  }

  // Phase 3: fade out, with dark smoke gathering at a different corner where he'll reappear.
  startVanish(ctx) {
    const here = { x: this.x, y: this.y };
    const options = CORNERS.filter((k) => Math.hypot(k.x - here.x, k.y - here.y) > TILE);
    this.dest = options[Math.floor(Math.random() * options.length)];
    this.state = 'vanish';
    this.timer = BOSS.phase3.teleportTime;
    ctx.addEffect(new Puff(this.center.x, this.center.y, 0.5, SMOKE));
  }

  // Phase 3: orbs that curve after the hero. Sword, spells and Ward destroy them.
  fireHoming(ctx) {
    const cfg = BOSS.phase3;
    const c = this.center;
    const p = ctx.player.center;
    const base = Math.atan2(p.y - c.y, p.x - c.x);
    for (let i = 0; i < cfg.homingOrbs; i++) {
      const a = base + (i - (cfg.homingOrbs - 1) / 2) * 0.6;
      ctx.spawnProjectile(new Projectile({
        x: c.x, y: c.y + 2,
        vx: Math.cos(a) * cfg.homingSpeed,
        vy: Math.sin(a) * cfg.homingSpeed,
        attack: BOSS.attack, kind: 'homingOrb', size: 8, life: cfg.homingLife,
        homing: { target: ctx.player, turnRate: cfg.homingTurnRate }, shootable: true,
      }));
    }
  }

  fireVolley(ctx) {
    const c = this.center;
    const p = ctx.player.center;
    const base = Math.atan2(p.y - c.y, p.x - c.x);
    const spread = (this.cfg.spreadDegrees * Math.PI) / 180;
    const n = this.cfg.shots;
    for (let i = 0; i < n; i++) {
      const a = base + (i - (n - 1) / 2) * spread;
      ctx.spawnProjectile(new Projectile({
        x: c.x, y: c.y + 2,
        vx: Math.cos(a) * this.cfg.projectileSpeed,
        vy: Math.sin(a) * this.cfg.projectileSpeed,
        attack: BOSS.attack, kind: 'orb', size: 8, life: 8,
      }));
    }
  }

  // Crossing 66% and 33% HP triggers the phase changes.
  checkPhase() {
    const next = this.phase === 1 ? BOSS.phase2At : this.phase === 2 ? BOSS.phase3At : 0;
    if (this.hp <= this.maxHp * next) {
      this.state = 'enrage';
      this.enrageStarted = false;
      this.timer = BOSS.phaseChangeTime;
      this.slamTarget = null;
      this.dest = null;
    }
  }

  onDying() {
    this.slamTarget = null;
    this.dest = null;
  }

  // Ground layer: dark smoke where he'll reappear, and the slam warning circle.
  drawGround(ctx, ox, oy) {
    if (this.state === 'vanish' && this.dest) {
      const progress = 1 - Math.max(0, this.timer) / BOSS.phase3.teleportTime;
      const x = this.dest.x + SIZE / 2 + ox;
      const y = this.dest.y + SIZE - 6 + oy;
      for (let i = 0; i < 6; i++) {
        const a = this.animT * 4 + (i / 6) * Math.PI * 2;
        const r = 4 + progress * 10;
        ctx.fillStyle = `rgba(40,10,60,${(0.25 + 0.4 * progress).toFixed(3)})`;
        ctx.beginPath();
        ctx.arc(x + Math.cos(a) * r, y + Math.sin(a) * r * 0.5 - progress * 6, 3 + progress * 4, 0, Math.PI * 2);
        ctx.fill();
      }
      return;
    }
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
    if (this.state === 'vanish') {
      // Fading away where he stands.
      ctx.save();
      ctx.globalAlpha = Math.max(0, this.timer / BOSS.phase3.teleportTime);
      this.drawBody(ctx, ox, oy);
      ctx.restore();
      return;
    }
    this.drawBody(ctx, ox, oy);
  }

  drawBody(ctx, ox, oy) {

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

    // Charging aura before a volley (a red orb for homing orbs)
    if (this.state === 'volleyWindup' || this.state === 'orbWindup') {
      const p = 1 - Math.max(0, this.timer) / this.cfg.windup;
      ctx.save();
      ctx.globalAlpha = 0.35 + 0.3 * Math.sin(this.animT * 30);
      ctx.drawImage(getRedSprite(), x - 1, y);
      ctx.drawImage(getRedSprite(), x + 1, y);
      ctx.restore();
      ctx.drawImage(this.flashT > 0 ? img.flash : img.normal, x, y);
      drawStatusFx(ctx, this, img.normal, x, y);
      // Orb growing between his hands
      const r = 1 + p * 4;
      ctx.fillStyle = this.state === 'orbWindup' ? '#ff4a4a' : '#d050f0';
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
    drawStatusFx(ctx, this, img.normal, x, y);

    if (this.state === 'enrage') {
      ctx.save();
      ctx.globalAlpha = 0.3 + 0.3 * Math.sin(this.animT * 25);
      ctx.drawImage(getRedSprite(), x, y);
      ctx.restore();
    }
  }
}
