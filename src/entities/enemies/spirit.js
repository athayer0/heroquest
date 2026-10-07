// Spirits: floating ranged enemies that drift over lava and water and shoot elemental bolts.
// They aim and reposition like skeletons (see RangedEnemy). One class covers each element:
//   fire: bolts set the hero burning; immune to fire (Firebolt and burning do nothing).
//   ice: bolts chill the hero (a second while slowed freezes); immune to ice, weak to fire.
// Each variant's stats live in ENEMIES under its type (e.g. fireSpirit).
import { enemySprite } from '../enemy.js';
import { RangedEnemy } from './ranged.js';
import { Projectile } from '../projectile.js';
import { SPIRIT } from '../../gfx/art.js';
import { dirTo } from '../../util.js';

const VARIANTS = {
  fire: {
    type: 'fireSpirit', element: 'fire', bolt: 'firebolt', glow: '255,140,40',
    colors: { k: '#3a0a06', r: '#c8301a', o: '#f07a1a', y: '#ffd860', e: '#3a0a06' },
  },
  ice: {
    type: 'iceSpirit', element: 'ice', bolt: 'icebolt', glow: '140,200,255',
    colors: { k: '#0a1a3a', r: '#3a7ab8', o: '#7ac0f0', y: '#e8f8ff', e: '#0a1a3a' },
  },
};
const FLICKER_FPS = 6;

export class Spirit extends RangedEnemy {
  constructor(x, y, variant) {
    const v = VARIANTS[variant];
    super(v.type, x, y, { x: 3, y: 6, w: 10, h: 9 });
    this.variant = v;
    this.flying = true;
  }

  shoot({ spawnProjectile }, aim) {
    const s = this.stats;
    const m = this.muzzle;
    const d = dirTo(m.x, m.y, aim.x, aim.y);
    spawnProjectile(new Projectile({
      x: m.x, y: m.y, vx: d.x * s.shotSpeed, vy: d.y * s.shotSpeed, attack: s.attack,
      kind: this.variant.bolt, element: this.variant.element, size: 6, life: 3,
    }));
  }

  sprite() {
    const frame = Math.floor(this.animT * FLICKER_FPS) % 2;
    const img = enemySprite(`${this.type}${frame}`, SPIRIT[frame], this.variant.colors);
    const flare = this.state === 'windup' ? (Math.floor(this.timer * 30) % 2 ? 1 : -1) : 0;
    return { img, dx: flare, dy: Math.round(Math.sin(this.animT * 3) * 2) - 2 };
  }

  // A soft glow under the spirit, brighter while it winds up a shot.
  draw(ctx, ox, oy) {
    if (this.spawnT <= 0) {
      const c = this.center;
      const strength = this.state === 'windup' ? 0.45 : 0.22;
      const g = ctx.createRadialGradient(c.x + ox, c.y + oy, 2, c.x + ox, c.y + oy, 16);
      g.addColorStop(0, `rgba(${this.variant.glow},${strength})`);
      g.addColorStop(1, `rgba(${this.variant.glow},0)`);
      ctx.fillStyle = g;
      ctx.fillRect(Math.round(c.x + ox - 16), Math.round(c.y + oy - 16), 32, 32);
    }
    super.draw(ctx, ox, oy);
  }
}

export class FireSpirit extends Spirit {
  constructor(x, y) {
    super(x, y, 'fire');
  }
}

export class IceSpirit extends Spirit {
  constructor(x, y) {
    super(x, y, 'ice');
  }
}
