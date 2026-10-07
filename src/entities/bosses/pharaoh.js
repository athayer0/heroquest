// The Sand Pharaoh, the Desert's boss. His cycle:
//   walk → sink → under (a shadow follows the hero) → lock (the shadow stops and flashes)
//   → rise (bursts up where the shadow was) → recover → throwWindup (fan of bandages) → recover → walk ...
// He can only be hurt while above ground. Phase 2 (below 50%) raises mummies and speeds everything up.
//
// ctx (from the play scene): { player, room, spawnProjectile, spawnEnemy, countEnemies, slam, shake,
//                              clearProjectiles, addEffect, onBossDefeated }
import { PHARAOH } from '../../config.js';
import { ROOM_W, ROOM_H, TILE } from '../../constants.js';
import { Boss } from '../boss.js';
import { enemySprite } from '../enemy.js';
import { Projectile } from '../projectile.js';
import { FloatText, Puff } from '../effects.js';
import { tinted } from '../../gfx/sprites.js';
import { drawStatusFx } from '../../gfx/statusFx.js';
import { PHARAOH as PHARAOH_ART } from '../../gfx/art.js';
import { randRange, dirTo, clamp } from '../../util.js';

const COLORS = {
  k: '#1b1b23', g: '#e8b830', G: '#a87818', b: '#2a4aa8', s: '#8a5a32', e: '#60ffe0',
  w: '#ece0c4', W: '#b8a882', r: '#c83a3a',
};
const SIZE = 32;
const HB = { x: 6, y: 8, w: 20, h: 22 };
const SAND = '#e0c078';
const UNDERGROUND = ['sink', 'under', 'lock', 'rise'];

export class Pharaoh extends Boss {
  static spawnAt = { x: ROOM_W / 2 - SIZE / 2, y: 2 * TILE };

  constructor(x, y) {
    super('pharaoh', x, y, HB, PHARAOH, SIZE);
    this.target = null; // where the shadow is while he's underground (room px)
    this.next = 'throw'; // what follows the current recover
    this.enrageStarted = false;
  }

  get cfg() {
    return this.phase === 1 ? PHARAOH.phase1 : PHARAOH.phase2;
  }

  // Untouchable underground and while roaring between phases.
  get protectedStates() {
    return [...super.protectedStates, ...UNDERGROUND, 'enrage'];
  }

  get phaseMarkers() {
    return [PHARAOH.phase2At];
  }

  get barColor() {
    return this.phase === 2 ? '#e8a020' : '#d8b040';
  }

  get attack() {
    return PHARAOH.contactAttack;
  }

  onIntroDone() {
    this.startWalk();
  }

  startWalk() {
    this.state = 'walk';
    this.timer = randRange(...this.cfg.walkTime);
  }

  act(dt, ctx) {
    const cfg = this.cfg;
    const c = this.center;
    const p = ctx.player.center;

    switch (this.state) {
      case 'walk': {
        const d = dirTo(c.x, c.y, p.x, p.y);
        this.move(d.x * cfg.walkSpeed * dt, d.y * cfg.walkSpeed * dt, ctx.room);
        if (this.timer <= 0) {
          this.state = 'sink';
          this.timer = cfg.sinkTime;
          ctx.addEffect(new Puff(c.x, this.y + SIZE - 4, 0.5, SAND));
        }
        break;
      }

      case 'sink':
        if (this.timer <= 0) {
          this.state = 'under';
          this.timer = cfg.trackTime;
          this.target = this.clampTarget(c.x, c.y);
        }
        break;

      case 'under': {
        // The shadow chases the hero at a limited speed.
        const t = this.target;
        const dist = Math.hypot(p.x - t.x, p.y - t.y);
        const step = Math.min(dist, cfg.trackSpeed * dt);
        if (dist > 0) this.target = this.clampTarget(t.x + ((p.x - t.x) / dist) * step, t.y + ((p.y - t.y) / dist) * step);
        if (this.timer <= 0) {
          this.state = 'lock';
          this.timer = cfg.lockTime;
        }
        break;
      }

      case 'lock':
        if (this.timer <= 0) this.surface(ctx);
        break;

      case 'rise':
        if (this.timer <= 0) {
          this.state = 'recover';
          this.timer = cfg.riseRecover;
          this.next = 'throw';
        }
        break;

      case 'recover':
        if (this.timer > 0) break;
        if (this.next === 'throw') {
          this.state = 'throwWindup';
          this.timer = cfg.throwWindup;
        } else {
          this.startWalk();
        }
        break;

      case 'throwWindup':
        if (this.timer <= 0) {
          this.throwBandages(ctx);
          this.state = 'recover';
          this.timer = cfg.throwRecover;
          this.next = 'walk';
        }
        break;

      case 'enrage':
        if (!this.enrageStarted) {
          this.enrageStarted = true;
          ctx.clearProjectiles();
          ctx.shake(PHARAOH.phaseChangeTime * 0.6);
          ctx.addEffect(new FloatText('RISE, MY SERVANTS!', c.x, this.y - 4, '#ffd060', PHARAOH.phaseChangeTime));
          this.raiseMummies(ctx);
        }
        if (this.timer <= 0) {
          this.phase = 2;
          this.startWalk();
        }
        break;
    }
  }

