// Friendly townsfolk. They stand still (with a small idle bob), block movement, and talk.
import { TILE } from '../constants.js';
import { makeSprite } from '../gfx/sprites.js';
import { VILLAGER, ELDER, PRINCESS } from '../gfx/art.js';

const SKIN = '#f2c08a';
const LOOKS = {
  elder: { art: ELDER, h: '#d8d8d8', r: '#6a4aa8', R: '#4a2a7a' },
  villager: { art: VILLAGER, h: '#e8c040', r: '#c84a5a', R: '#8a2a3a' },
  kid: { art: VILLAGER, h: '#8a4b1e', r: '#4a8ad8', R: '#2a5aa8' },
  farmer: { art: VILLAGER, h: '#a0a0a0', r: '#7a9a3a', R: '#4a6a2a' },
  guard: { art: VILLAGER, h: '#5a5a6a', r: '#8a8aa0', R: '#5a5a70' },
  shopkeeper: { art: VILLAGER, h: '#3a2a1a', r: '#d8a040', R: '#a07020' },
  merchant: { art: VILLAGER, h: '#6a3a8a', r: '#2a8a7a', R: '#1a5a50' },
  princess: {
    art: PRINCESS,
    colors: { k: '#1b1b23', y: '#f2c43a', h: '#f2d070', s: '#f2c08a', p: '#f08ab8', P: '#c05a8a', w: '#ffffff', r: '#e85a7a' },
  },
};

const spriteCache = new Map();
export function npcSprite(look) {
  if (!spriteCache.has(look)) {
    const l = LOOKS[look];
    const colors = l.colors ?? { k: '#1b1b23', s: SKIN, w: '#f4f4f0', h: l.h, r: l.r, R: l.R };
    spriteCache.set(look, makeSprite(l.art, colors));
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
