// Projectiles: skeleton bones, the Pharaoh's bandages and the Dark Lord's orbs, plus the hero's friendly spell bolts.
// They fly over water and stop at walls and room edges. Enemy shots can be knocked out of
// the air with the sword; friendly ones hit enemies instead of the hero.
import { makeCanvas, makeSprite, rotateCW, px } from '../gfx/sprites.js';
import { BONE, BANDAGE } from '../gfx/art.js';

const BONE_COLORS = { k: '#1b1b23', w: '#e8e4d8' };
const SPIN_FPS = 12;
const ORB_PULSE_FPS = 8;

let boneFrames = null;
export function getBoneFrames() {
  return (boneFrames ??= [makeSprite(BONE, BONE_COLORS), makeSprite(rotateCW(BONE), BONE_COLORS)]);
}

const BANDAGE_COLORS = { k: '#3a2a1a', w: '#ece0c4' };
let bandageFrames = null;
function getBandageFrames() {
  return (bandageFrames ??= [makeSprite(BANDAGE, BANDAGE_COLORS), makeSprite(rotateCW(BANDAGE), BANDAGE_COLORS)]);
}

// Signed difference a − b, wrapped to [−π, π].
const angleDiff = (a, b) => Math.atan2(Math.sin(a - b), Math.cos(a - b));

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

let homingFrames = null;
function getHomingOrbFrames() {
  return (homingFrames ??= [
    makeCanvas(10, 10, (g) => paintOrb(g, 10, [[1.6, '#ffe0e0'], [2.8, '#ff5a5a'], [3.9, '#9a1a2a'], [4.6, '#2a0a10']])),
    makeCanvas(10, 10, (g) => paintOrb(g, 10, [[1.1, '#ffffff'], [2.4, '#ff8a7a'], [3.6, '#c82a3a'], [4.6, '#3a0a14']])),
  ]);
}

let orbFrames = null;
export function getOrbFrames() {
  return (orbFrames ??= [
    makeCanvas(10, 10, (g) => paintOrb(g, 10, [[1.6, '#ffffff'], [2.8, '#ff9ae0'], [3.9, '#b03ad8'], [4.6, '#3a0a4a']])),
    makeCanvas(10, 10, (g) => paintOrb(g, 10, [[1.1, '#ffffff'], [2.4, '#ffc0f0'], [3.6, '#d050f0'], [4.6, '#5a1a6a']])),
  ]);
}

// Elemental bolts (Firebolt, Frost Shard, spirit shots): a flickering orb trailing sparks.
const BOLTS = {
  firebolt: {
    rings: [
      [[1.2, '#ffffff'], [2.2, '#fff080'], [3.1, '#ff9a20'], [3.8, '#c8301a']],
      [[1.6, '#fff8c0'], [2.6, '#ffc040'], [3.4, '#f05a1a'], [3.8, '#8a1a10']],
    ],
    trail: ['#ffb040', '#e0501a'],
  },
  icebolt: {
    rings: [
      [[1.2, '#ffffff'], [2.2, '#e0f8ff'], [3.1, '#80c8f8'], [3.8, '#2a6ab0']],
      [[1.6, '#f4fcff'], [2.6, '#b0e4ff'], [3.4, '#5aa0e0'], [3.8, '#1a4a8a']],
    ],
    trail: ['#c0e8ff', '#5aa0e0'],
  },
};
const boltFrames = {};
function getBoltFrames(kind) {
  return (boltFrames[kind] ??= BOLTS[kind].rings.map((rings) => makeCanvas(8, 8, (g) => paintOrb(g, 8, rings))));
}

export class Projectile {
  // (x, y) is the center. `attack` is run through the normal damage formula (for friendly
  // bolts, it's the spell's damage).
  // homing: { target, turnRate } steers toward target.center. shootable: the hero's bolts destroy it.
  constructor({ x, y, vx, vy, attack, kind = 'bone', size = 6, life = 4, swordable = true, friendly = false, pierce = 0, element = null, homing = null, shootable = false }) {
    this.x = x;
    this.y = y;
    this.vx = vx;
    this.vy = vy;
    this.attack = attack;
    this.kind = kind;
    this.size = size;
    this.life = life;
    this.swordable = swordable;
    this.friendly = friendly;
    this.element = element; // 'fire' burns and 'ice' chills whatever it hits
    this.homing = homing;
    this.shootable = shootable;
    this.pierce = pierce; // friendly bolts: how many enemies it can pass through
    this.hits = new Set(); // enemies already hit (a piercing bolt hits each one once)
    this.age = 0;
    this.dead = false;
  }

  get rect() {
    const h = this.size / 2;
    return { x: this.x - h, y: this.y - h, w: this.size, h: this.size };
  }

  update(dt, room) {
    this.age += dt;
    if (this.homing) {
      const t = this.homing.target.center;
      const speed = Math.hypot(this.vx, this.vy);
      const cur = Math.atan2(this.vy, this.vx);
      const step = this.homing.turnRate * dt;
      const a = cur + Math.max(-step, Math.min(step, angleDiff(Math.atan2(t.y - this.y, t.x - this.x), cur)));
      this.vx = Math.cos(a) * speed;
      this.vy = Math.sin(a) * speed;
    }
    this.x += this.vx * dt;
    this.y += this.vy * dt;
    const r = this.rect;
    if (this.age >= this.life || room.rectBlocked(r.x, r.y, r.w, r.h, true, true)) this.dead = true;
  }

  draw(ctx, ox, oy) {
    if (BOLTS[this.kind]) {
      this.drawBolt(ctx, ox, oy);
      return;
    }
    const frames = { orb: getOrbFrames, homingOrb: getHomingOrbFrames, bandage: getBandageFrames }[this.kind]?.() ?? getBoneFrames();
    const fps = this.kind === 'orb' || this.kind === 'homingOrb' ? ORB_PULSE_FPS : SPIN_FPS;
    const img = frames[Math.floor(this.age * fps) % frames.length];
    ctx.drawImage(img, Math.round(this.x - img.width / 2 + ox), Math.round(this.y - img.height / 2 + oy));
  }

  drawBolt(ctx, ox, oy) {
    const { trail } = BOLTS[this.kind];
    const speed = Math.hypot(this.vx, this.vy) || 1;
    const dx = this.vx / speed;
    const dy = this.vy / speed;
    trail.forEach((color, i) => {
      const back = 5 + i * 4;
      const wob = Math.sin(this.age * 40 + i * 2) * 1.5;
      const size = 3 - i;
      px(ctx, color, Math.round(this.x - dx * back - dy * wob - size / 2 + ox), Math.round(this.y - dy * back + dx * wob - size / 2 + oy), size, size);
    });
    const frames = getBoltFrames(this.kind);
    const img = frames[Math.floor(this.age * 16) % frames.length];
    ctx.drawImage(img, Math.round(this.x - img.width / 2 + ox), Math.round(this.y - img.height / 2 + oy));
  }
}
