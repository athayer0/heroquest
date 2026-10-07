// Treasure chests: opened once with E, and remembered in the save once opened.
// def: { id, x, y (tiles), contents: { spell?, gold?, potions?, manaPotions?, seal? }, reward? }
// (reward: a boss's reward chest; opening one saves the game right away)
import { TILE } from '../constants.js';
import { makeCanvas, px } from '../gfx/sprites.js';

const C = {
  k: '#1b1b23', wood: '#a8692e', woodLight: '#d0904a', woodDark: '#6a3e18',
  band: '#e0b040', bandDark: '#a07820', inside: '#2a1a10',
};

function paintBody(g) {
  px(g, C.k, 1, 7, 14, 9);
  px(g, C.wood, 2, 8, 12, 7);
  px(g, C.woodDark, 2, 14, 12, 1);
  for (const x of [4, 11]) px(g, C.band, x, 8, 1, 7);
}

let sprites = null;
function getSprites() {
  return (sprites ??= {
    closed: makeCanvas(TILE, TILE, (g) => {
      paintBody(g);
      px(g, C.k, 1, 2, 14, 6);
      px(g, C.woodLight, 2, 3, 12, 4);
      px(g, C.wood, 2, 6, 12, 1);
      for (const x of [4, 11]) px(g, C.band, x, 3, 1, 4);
      px(g, C.k, 6, 5, 4, 5); // lock
      px(g, C.band, 7, 6, 2, 3);
      px(g, C.bandDark, 7, 8, 2, 1);
    }),
    open: makeCanvas(TILE, TILE, (g) => {
      paintBody(g);
      px(g, C.k, 1, 0, 14, 4); // lid tipped back
      px(g, C.woodDark, 2, 1, 12, 2);
      px(g, C.k, 1, 4, 14, 4);
      px(g, C.inside, 2, 5, 12, 3);
    }),
  });
}

export class Chest {
  constructor(def, opened) {
    this.def = def;
    this.id = def.id;
    this.x = def.x * TILE;
    this.y = def.y * TILE;
    this.opened = opened;
  }

  get hitbox() {
    return { x: this.x + 1, y: this.y + 6, w: 14, h: 10 };
  }

  draw(ctx, ox, oy) {
    const img = this.opened ? getSprites().open : getSprites().closed;
    ctx.drawImage(img, Math.round(this.x + ox), Math.round(this.y + oy));
  }
}
