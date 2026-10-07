// Knight: slow, marches toward the player in straight lines and blocks any hit
// that comes from in front of its shield. It only re-aims every so often, so
// circling around to its side or back is the way to hurt it.
import { Enemy, enemySprite } from '../enemy.js';
import { KNIGHT } from '../../gfx/art.js';
import { dirTo } from '../../util.js';

const COLORS = {
  k: '#1b1b23', a: '#9aa4b8', A: '#5a6478', l: '#d0d8e8',
  s: '#c83a3a', S: '#8a2020', y: '#f2c43a',
};
const FACING_VEC = { down: { x: 0, y: 1 }, up: { x: 0, y: -1 }, left: { x: -1, y: 0 }, right: { x: 1, y: 0 } };
const OPPOSITE = { down: 'up', up: 'down', left: 'right', right: 'left' };

function cardinalToward(dx, dy, secondary = false) {
  const horizontal = Math.abs(dx) > Math.abs(dy);
  const useX = secondary ? !horizontal : horizontal;
  if (useX) return dx < 0 ? 'left' : 'right';
  return dy < 0 ? 'up' : 'down';
}

export class Knight extends Enemy {
  constructor(x, y) {
    super('knight', x, y, { x: 2, y: 3, w: 12, h: 12 });
    this.facing = 'down';
    this.turnT = 0;
    this.pauseT = 0;
    this.animT = 0;
  }

  think(dt, { player, room }) {
    const s = this.stats;
    if (this.pauseT > 0) {
      this.pauseT -= dt;
      return;
    }

    const c = this.center;
    const p = player.center;
    const dx = p.x - c.x;
    const dy = p.y - c.y;
    this.turnT -= dt;
    if (this.turnT <= 0) {
      this.turnT = s.turnInterval;
      const next = this.limitTurn(cardinalToward(dx, dy), dx, dy);
      if (next !== this.facing) {
        this.facing = next;
        this.pauseT = s.turnPause;
        return;
      }
    }

    const v = FACING_VEC[this.facing];
    const blocked = this.move(v.x * s.speed * dt, v.y * s.speed * dt, room);
    this.animT += dt;
    if (blocked.x || blocked.y) {
      // Walked into a wall: turn 90° toward the player's side (never back the way it came).
      let next = this.limitTurn(cardinalToward(dx, dy, true), dx, dy);
      if (next === this.facing) next = this.limitTurn(cardinalToward(dx, dy), dx, dy);
      if (next === this.facing) next = this.limitTurn(OPPOSITE[this.facing], dx, dy);
      this.facing = next;
      this.pauseT = s.turnPause;
      this.turnT = s.turnInterval;
    }
  }

  // Turns at most 90° at a time: an about-face becomes a quarter turn toward the
  // player's side, so it takes two turn intervals to face someone standing behind it.
  limitTurn(target, dx, dy) {
    if (target !== OPPOSITE[this.facing]) return target;
    const vertical = this.facing === 'up' || this.facing === 'down';
    if (vertical) return dx < 0 ? 'left' : 'right';
    return dy < 0 ? 'up' : 'down';
  }

  isFrontal(fromX, fromY) {
    const c = this.center;
    const d = dirTo(c.x, c.y, fromX, fromY);
    const v = FACING_VEC[this.facing];
    return d.x * v.x + d.y * v.y >= Math.cos((this.stats.frontArcDegrees * Math.PI) / 360);
  }

  // opts.unblockable: hits the shield can't stop (Chain Lightning strikes from above).
  hurt(damage, fromX, fromY, swingId = null, opts = {}) {
    if (!this.active || this.sameSwing(swingId)) return false;
    if (!opts.unblockable && this.isFrontal(fromX, fromY)) {
      if (swingId !== null) this.lastSwingId = swingId;
      this.pauseT = this.stats.blockPause;
      return 'blocked';
    }
    return super.hurt(damage, fromX, fromY, swingId);
  }

  sprite() {
    const flip = this.facing === 'left';
    const art = KNIGHT[flip ? 'right' : this.facing];
    const img = enemySprite(`knight-${this.facing}`, art, COLORS, flip);
    return { img, dx: 0, dy: Math.floor(this.animT * 4) % 2 };
  }
}
