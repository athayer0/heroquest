// Skeleton: keeps its distance and throws bones. It holds the bone overhead
// before each throw as a telegraph. Bones can be knocked down with the sword.
import { Enemy, enemySprite } from '../enemy.js';
import { Projectile, getBoneFrames } from '../projectile.js';
import { SKELETON } from '../../gfx/art.js';
import { randRange, dirTo } from '../../util.js';

const COLORS = { k: '#1b1b23', w: '#e8e4d8', B: '#a8a498' };

export class Skeleton extends Enemy {
  constructor(x, y) {
    super('skeleton', x, y, { x: 3, y: 3, w: 10, h: 12 });
    this.state = 'walk';
    this.throwT = randRange(...this.stats.throwInterval);
    this.strafeDir = Math.random() < 0.5 ? -1 : 1;
    this.strafeT = randRange(1, 2);
    this.animT = 0;
  }

  think(dt, { player, room, spawnProjectile }) {
    const s = this.stats;
    const c = this.center;
    const p = player.center;

    if (this.state === 'windup') {
      this.timer -= dt;
      if (this.timer <= 0) {
        const hand = { x: c.x, y: this.y + 3 };
        const d = dirTo(hand.x, hand.y, p.x, p.y);
        spawnProjectile(new Projectile({
          x: hand.x, y: hand.y, vx: d.x * s.boneSpeed, vy: d.y * s.boneSpeed, attack: s.attack,
        }));
        this.state = 'walk';
        this.throwT = randRange(...s.throwInterval);
      }
      return;
    }

    this.throwT -= dt;
    if (this.throwT <= 0) {
      this.state = 'windup';
      this.timer = s.windupTime;
      return;
    }

    // Back off when crowded, approach when far, otherwise circle the player.
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
    const blocked = this.move(mx * s.speed * dt, my * s.speed * dt, room);
    if (blocked.x || blocked.y) this.strafeDir *= -1;
    this.animT += dt;
  }

  // Getting hit interrupts a throw.
  onHurt() {
    if (this.state === 'windup') {
      this.state = 'walk';
      this.throwT = Math.max(this.throwT, 0.6);
    }
  }

  sprite() {
    const img = enemySprite('skeleton', SKELETON, COLORS);
    return { img, dx: 0, dy: Math.floor(this.animT * 6) % 2 };
  }

  draw(ctx, ox, oy) {
    super.draw(ctx, ox, oy);
    if (this.active && this.state === 'windup') {
      const bone = getBoneFrames()[0];
      const shake = Math.floor(this.timer * 24) % 2;
      ctx.drawImage(bone, Math.round(this.x + 4 + shake + ox), Math.round(this.y - 7 + oy));
    }
  }
}
