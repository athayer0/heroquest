// Enemy projectiles: skeleton bones and the Dark Lord's orbs. They fly over water,
// stop at walls and room edges, and can be knocked out of the air with the sword.
import { makeCanvas, makeSprite, rotateCW, px } from '../gfx/sprites.js';
import { BONE } from '../gfx/art.js';

const BONE_COLORS = { k: '#1b1b23', w: '#e8e4d8' };
const SPIN_FPS = 12;
const ORB_PULSE_FPS = 8;

let boneFrames = null;
export function getBoneFrames() {
  return (boneFrames ??= [makeSprite(BONE, BONE_COLORS), makeSprite(rotateCW(BONE), BONE_COLORS)]);
}

// Pulsing dark-magic orb, drawn procedurally as concentric pixel circles.
function paintOrb(g, size, rings) {
  const c = (size - 1) / 2;
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const d = Math.hypot(x - c, y - c);
      const ring = rings.find(([r]) => d <= r);
      if (ring) px(g, ring[1], x, y);
    }
  }
}

let orbFrames = null;
export function getOrbFrames() {
  return (orbFrames ??= [
    makeCanvas(10, 10, (g) => paintOrb(g, 10, [[1.6, '#ffffff'], [2.8, '#ff9ae0'], [3.9, '#b03ad8'], [4.6, '#3a0a4a']])),
    makeCanvas(10, 10, (g) => paintOrb(g, 10, [[1.1, '#ffffff'], [2.4, '#ffc0f0'], [3.6, '#d050f0'], [4.6, '#5a1a6a']])),
  ]);
}

export class Projectile {
  // (x, y) is the center. `attack` is run through the normal damage formula.
  constructor({ x, y, vx, vy, attack, kind = 'bone', size = 6, life = 4, swordable = true }) {
    this.x = x;
    this.y = y;
    this.vx = vx;
    this.vy = vy;
    this.attack = attack;
    this.kind = kind;
    this.size = size;
    this.life = life;
    this.swordable = swordable;
    this.age = 0;
    this.dead = false;
  }

  get rect() {
    const h = this.size / 2;
    return { x: this.x - h, y: this.y - h, w: this.size, h: this.size };
  }

  update(dt, room) {
    this.age += dt;
    this.x += this.vx * dt;
    this.y += this.vy * dt;
    const r = this.rect;
    if (this.age >= this.life || room.rectBlocked(r.x, r.y, r.w, r.h, true, true)) this.dead = true;
  }

  draw(ctx, ox, oy) {
    const frames = this.kind === 'orb' ? getOrbFrames() : getBoneFrames();
    const fps = this.kind === 'orb' ? ORB_PULSE_FPS : SPIN_FPS;
    const img = frames[Math.floor(this.age * fps) % frames.length];
    ctx.drawImage(img, Math.round(this.x - img.width / 2 + ox), Math.round(this.y - img.height / 2 + oy));
  }
}
