// Vulture: a tougher, faster bat that rests less. Every few seconds it hovers and screeches
// (the telegraph), then dives in a straight line at where the hero was.
import { Bat } from './bat.js';
import { enemySprite } from '../enemy.js';
import { VULTURE } from '../../gfx/art.js';
import { drawTextShadow } from '../../gfx/font.js';
import { randRange, dirTo } from '../../util.js';

const COLORS = { k: '#1b1b23', D: '#5a3a24', b: '#8a6040', B: '#6a4628', p: '#e89a9a', e: '#1b1b23', w: '#f0ece0', y: '#e0b040' };
const FLAP_FPS = 8;

export class Vulture extends Bat {
  constructor(x, y) {
    super(x, y, 'vulture');
    this.swoopT = randRange(...this.stats.swoopEvery);
  }

  think(dt, ctx) {
    const s = this.stats;
    if (this.state === 'screech') {
      this.animT += dt * 2; // flaps hard in place
      this.timer -= dt;
      if (this.timer <= 0) {
        const c = this.center;
        const p = ctx.player.center;
        const d = dirTo(c.x, c.y, p.x, p.y);
        this.vx = d.x * s.swoopSpeed;
        this.vy = d.y * s.swoopSpeed;
        this.state = 'swoop';
        this.timer = s.swoopTime;
      }
      return;
    }
    if (this.state === 'swoop') {
      this.animT += dt;
      this.timer -= dt;
      const blocked = this.move(this.vx * dt, this.vy * dt);
      if (this.timer <= 0 || blocked.x || blocked.y) {
        this.state = 'fly';
        this.turnT = 0;
        this.swoopT = randRange(...s.swoopEvery);
      }
      return;
    }
    if (this.state === 'fly') {
      this.swoopT -= dt;
      if (this.swoopT <= 0) {
        this.state = 'screech';
        this.timer = s.screechTime;
        return;
      }
    }
    super.think(dt, ctx);
  }

  // A freeze cancels a screech or swoop.
  onFrozen() {
    if (this.state === 'screech' || this.state === 'swoop') {
      this.state = 'fly';
      this.turnT = 0;
      this.swoopT = randRange(...this.stats.swoopEvery);
    }
  }

  sprite() {
    const frame = this.state === 'rest' ? 1 : Math.floor(this.animT * FLAP_FPS) % 2;
    const img = enemySprite(`vulture${frame}`, VULTURE[frame], COLORS);
    const shake = this.state === 'screech' ? (Math.floor(this.timer * 30) % 2 ? 1 : -1) : 0;
    const bob = this.state === 'rest' ? 2 : Math.round(Math.sin(this.animT * 7) * 1.5);
    return { img, dx: shake, dy: bob };
  }

  draw(ctx, ox, oy) {
    super.draw(ctx, ox, oy);
    if (this.active && this.state === 'screech') {
      drawTextShadow(ctx, '!', Math.round(this.x + 6 + ox), Math.round(this.y - 6 + oy), '#ff5050');
    }
  }
}
