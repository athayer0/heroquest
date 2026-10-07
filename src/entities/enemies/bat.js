// Bat: fast, erratic flight over any terrain, loosely homing on the player.
// Perches now and then, which is the best moment to hit it.
import { ROOM_W, ROOM_H } from '../../constants.js';
import { Enemy, enemySprite } from '../enemy.js';
import { BAT } from '../../gfx/art.js';
import { randRange, dirTo } from '../../util.js';

const COLORS = { k: '#1b1b23', b: '#5a3a7a', B: '#8a6aaa', e: '#ff5a5a' };
const FLAP_FPS = 10;

export class Bat extends Enemy {
  constructor(x, y) {
    super('bat', x, y, { x: 2, y: 4, w: 12, h: 8 });
    this.flying = true;
    this.state = 'fly';
    this.turnT = 0;
    this.restT = randRange(...this.stats.restEvery);
    this.timer = 0;
    this.vx = 0;
    this.vy = 0;
    this.animT = Math.random();
  }

  think(dt, { player }) {
    const s = this.stats;
    this.animT += dt;

    if (this.state === 'rest') {
      this.timer -= dt;
      if (this.timer <= 0) {
        this.state = 'fly';
        this.restT = randRange(...s.restEvery);
        this.turnT = 0;
      }
      return;
    }

    this.restT -= dt;
    if (this.restT <= 0) {
      this.state = 'rest';
      this.timer = s.restTime;
      return;
    }

    this.turnT -= dt;
    if (this.turnT <= 0) {
      this.turnT = randRange(...s.turnInterval);
      const c = this.center;
      const p = player.center;
      const d = dirTo(c.x, c.y, p.x, p.y);
      const a = Math.atan2(d.y, d.x) + randRange(-s.aimWobble, s.aimWobble);
      this.vx = Math.cos(a) * s.speed;
      this.vy = Math.sin(a) * s.speed;
    }

    const blocked = this.move(this.vx * dt, this.vy * dt);
    if (blocked.x) this.vx = -this.vx;
    if (blocked.y) this.vy = -this.vy;
  }

  // Flies over everything; only the room edges stop it.
  move(dx, dy) {
    const hb = this.hb;
    const blocked = { x: false, y: false };
    const nx = this.x + dx;
    const ny = this.y + dy;
    if (nx + hb.x < 0 || nx + hb.x + hb.w > ROOM_W) blocked.x = true;
    else this.x = nx;
    if (ny + hb.y < 0 || ny + hb.y + hb.h > ROOM_H) blocked.y = true;
    else this.y = ny;
    return blocked;
  }

  sprite() {
    const frame = this.state === 'rest' ? 1 : Math.floor(this.animT * FLAP_FPS) % 2;
    const img = enemySprite(`bat${frame}`, BAT[frame], COLORS);
    const bob = this.state === 'rest' ? 2 : Math.round(Math.sin(this.animT * 9) * 1.5);
    return { img, dx: 0, dy: bob };
  }
}
