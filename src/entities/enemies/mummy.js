// Mummy: slow but relentless. Always walks straight at the hero and never stops to wander,
// so keep moving and chip away at it.
import { Enemy, enemySprite } from '../enemy.js';
import { MUMMY } from '../../gfx/art.js';
import { dirTo } from '../../util.js';

const COLORS = { k: '#1b1b23', w: '#e8dcc0', W: '#b0a080', e: '#7aff6a' };
const WALK_FPS = 3;

export class Mummy extends Enemy {
  constructor(x, y) {
    super('mummy', x, y, { x: 3, y: 3, w: 10, h: 12 });
    this.animT = Math.random();
  }

  think(dt, { player, room }) {
    const c = this.center;
    const p = player.center;
    const d = dirTo(c.x, c.y, p.x, p.y);
    const speed = this.stats.speed;
    this.move(d.x * speed * dt, d.y * speed * dt, room); // blocked on one axis, it slides along the other
    this.animT += dt;
  }

  sprite() {
    const frame = Math.floor(this.animT * WALK_FPS) % 2;
    return { img: enemySprite(`mummy${frame}`, MUMMY[frame], COLORS), dx: 0, dy: 0 };
  }
}
