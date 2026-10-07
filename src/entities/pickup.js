// Coins and hearts dropped by enemies. They pop out, bounce, and wait to be walked over.
import { DROPS } from '../config.js';
import { makeSprite } from '../gfx/sprites.js';
import { COIN, HEART } from '../gfx/art.js';
import { randRange } from '../util.js';

const COIN_COLORS = { k: '#1b1b23', y: '#f2c43a', Y: '#c08a1e', w: '#fff6c8' };
const HEART_COLORS = { k: '#1b1b23', r: '#e83a4a', w: '#ffc8d0' };
const GRAVITY = 320;
const COLLECT_DELAY = 0.25; // seconds before a fresh drop can be picked up

export function getHeartIcon() {
  return getSprites().heart;
}

export function getCoinIcon() {
  return getSprites().coin[0];
}

let sprites = null;
function getSprites() {
  return (sprites ??= {
    coin: COIN.map((f) => makeSprite(f, COIN_COLORS)),
    heart: makeSprite(HEART, HEART_COLORS),
  });
}

export class Pickup {
  // kind: 'coin' | 'heart'. (x, y) is the center point on the ground.
  constructor(kind, x, y, value) {
    this.kind = kind;
    this.x = x;
    this.y = y;
    this.value = value;
    const angle = randRange(0, Math.PI * 2);
    const speed = randRange(20, 50);
    this.vx = Math.cos(angle) * speed;
    this.vy = Math.sin(angle) * speed;
    this.z = 0;
    this.vz = randRange(70, 100);
    this.age = 0;
    this.collected = false;
  }

  get rect() {
    return { x: this.x - 5, y: this.y - 5, w: 10, h: 10 };
  }

  get collectable() {
    return this.age >= COLLECT_DELAY;
  }

  get expired() {
    return this.collected || this.age >= DROPS.pickupLifetime;
  }

  update(dt, room) {
    this.age += dt;
    if (this.z > 0 || this.vz > 0) {
      this.vz -= GRAVITY * dt;
      this.z = Math.max(0, this.z + this.vz * dt);
      if (this.z === 0) {
        // Small second bounce, then settle.
        this.vz = Math.abs(this.vz) > 40 ? Math.abs(this.vz) * 0.35 : 0;
        this.vx *= 0.5;
        this.vy *= 0.5;
      }
      const nx = this.x + this.vx * dt;
      const ny = this.y + this.vy * dt;
      if (!room.rectBlocked(nx - 4, ny - 4, 8, 8, true)) {
        this.x = nx;
        this.y = ny;
      } else {
        this.vx = 0;
        this.vy = 0;
      }
    }
  }

  draw(ctx, ox, oy) {
    const remaining = DROPS.pickupLifetime - this.age;
    if (remaining < DROPS.pickupBlinkTime && Math.floor(this.age * 10) % 2 === 0) return;

    const s = getSprites();
    const img = this.kind === 'coin' ? s.coin[Math.floor(this.age * 4) % 2] : s.heart;
    const x = Math.round(this.x - img.width / 2 + ox);
    const y = Math.round(this.y - img.height / 2 - this.z + oy);
    if (this.z > 0) {
      ctx.fillStyle = 'rgba(0,0,0,0.25)';
      ctx.fillRect(Math.round(this.x - 3 + ox), Math.round(this.y + 3 + oy), 6, 2);
    }
    ctx.drawImage(img, x, y);
  }
}
