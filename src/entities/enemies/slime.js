// Slime: rests, squashes, then hops slowly toward the player.
import { Enemy, enemySprite } from '../enemy.js';
import { SLIME } from '../../gfx/art.js';
import { randRange, dirTo } from '../../util.js';

const COLORS = { k: '#1b1b23', b: '#4fa8e0', B: '#2f6ea8', w: '#d4f0ff' };
const SQUASH_TIME = 0.15; // squash pose right before a hop (telegraph)
const AIM_WOBBLE = 0.5; // radians of randomness so slimes don't beeline perfectly

export class Slime extends Enemy {
  constructor(x, y) {
    super('slime', x, y, { x: 2, y: 7, w: 12, h: 9 });
    this.state = 'rest';
    this.timer = randRange(...this.stats.hopInterval);
    this.vx = 0;
    this.vy = 0;
  }

  think(dt, { player, room }) {
    this.timer -= dt;
    if (this.state === 'rest') {
      if (this.timer <= 0) {
        const c = this.center;
        const p = player.center;
        const d = dirTo(c.x, c.y, p.x, p.y);
        const a = Math.atan2(d.y, d.x) + randRange(-AIM_WOBBLE, AIM_WOBBLE);
        this.vx = Math.cos(a) * this.stats.hopSpeed;
        this.vy = Math.sin(a) * this.stats.hopSpeed;
        this.state = 'hop';
        this.timer = this.stats.hopTime;
      }
    } else {
      this.move(this.vx * dt, this.vy * dt, room);
      if (this.timer <= 0) this.rest();
    }
  }

  rest() {
    this.state = 'rest';
    this.timer = randRange(...this.stats.hopInterval);
  }

  onHurt() {
    this.rest();
  }

  sprite() {
    const img = enemySprite('slime', SLIME, COLORS);
    if (this.state === 'hop') {
      const p = 1 - this.timer / this.stats.hopTime;
      return { img, dx: 0, dy: -Math.round(Math.sin(p * Math.PI) * 6) };
    }
    if (this.timer < SQUASH_TIME) return { img, dx: -1, dy: 3, w: 18, h: 13 };
    return { img, dx: 0, dy: 0 };
  }

  draw(ctx, ox, oy) {
    if (this.state === 'hop' && this.spawnT <= 0) {
      ctx.fillStyle = 'rgba(0,0,0,0.25)';
      ctx.fillRect(Math.round(this.x + 3 + ox), Math.round(this.y + 14 + oy), 10, 2);
    }
    super.draw(ctx, ox, oy);
  }
}
