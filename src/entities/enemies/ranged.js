// Ranged enemies (skeletons, spirits). They keep their distance and only shoot with a clear line:
// before winding up they check that nothing solid (or another enemy) is between them and the hero,
// and if something is, they move to a spot with a clear shot. They lead their shots toward where
// the hero is heading, and spread out from each other.
//   walk ⇄ reposition → windup → (shoot) → walk
// Getting hit or frozen interrupts a wind-up. Subclasses implement shoot(ctx, aim), sprite(), and
// may override `muzzle` (where shots come from).
import { Enemy } from '../enemy.js';
import { randRange, dirTo } from '../../util.js';

const SAMPLE_STEP = 2; // px between line-of-sight samples
const SHOT_BOX = 8; // px: a little bigger than a shot (6px), so lines that graze a corner count as blocked
const SPOT_DIRS = 12;
const SPOT_RADII = [20, 36, 52];

// True if a shot from `from` to `to` wouldn't hit a wall (shots fly over water and lava) or
// another enemy first. `self` is ignored.
export function clearShot(room, from, to, enemies, self) {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const dist = Math.hypot(dx, dy);
  const h = SHOT_BOX / 2;
  for (let d = SAMPLE_STEP; d < dist - 8; d += SAMPLE_STEP) {
    const x = from.x + (dx * d) / dist;
    const y = from.y + (dy * d) / dist;
    if (room.rectBlocked(x - h, y - h, SHOT_BOX, SHOT_BOX, true, true)) return false;
    for (const e of enemies) {
      if (e === self || !e.active) continue;
      const r = e.hitbox;
      if (x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h) return false;
    }
  }
  return true;
}

// Where to aim: part of the way toward where the hero will be when the shot arrives.
export function leadTarget(from, player, shotSpeed, leadFactor) {
  const p = player.center;
  if (player.rolling || !leadFactor) return p;
  const t = Math.hypot(p.x - from.x, p.y - from.y) / shotSpeed;
  return { x: p.x + player.vel.x * t * leadFactor, y: p.y + player.vel.y * t * leadFactor };
}

export class RangedEnemy extends Enemy {
  constructor(type, x, y, hitbox) {
    super(type, x, y, hitbox);
    this.state = 'walk';
    this.timer = 0;
    this.shotT = randRange(...this.stats.shotInterval);
    this.strafeDir = Math.random() < 0.5 ? -1 : 1;
    this.strafeT = randRange(1, 2);
    this.spot = null; // reposition target (hitbox-center px)
    this.animT = Math.random();
  }

  // Where shots start (room px).
  get muzzle() {
    return this.center;
  }

  // Muzzle position if this enemy stood with its hitbox centered at (cx, cy).
  muzzleAt(cx, cy) {
    const c = this.center;
    const m = this.muzzle;
    return { x: m.x - c.x + cx, y: m.y - c.y + cy };
  }

  hasShot(ctx, target = ctx.player.center) {
    return clearShot(ctx.room, this.muzzle, target, ctx.enemies, this);
  }

  think(dt, ctx) {
    this.animT += dt;
    if (this.state === 'windup') this.updateWindup(dt, ctx);
    else if (this.state === 'reposition') this.updateReposition(dt, ctx);
    else this.updateWalk(dt, ctx);
  }

  startWindup() {
    this.state = 'windup';
    this.timer = this.stats.windupTime;
  }

  startReposition() {
    this.state = 'reposition';
    this.timer = this.stats.repositionTime;
    this.spot = null;
  }

  // Shoot when the time comes, but only with a clear line; otherwise go find one.
  updateWalk(dt, ctx) {
    this.shotT -= dt;
    if (this.shotT <= 0) {
      if (this.hasShot(ctx)) this.startWindup();
      else this.startReposition();
      return;
    }
    this.keepDistance(dt, ctx);
  }

  // Re-checks at release: aims ahead of the hero if that line is clear, else straight at them,
  // else gives up the shot and repositions (so shots never go into walls).
  updateWindup(dt, ctx) {
    this.timer -= dt;
    if (this.timer > 0) return;
    const s = this.stats;
    const lead = leadTarget(this.muzzle, ctx.player, s.shotSpeed, s.leadFactor);
    const aim = this.hasShot(ctx, lead) ? lead : this.hasShot(ctx) ? ctx.player.center : null;
    if (!aim) {
      this.startReposition();
      return;
    }
    this.shoot(ctx, aim);
    this.state = 'walk';
    this.shotT = randRange(...s.shotInterval);
  }

