// Skeleton: keeps its distance and throws bones, holding the bone overhead before each throw
// as a telegraph. Only throws with a clear line, moving for a better angle when blocked, and
// leads its throws (see RangedEnemy). Bones can be knocked down with the sword.
import { enemySprite } from '../enemy.js';
import { RangedEnemy } from './ranged.js';
import { Projectile, getBoneFrames } from '../projectile.js';
import { SKELETON } from '../../gfx/art.js';
import { dirTo } from '../../util.js';

const COLORS = { k: '#1b1b23', w: '#e8e4d8', B: '#a8a498' };

export class Skeleton extends RangedEnemy {
  constructor(x, y) {
    super('skeleton', x, y, { x: 3, y: 3, w: 10, h: 12 });
  }

  // Thrown from overhead.
  get muzzle() {
    return { x: this.center.x, y: this.y + 3 };
  }

  shoot({ spawnProjectile }, aim) {
    const s = this.stats;
    const m = this.muzzle;
    const d = dirTo(m.x, m.y, aim.x, aim.y);
    spawnProjectile(new Projectile({ x: m.x, y: m.y, vx: d.x * s.shotSpeed, vy: d.y * s.shotSpeed, attack: s.attack }));
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