  // Keeps the shadow (and so where he surfaces) inside the arena walls.
  clampTarget(x, y) {
    const mx = TILE + HB.w / 2 + 2;
    const my = TILE + HB.h / 2 + 2;
    return { x: clamp(x, mx, ROOM_W - mx), y: clamp(y, my, ROOM_H - my) };
  }

  // Bursts up where the shadow is, hurting anything close.
  surface(ctx) {
    const t = this.target;
    this.x = t.x - (HB.x + HB.w / 2);
    this.y = t.y - (HB.y + HB.h / 2);
    ctx.slam(t.x, t.y, PHARAOH.burstRadius, PHARAOH.attack);
    ctx.shake(0.25);
    for (let i = 0; i < 4; i++) ctx.addEffect(new Puff(t.x + randRange(-12, 12), t.y + randRange(-4, 10), 0.45, SAND));
    this.target = null;
    this.state = 'rise';
    this.timer = this.cfg.riseTime;
    if (this.phase === 2 && ctx.countEnemies('mummy') === 0) this.raiseMummies(ctx);
  }

  raiseMummies(ctx) {
    const c = this.center;
    const offsets = [-30, 30];
    for (let i = 0; i < PHARAOH.phase2.mummies; i++) {
      const ox = offsets[i % 2] * (1 + Math.floor(i / 2));
      const x = clamp(c.x + ox - 8, TILE, ROOM_W - 2 * TILE);
      const y = clamp(c.y - 8, TILE, ROOM_H - 2 * TILE);
      ctx.spawnEnemy('mummy', x, y);
    }
  }

  throwBandages(ctx) {
    const cfg = this.cfg;
    const c = this.center;
    const p = ctx.player.center;
    const base = Math.atan2(p.y - c.y, p.x - c.x);
    const spread = (cfg.spreadDegrees * Math.PI) / 180;
    for (let i = 0; i < cfg.bandages; i++) {
      const a = base + (i - (cfg.bandages - 1) / 2) * spread;
      ctx.spawnProjectile(new Projectile({
        x: c.x, y: c.y,
        vx: Math.cos(a) * cfg.bandageSpeed,
        vy: Math.sin(a) * cfg.bandageSpeed,
        attack: PHARAOH.attack, kind: 'bandage', size: 6, life: 6,
      }));
    }
  }

  checkPhase() {
    if (this.phase === 1 && this.hp <= this.maxHp * PHARAOH.phase2At) {
      this.state = 'enrage';
      this.timer = PHARAOH.phaseChangeTime;
      this.target = null;
    }
  }