  updateReposition(dt, ctx) {
    this.timer -= dt;
    if (this.hasShot(ctx)) {
      this.startWindup();
      return;
    }
    const c = this.center;
    if (!this.spot || Math.hypot(this.spot.x - c.x, this.spot.y - c.y) < 3) this.spot = this.findShotSpot(ctx);
    if (this.spot) {
      const d = dirTo(c.x, c.y, this.spot.x, this.spot.y);
      const sep = this.separation(ctx);
      const blocked = this.move((d.x + sep.x) * this.stats.speed * 1.3 * dt, (d.y + sep.y) * this.stats.speed * 1.3 * dt, ctx.room);
      if (blocked.x && blocked.y) this.spot = null;
    } else {
      this.keepDistance(dt, ctx); // nowhere better nearby: circle and try again
    }
    if (this.timer <= 0) {
      this.state = 'walk';
      this.shotT = randRange(0.3, 0.6);
    }
  }

  // The nearest reachable spot (within a few steps) with a clear shot at a comfortable range.
  findShotSpot(ctx) {
    const { room, player, enemies } = ctx;
    const c = this.center;
    const p = player.center;
    const [near, far] = this.stats.keepDistance;
    const hb = this.hb;
    let best = null;
    let bestScore = Infinity;
    for (const r of SPOT_RADII) {
      for (let i = 0; i < SPOT_DIRS; i++) {
        const a = (i / SPOT_DIRS) * Math.PI * 2;
        const x = c.x + Math.cos(a) * r;
        const y = c.y + Math.sin(a) * r;
        if (room.rectBlocked(x - hb.w / 2, y - hb.h / 2, hb.w, hb.h, true, this.flying)) continue;
        if (!clearShot(room, c, { x, y }, [], this)) continue; // can walk there in a straight line
        const dist = Math.hypot(p.x - x, p.y - y);
        if (dist < near * 0.8 || dist > far * 1.2) continue;
        if (!clearShot(room, this.muzzleAt(x, y), p, enemies, this)) continue;
        const score = r + Math.abs(dist - (near + far) / 2) * 0.3;
        if (score < bestScore) {
          bestScore = score;
          best = { x, y };
        }
      }
    }
    return best;
  }

  // Push away from other ranged enemies that are too close.
  separation(ctx) {
    const c = this.center;
    const out = { x: 0, y: 0 };
    for (const e of ctx.enemies) {
      if (e === this || !(e instanceof RangedEnemy) || !e.active) continue;
      const o = e.center;
      const d = Math.hypot(c.x - o.x, c.y - o.y);
      if (d > 0 && d < this.stats.spacing) {
        const push = 2 * (1 - d / this.stats.spacing); // strong enough to beat strafing toward each other
        out.x += ((c.x - o.x) / d) * push;
        out.y += ((c.y - o.y) / d) * push;
      }
    }
    return out;
  }

  // Back off when crowded, approach when far, otherwise circle the hero; spread out from allies.
  keepDistance(dt, ctx) {
    const s = this.stats;
    const c = this.center;
    const p = ctx.player.center;
    const d = dirTo(c.x, c.y, p.x, p.y);
    const dist = Math.hypot(p.x - c.x, p.y - c.y);
    const [near, far] = s.keepDistance;
    let mx;
    let my;
    if (dist < near) {
      mx = -d.x;
      my = -d.y;
    } else if (dist > far) {
      mx = d.x;
      my = d.y;
    } else {
      mx = -d.y * this.strafeDir;
      my = d.x * this.strafeDir;
      this.strafeT -= dt;
      if (this.strafeT <= 0) {
        this.strafeDir *= -1;
        this.strafeT = randRange(1, 2);
      }
    }
    const sep = this.separation(ctx);
    const blocked = this.move((mx + sep.x) * s.speed * dt, (my + sep.y) * s.speed * dt, ctx.room);
    if (blocked.x || blocked.y) this.strafeDir *= -1;
  }

  // Getting hit (or frozen) interrupts a wind-up.
  onHurt() {
    if (this.state === 'windup') {
      this.state = 'walk';
      this.shotT = Math.max(this.shotT, 0.6);
    }
  }

  onFrozen() {
    this.onHurt();
  }
}
