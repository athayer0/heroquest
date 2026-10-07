// Gargoyle: a stone tank. Walks steadily at the hero, hits very hard, and never takes knockback,
// so it can't be pushed away: dodge it instead (or slow it; two chills freeze it).
import { Enemy, enemySprite } from '../enemy.js';
import { GARGOYLE } from '../../gfx/art.js';
import { dirTo } from '../../util.js';

const COLORS = { k: '#1b1b23', g: '#8a8a96', G: '#5a5a66', D: '#6a6a78', e: '#ff3a3a', w: '#f4f4f0' };
const STEP_FPS = 3;

export class Gargoyle extends Enemy {
  constructor(x, y) {
    super('gargoyle', x, y, { x: 2, y: 4, w: 12, h: 11 });
    this.animT = Math.random();
  }

  think(dt, { player, room }) {
    const c = this.center;
    const p = player.center;
    const d = dirTo(c.x, c.y, p.x, p.y);
    this.move(d.x * this.stats.speed * dt, d.y * this.stats.speed * dt, room);
    this.animT += dt;
  }

  sprite() {
    const frame = Math.floor(this.animT * STEP_FPS) % 2;
    return { img: enemySprite(`gargoyle${frame}`, GARGOYLE[frame], COLORS), dx: 0, dy: 0 };
  }
}