  // Ground layer: the shadow that grows while he's underground, flashing once it stops.
  drawGround(ctx, ox, oy) {
    if (!this.target || (this.state !== 'under' && this.state !== 'lock')) return;
    const cfg = this.cfg;
    const total = cfg.trackTime + cfg.lockTime;
    const elapsed = this.state === 'under' ? cfg.trackTime - this.timer : cfg.trackTime + cfg.lockTime - this.timer;
    const progress = clamp(elapsed / total, 0, 1);
    const r = 5 + progress * (PHARAOH.burstRadius - 5);
    const x = this.target.x + ox;
    const y = this.target.y + oy;
    ctx.fillStyle = `rgba(50,30,10,${(0.25 + 0.4 * progress).toFixed(3)})`;
    ctx.beginPath();
    ctx.ellipse(x, y, r, r * 0.65, 0, 0, Math.PI * 2);
    ctx.fill();
    // Churning sand around the edge.
    ctx.fillStyle = '#f0d8a0';
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2 + this.animT * 3;
      ctx.fillRect(Math.round(x + Math.cos(a) * (r + 2)), Math.round(y + Math.sin(a) * (r + 2) * 0.65), 1, 1);
    }
    if (this.state === 'lock') {
      // Locked in: a blinking ring, faster as he's about to burst out.
      const blink = Math.floor(this.timer * 16) % 2 === 0;
      ctx.fillStyle = blink ? '#ff6020' : '#ffe060';
      for (let i = 0; i < 20; i++) {
        const a = (i / 20) * Math.PI * 2;
        ctx.fillRect(Math.round(x + Math.cos(a) * r) - 1, Math.round(y + Math.sin(a) * r * 0.65) - 1, 2, 2);
      }
    }
  }

  draw(ctx, ox, oy) {
    if (this.state === 'under' || this.state === 'lock') return;
    if (this.state === 'dying' && Math.floor(this.timer * 14) % 2 === 0) return;

    const img = enemySprite('pharaoh', PHARAOH_ART, COLORS);
    const bob = this.state === 'walk' ? Math.round(Math.sin(this.animT * 4)) : 0;
    const shake = this.state === 'enrage' ? (Math.floor(this.timer * 40) % 2 ? 1 : -1) : 0;
    const x = Math.round(this.x + shake + ox);
    const y = Math.round(this.y + bob + oy);
    const groundY = Math.round(this.y + SIZE + oy);

    // Sinking or rising: only the part above the sand line shows.
    let hidden = 0;
    if (this.state === 'sink') hidden = SIZE * (1 - Math.max(0, this.timer) / this.cfg.sinkTime);
    if (this.state === 'rise') hidden = SIZE * (Math.max(0, this.timer) / this.cfg.riseTime);
    if (hidden > 0) {
      ctx.save();
      ctx.beginPath();
      ctx.rect(x - 2, y - 8, SIZE + 4, groundY - (y - 8));
      ctx.clip();
      ctx.drawImage(img.normal, x, Math.round(y + hidden));
      ctx.restore();
      ctx.fillStyle = SAND;
      for (let i = 0; i < 6; i++) ctx.fillRect(x + 4 + i * 5, groundY - 1 - ((i + Math.floor(this.animT * 10)) % 2), 3, 1);
      return;
    }

    ctx.fillStyle = 'rgba(0,0,0,0.3)';
    ctx.fillRect(Math.round(this.x + 7 + ox), Math.round(this.y + 29 + oy), 18, 3);

    // Gold glow while winding up a throw.
    if (this.state === 'throwWindup') {
      ctx.save();
      ctx.globalAlpha = 0.35 + 0.3 * Math.sin(this.animT * 30);
      ctx.drawImage(tinted(img.normal, '#ffe060'), x - 1, y);
      ctx.drawImage(tinted(img.normal, '#ffe060'), x + 1, y);
      ctx.restore();
    }
    ctx.drawImage(this.flashT > 0 && Math.floor(this.flashT * 40) % 2 === 0 ? img.flash : img.normal, x, y);
    drawStatusFx(ctx, this, img.normal, x, y);
    if (this.state === 'enrage') {
      ctx.save();
      ctx.globalAlpha = 0.3 + 0.3 * Math.sin(this.animT * 25);
      ctx.drawImage(tinted(img.normal, '#ff4020'), x, y);
      ctx.restore();
    }
  }
}
