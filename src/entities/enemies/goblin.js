// Goblin: wanders until the player gets close, shows a "!" and shakes, then charges
// in a straight line. It's dazed for a moment after each charge.
import { Enemy, enemySprite } from '../enemy.js';
import { GOBLIN } from '../../gfx/art.js';
import { drawTextShadow } from '../../gfx/font.js';
import { randRange, dirTo } from '../../util.js';

const COLORS = {
  k: '#1b1b23', g: '#7ab83a', G: '#4a8a2a', e: '#ffea4a', w: '#f4f4f0',
  t: '#8a5a2a', T: '#5a3a1a',
};
const IDLE_CHANCE = 0.3; // chance a wander step is standing still

export class Goblin extends Enemy {
  constructor(x, y) {
    super('goblin', x, y, { x: 3, y: 5, w: 10, h: 10 });
    this.state = 'wander';
    this.cooldown = 0;
    this.animT = 0;
    this.pickWander();
  }

  pickWander() {
    this.state = 'wander';
    this.timer = randRange(...this.stats.wanderTurn);
    if (Math.random() < IDLE_CHANCE) {
      this.vx = 0;
      this.vy = 0;
    } else {
      const a = Math.floor(Math.random() * 4) * (Math.PI / 2);
      this.vx = Math.cos(a) * this.stats.wanderSpeed;
      this.vy = Math.sin(a) * this.stats.wanderSpeed;
    }
  }

  // A freeze cancels a wind-up or charge; the goblin is dazed afterwards as if the charge ended.
  onFrozen() {
    if (this.state === 'windup' || this.state === 'charge') {
      this.state = 'recover';
      this.timer = this.stats.recoverTime;
    }
  }

  think(dt, { player, room }) {
    const s = this.stats;
    this.timer -= dt;
    this.cooldown -= dt;
    const c = this.center;
    const p = player.center;

    switch (this.state) {
      case 'wander': {
        const blocked = this.move(this.vx * dt, this.vy * dt, room);
        if (this.vx || this.vy) this.animT += dt;
        if (this.timer <= 0 || blocked.x || blocked.y) this.pickWander();
        if (this.cooldown <= 0 && Math.hypot(p.x - c.x, p.y - c.y) < s.detectRange) {
          this.state = 'windup';
          this.timer = s.windupTime;
        }
        break;
      }
      case 'windup':
        if (this.timer <= 0) {
          const d = dirTo(c.x, c.y, p.x, p.y);
          this.vx = d.x * s.chargeSpeed;
          this.vy = d.y * s.chargeSpeed;
          this.state = 'charge';
          this.timer = s.chargeTime;
        }
        break;
      case 'charge': {
        this.animT += dt * 2;
        const blocked = this.move(this.vx * dt, this.vy * dt, room);
        if (this.timer <= 0 || blocked.x || blocked.y) {
          this.state = 'recover';
          this.timer = s.recoverTime;
        }
        break;
      }
      case 'recover':
        if (this.timer <= 0) {
          this.cooldown = s.chargeCooldown;
          this.pickWander();
        }
        break;
    }
  }

  // Getting hit stops a charge and dazes it briefly.
  onHurt() {
    if (this.state !== 'recover') {
      this.state = 'recover';
      this.timer = this.stats.recoverTime * 0.5;
    }
  }

  sprite() {
    const frame = Math.floor(this.animT * 6) % 2;
    const img = enemySprite(`goblin${frame}`, GOBLIN[frame], COLORS);
    const shake = this.state === 'windup' ? (Math.floor(this.timer * 30) % 2 ? 1 : -1) : 0;
    return { img, dx: shake, dy: 0 };
  }

  draw(ctx, ox, oy) {
    super.draw(ctx, ox, oy);
    if (!this.active) return;
    const x = Math.round(this.x + ox);
    const y = Math.round(this.y + oy);
    if (this.state === 'windup') {
      drawTextShadow(ctx, '!', x + 6, y - 10, '#ffe040');
    } else if (this.state === 'recover') {
      // Dizzy stars circling the head.
      for (let i = 0; i < 2; i++) {
        const a = this.timer * 10 + i * Math.PI;
        ctx.fillStyle = '#ffe040';
        ctx.fillRect(x + 7 + Math.round(Math.cos(a) * 6), y - 1 + Math.round(Math.sin(a) * 2), 2, 2);
      }
    }
  }
}
