// Friendly townsfolk. They stand still (with a small idle bob), block movement, and talk.
import { TILE } from '../constants.js';
import { makeSprite } from '../gfx/sprites.js';
import { WOMAN, PRINCESS, SHOPKEEPER, KID, FARMER, GUARD, ELDER, MERCHANT } from '../gfx/characters.js';

const K = '#1b1b23';
const SKIN = { s: '#f2c08a', S: '#d89a68' };
const LIPS = '#e06a7a';

// Each look: art + its colors (see the key list in gfx/characters.js).
export const LOOKS = {
  // Mira: blonde, red dress
  villager: { art: WOMAN, colors: { k: K, ...SKIN, h: '#e8c040', c: '#c84a5a', C: '#8a2a3a', a: '#f4f0e0', w: '#ffffff', f: '#5a3a2a', r: LIPS } },
  // Rosa: brunette, green dress
  villager2: { art: WOMAN, colors: { k: K, ...SKIN, h: '#7a3a1a', c: '#4a9a5a', C: '#2a6a3a', a: '#f2d43a', w: '#ffffff', f: '#4a3020', r: LIPS } },
  kid: { art: KID, colors: { k: K, ...SKIN, h: '#8a4b1e', c: '#4a8ad8', C: '#2a5aa8', a: '#6b3d1e', p: '#5a4a3a', f: '#3a2a1a', r: LIPS } },
  farmer: { art: FARMER, colors: { k: K, ...SKIN, a: '#e0c070', A: '#b09040', H: '#b8b8b8', c: '#d8d0b0', p: '#4a6ab0', f: '#4a3020' } },
  guard: { art: GUARD, colors: { k: K, ...SKIN, l: '#e0e4ee', M: '#9aa0b0', c: '#3a5ab8', a: '#e0b040', b: '#4a3020', p: '#5a4a3a', f: '#3a2a1a' } },
  // The retired knight in the market: same kit, faded red tabard
  veteran: { art: GUARD, colors: { k: K, ...SKIN, l: '#d0d4dc', M: '#8a909e', c: '#9a3a3a', a: '#d8d8d8', b: '#4a3020', p: '#4a4a5a', f: '#2a2a2a' } },
  elder: { art: ELDER, colors: { k: K, ...SKIN, w: '#f4f4f0', c: '#6a4aa8', C: '#4a2a7a', a: '#e0b040', g: '#9a6a32', G: '#e0b040' } },
  shopkeeper: { art: SHOPKEEPER, colors: { k: K, ...SKIN, h: '#3a2a1a', H: '#3a2a1a', c: '#c86a3a', C: '#8a4a28', a: '#6b3d1e', w: '#f4f0e0', p: '#4a3a2a', f: '#2a1a10' } },
  merchant: { art: MERCHANT, colors: { k: K, s: '#f2c08a', S: '#c8946a', H: '#8a6a4a', c: '#2a7a6a', C: '#1a5048', a: '#a8743a', A: '#6e4a22', b: '#4a3020', f: '#3a2a1a' } },
  princess: { art: PRINCESS, colors: { k: K, ...SKIN, y: '#f2c43a', h: '#f2d070', c: '#f08ab8', C: '#c05a8a', a: '#ffffff', w: '#ffffff', f: '#e0b040', r: LIPS } },
};

const spriteCache = new Map();
export function npcSprite(look) {
  if (!spriteCache.has(look)) {
    const l = LOOKS[look];
    spriteCache.set(look, makeSprite(l.art, l.colors));
  }
  return spriteCache.get(look);
}

export class Npc {
  // def: { x, y (tiles), look, name, lines: [...] }
  constructor(def) {
    this.def = def;
    this.name = def.name;
    this.lines = def.lines;
    this.x = def.x * TILE;
    this.y = def.y * TILE;
    this.bobOffset = Math.random() * 2;
  }

  get hitbox() {
    return { x: this.x + 2, y: this.y + 6, w: 12, h: 10 };
  }

  get center() {
    const hb = this.hitbox;
    return { x: hb.x + hb.w / 2, y: hb.y + hb.h / 2 };
  }

  draw(ctx, ox, oy, time) {
    const bob = Math.floor(time * 1.5 + this.bobOffset) % 2;
    ctx.drawImage(npcSprite(this.def.look), Math.round(this.x + ox), Math.round(this.y + oy - bob));
  }
}
