// Wolf: runs at the hero, and every 2–3 seconds (when close enough) crouches, aiming where the
// hero is, then lunges in a fast straight line. Step aside or roll during the crouch; after a
// lunge it stands still for a moment, which is the opening to hit it.
import { Enemy, enemySprite } from '../enemy.js';
import { WOLF } from '../../gfx/art.js';
import { randRange, dirTo } from '../../util.js';

const COLORS = { k: '#1b1b23', g: '#a8b0bc', G: '#6a7280', e: '#ffe040', w: '#ffffff' };
const RUN_FPS = 8;

export class Wolf extends Enemy {
  constructor(x, y) {
    super('wolf', x, y, { x: 2, y: 6, w: 12, h: 9 });
    this.state = 'chase';
    this.timer = 0;
    this.lungeT = randRange(...this.stats.lungeEvery);
    this.vx = 0;
    this.vy = 0;
    this.faceLeft = false;
    this.animT = Math.random();
  }

  think(dt, { player, room }) {
    const s = this.stats;
    const c = this.center;
    const p = player.center;
    this.timer -= dt;

    switch (this.state) {
      case 'chase': {
        const d = dirTo(c.x, c.y, p.x, p.y);
        this.move(d.x * s.speed * dt, d.y * s.speed * dt, room);
        this.faceLeft = d.x < 0;
        this.animT += dt;
        this.lungeT -= dt;
        if (this.lungeT <= 0 && Math.hypot(p.x - c.x, p.y - c.y) <= s.lungeRange) {
          // Aim now: the crouch is your warning to get out of the way.
          this.vx = d.x * s.lungeSpeed;
          this.vy = d.y * s.lungeSpeed;
          this.state = 'crouch';
          this.timer = s.crouchTime;
        }
        break;
      }
      case 'crouch':
        if (this.timer <= 0) {
          this.state = 'lunge';
          this.timer = s.lungeTime;
        }
        break;
      case 'lunge': {
        this.animT += dt * 2;
        const blocked = this.move(this.vx * dt, this.vy * dt, room);
        if (this.timer <= 0 || blocked.x || blocked.y) this.recover();
        break;
      }
      case 'recover':
        if (this.timer <= 0) {
          this.state = 'chase';
          this.lungeT = randRange(...s.lungeEvery);
        }
        break;
    }
  }

  recover() {
    this.state = 'recover';
    this.timer = this.stats.recoverTime;
  }

  // A freeze cancels a crouch or lunge.
  onFrozen() {
    if (this.state === 'crouch' || this.state === 'lunge') this.recover();
  }

  sprite() {
    const frame = this.state === 'crouch' || this.state === 'recover' ? 0 : Math.floor(this.animT * RUN_FPS) % 2;
    const img = enemySprite(`wolf${frame}${this.faceLeft ? 'L' : 'R'}`, WOLF[frame], COLORS, this.faceLeft);
    // Crouching: low to the ground and trembling.
    if (this.state === 'crouch') return { img, dx: Math.floor(this.timer * 30) % 2 ? 1 : -1, dy: 2 };
    return { img, dx: 0, dy: 0 };
  }
}
