// Tile definitions and per-palette tile rendering.
import { TILE } from '../constants.js';
import { TERRAIN } from '../config.js';
import { makeCanvas, makeSprite, px } from '../gfx/sprites.js';
import { AREA_PALETTES } from '../gfx/palette.js';
import { TREE, ROCK, SIGN, FENCE, BUSH, PILLAR, BRAZIER, CACTUS, GARGOYLE } from '../gfx/art.js';

// Map characters used in room layouts.
//   .  grass      ,  flowers    :  path       _  floor      c  carpet
//   ~  water      #  wall       D  doorway    L  locked boss door
//   T  tree       b  bush       R  rock       S  sign       F  fence
//   r  roof       h  house wall w  window     d  house door C  shop counter
//   P  pillar     B  brazier
//   %  quicksand (half speed)   =  lava (impassable)   ^  fire vent   *  ice (slippery)
//   G  sealed gate, empty socket   J  sealed gate, socket holding a seal
//   u  dunes (ground)   Y  cactus
//   Z  gargoyle statue (wakes up in the Dark Lord's third phase)
//   W  cracked wall: looks like a wall, but a sword hit or a bolt breaks it open
// Overlay tiles are drawn on top of the room's ground tile.
// `low` tiles (water, lava) can be crossed by flyers and projectiles.
export const TILES = {
  '.': { name: 'grass', solid: false },
  ',': { name: 'flowers', solid: false },
  ':': { name: 'path', solid: false },
  '_': { name: 'floor', solid: false },
  'c': { name: 'carpet', solid: false },
  '~': { name: 'water', solid: true, low: true },
  '#': { name: 'wall', solid: true },
  'D': { name: 'door', solid: false },
  'L': { name: 'lockedDoor', solid: true },
  'r': { name: 'roof', solid: true },
  'h': { name: 'houseWall', solid: true },
  'w': { name: 'window', solid: true },
  'd': { name: 'houseDoor', solid: true },
  'C': { name: 'counter', solid: true },
  'T': { name: 'tree', solid: true, overlay: true },
  'b': { name: 'bush', solid: true, overlay: true },
  'R': { name: 'rock', solid: true, overlay: true },
  'S': { name: 'sign', solid: true, overlay: true },
  'F': { name: 'fence', solid: true, overlay: true },
  'P': { name: 'pillar', solid: true, overlay: true },
  'B': { name: 'brazier', solid: true, overlay: true },
  '%': { name: 'quicksand', solid: false },
  '=': { name: 'lava', solid: true, low: true },
  '^': { name: 'vent', solid: false },
  '*': { name: 'ice', solid: false },
  'u': { name: 'dune', solid: false },
  'Y': { name: 'cactus', solid: true, overlay: true },
  'Z': { name: 'statue', solid: true, overlay: true },
  'W': { name: 'crackedWall', solid: true },
  'G': { name: 'gate', solid: true },
  'J': { name: 'gateSealed', solid: true },
};

// Fire vents erupt on a cycle: idle, then a warning glow, then a short eruption. Vents on
// alternating (checkerboard) tiles are half a cycle apart. Returns 'idle' | 'glow' | 'erupt'
// and the eruption's number (so each one hurts only once).
export function ventPhase(tx, ty, time) {
  const { period, glowTime, eruptTime } = TERRAIN.vent;
  const shifted = time + ((tx + ty) % 2) * (period / 2);
  const t = shifted % period;
  const cycle = Math.floor(shifted / period);
  if (t >= period - eruptTime) return { state: 'erupt', t: t - (period - eruptTime), cycle };
  if (t >= period - eruptTime - glowTime) return { state: 'glow', t: t - (period - eruptTime - glowTime), cycle };
  return { state: 'idle', t, cycle };
}

export function isSolidChar(ch, flying = false) {
  const def = TILES[ch];
  if (!def) return false;
  return def.solid && !(flying && def.low);
}

// ---------- Procedural ground tiles ----------
const GROUND = {
  grass(g, P) {
    px(g, P.grass, 0, 0, TILE, TILE);
    for (const [x, y] of [[2, 3], [10, 1], [12, 10], [4, 12], [13, 5], [7, 7]]) {
      px(g, P.grassDark, x, y);
      px(g, P.grassDark, x + 2, y);
      px(g, P.grassDark, x + 1, y + 1);
    }
    for (const [x, y] of [[6, 2], [1, 8], [10, 13], [15, 14]]) px(g, P.grassLight, x, y);
  },
  flowers(g, P) {
    GROUND.grass(g, P);
    const flower = (x, y, petal) => {
      px(g, petal, x - 1, y);
      px(g, petal, x + 1, y);
      px(g, petal, x, y - 1);
      px(g, petal, x, y + 1);
      px(g, P.flowerYellow, x, y);
    };
    flower(3, 4, P.flowerRed);
    flower(11, 9, P.flowerWhite);
    flower(6, 12, P.flowerRed);
    flower(13, 2, P.flowerWhite);
  },
  path(g, P) {
    px(g, P.path, 0, 0, TILE, TILE);
    for (const [x, y] of [[3, 2], [11, 4], [6, 9], [13, 13], [1, 12], [8, 14]]) px(g, P.pathDark, x, y);
    for (const [x, y] of [[9, 7], [2, 6], [14, 1]]) px(g, P.pathLight, x, y);
  },
  floor(g, P) {
    px(g, P.floor, 0, 0, TILE, TILE);
    px(g, P.floorLight, 0, 0, 15, 1);
    px(g, P.floorLight, 0, 0, 1, 15);
    px(g, P.floorDark, 15, 0, 1, 16);
    px(g, P.floorDark, 0, 15, 16, 1);
    px(g, P.floorDark, 5, 6);
    px(g, P.floorDark, 10, 11);
  },
  carpet(g, P) {
    px(g, P.carpet, 0, 0, TILE, TILE);
    for (const [x, y] of [[3, 3], [11, 3], [7, 7], [3, 11], [11, 11]]) {
      px(g, P.carpetGold, x, y, 2, 2);
    }
    for (const [x, y] of [[7, 1], [1, 7], [13, 7], [7, 13]]) px(g, P.carpetDark, x, y, 2, 2);
  },
  wall(g, P) {
    px(g, P.wall, 0, 0, TILE, TILE);
    px(g, P.wallDark, 0, 7, 16, 1);
    px(g, P.wallDark, 0, 15, 16, 1);
    px(g, P.wallLight, 0, 0, 16, 1);
    px(g, P.wallLight, 0, 8, 16, 1);
    // Offset brick joints
    for (const x of [7, 15]) px(g, P.wallDark, x, 0, 1, 7);
    for (const x of [3, 11]) px(g, P.wallDark, x, 8, 1, 7);
  },
  // A wall with a faint crack: easy to miss unless you're looking for it.
  crackedWall(g, P) {
    GROUND.wall(g, P);
    for (const [x, y] of [[9, 1], [8, 2], [8, 3], [9, 4], [10, 5], [10, 6], [9, 9], [8, 10], [9, 11], [10, 12], [11, 13]]) {
      px(g, P.wallDark, x, y);
    }
  },
  door(g, P) {
    GROUND.wall(g, P);
    px(g, P.wallDark, 2, 2, 12, 14);
    px(g, P.door, 3, 3, 10, 13);
    px(g, P.door, 4, 2, 8, 1);
    px(g, P.door, 5, 1, 6, 1);
  },
  lockedDoor(g, P) {
    px(g, P.wallDark, 0, 0, TILE, TILE);
    px(g, P.iron, 1, 0, 14, 16);
    px(g, P.ironDark, 1, 4, 14, 2);
    px(g, P.ironDark, 1, 11, 14, 2);
    for (const x of [3, 12]) for (const y of [2, 8, 14]) px(g, P.stoneMid, x, y);
    px(g, P.gold, 6, 6, 4, 5);
    px(g, P.ironDark, 7, 7, 2, 2);
    px(g, P.ironDark, 7, 9, 2, 1);
  },
  roof(g, P) {
    px(g, P.roof, 0, 0, TILE, TILE);
    for (let row = 0; row < 4; row++) {
      const y = row * 4;
      px(g, P.roofLight, 0, y, 16, 1);
      px(g, P.roofDark, 0, y + 3, 16, 1);
      const offset = row % 2 ? 4 : 0;
      for (let x = offset; x < 16; x += 8) px(g, P.roofDark, x, y, 1, 3);
    }
  },
  houseWall(g, P) {
    px(g, P.plaster, 0, 0, TILE, TILE);
    px(g, P.timber, 0, 0, 16, 2);
    px(g, P.timber, 0, 14, 16, 2);
    px(g, P.timber, 0, 0, 2, 16);
    px(g, P.timber, 14, 0, 2, 16);
    px(g, P.plasterDark, 2, 2, 12, 1);
  },
  window(g, P) {
    GROUND.houseWall(g, P);
    px(g, P.timber, 3, 3, 10, 10);
    px(g, P.glass, 4, 4, 8, 8);
    px(g, P.glassLight, 5, 5, 2, 2);
    px(g, P.timber, 7, 4, 2, 8);
    px(g, P.timber, 4, 7, 8, 2);
  },
  houseDoor(g, P) {
    GROUND.houseWall(g, P);
    px(g, P.timber, 3, 2, 10, 14);
    px(g, P.wood, 4, 3, 8, 13);
    px(g, P.woodDark, 7, 3, 1, 13);
    px(g, P.gold, 10, 9, 1, 2);
  },
  // Wind-blown ridges on the ground color.
  dune(g, P) {
    GROUND.grass(g, P);
    for (let x = 0; x < TILE; x++) {
      for (const base of [5, 12]) {
        const y = base + Math.round(1.5 * Math.sin(((x + base) / TILE) * Math.PI * 2));
        px(g, P.grassLight, x, y);
        px(g, P.grassDark, x, y + 1);
      }
    }
  },
  quicksand(g, P) {
    px(g, P.sand, 0, 0, TILE, TILE);
    // A slow spiral of darker sand.
    for (const [x, y] of [[7, 7], [8, 7], [9, 8], [9, 9], [8, 10], [6, 10], [5, 9], [4, 7], [5, 5], [7, 4], [10, 4], [12, 6], [12, 9]]) {
      px(g, P.sandDark, x, y);
    }
    for (const [x, y] of [[2, 2], [13, 13], [2, 13], [14, 2]]) px(g, P.sandLight, x, y);
  },
  ice(g, P) {
    px(g, P.ice, 0, 0, TILE, TILE);
    px(g, P.iceDark, 0, 15, 16, 1);
    px(g, P.iceDark, 15, 0, 1, 16);
    for (let i = 0; i < 5; i++) px(g, P.iceLight, 3 + i, 9 - i); // shine streaks
    for (let i = 0; i < 3; i++) px(g, P.iceLight, 9 + i, 13 - i);
    for (const [x, y] of [[11, 3], [12, 4], [12, 5], [4, 12]]) px(g, P.iceDark, x, y); // cracks
  },
  gate(g, P) {
    paintGate(g, P, false);
  },
  gateSealed(g, P) {
    paintGate(g, P, true);
  },
  counter(g, P) {
    px(g, P.wood, 0, 0, TILE, TILE);
    px(g, P.woodLight, 0, 0, 16, 4);
    px(g, P.woodDark, 0, 4, 16, 1);
    for (const x of [3, 7, 11, 15]) px(g, P.woodDark, x, 5, 1, 10);
    px(g, P.woodShadow, 0, 15, 16, 1);
  },
};

// A heavy stone gate with one round socket per tile; a filled socket holds a glowing seal.
function paintGate(g, P, sealed) {
  px(g, P.stoneDark, 0, 0, TILE, TILE);
  px(g, P.stoneMid, 1, 0, 14, 16);
  px(g, P.stone, 1, 0, 14, 1);
  for (const y of [5, 11]) px(g, P.stoneDark, 1, y, 14, 1);
  px(g, P.stoneDark, 4, 4, 8, 8); // socket rim
  px(g, P.outline, 5, 5, 6, 6);
  if (sealed) {
    px(g, P.gold, 5, 5, 6, 6);
    px(g, P.fireLight, 6, 6, 4, 4);
    px(g, '#ffffff', 6, 6, 2, 1);
  }
}

function paintLava(g, P, frame) {
  px(g, P.lava, 0, 0, TILE, TILE);
  for (const [x, y, w] of [[2, 3, 4], [9, 6, 5], [4, 11, 3], [11, 13, 3]]) {
    const dx = frame ? 1 : 0;
    px(g, P.lavaLight, (x + dx) % 14, y, w, 1);
    px(g, P.lavaDark, (x + 2 - dx) % 14, y + 2, w - 1, 1);
  }
  px(g, P.lavaLight, frame ? 12 : 6, frame ? 2 : 9, 2, 2);
}

// Vent frames: 0 idle, 1–2 warning glow (pulsing), 3–4 eruption.
function paintVent(g, P, frame) {
  px(g, P.ventDark, 0, 0, TILE, TILE);
  px(g, P.vent, 1, 1, 14, 14);
  const slit = frame === 0 ? P.ventDark : frame === 1 ? P.fireRed : P.fire;
  for (const y of [4, 7, 10]) px(g, slit, 3, y, 10, 2);
  if (frame >= 3) {
    // Flames bursting up out of the grate.
    const flicker = frame === 3 ? 0 : 1;
    px(g, P.fireRed, 2, 2, 12, 12);
    px(g, P.fire, 3, 1 + flicker, 10, 12);
    px(g, P.fireLight, 5, 3 + flicker, 6, 8);
    px(g, '#ffffff', 7, 6 + flicker, 2, 3);
  }
}

function paintWater(g, P, frame) {
  px(g, P.water, 0, 0, TILE, TILE);
  for (const [y, s] of [[2, 1], [6, 9], [10, 4], [13, 12]]) {
    const x0 = s + frame * 3;
    for (let i = 0; i < 4; i++) px(g, P.waterLight, (x0 + i) % 16, y);
    for (let i = 1; i < 3; i++) px(g, P.waterDark, (x0 + i) % 16, y + 1);
  }
}

// Overlay art: [frames, colors(P)]. Multi-frame overlays animate.
const leafColors = (P) => ({ k: P.outline, L: P.leaf, l: P.leafLight, D: P.leafDark, t: P.trunk });
const OVERLAYS = {
  tree: [[TREE], leafColors],
  bush: [[BUSH], leafColors],
  rock: [[ROCK], (P) => ({ k: P.outline, r: P.rockLight, R: P.rock, d: P.rockDark })],
  sign: [[SIGN], (P) => ({ k: P.outline, w: P.wood, d: P.woodDark, W: P.woodShadow })],
  fence: [[FENCE], (P) => ({ k: P.outline, w: P.wood, W: P.woodDark })],
  pillar: [[PILLAR], (P) => ({ k: P.outline, s: P.stone, S: P.stoneMid, d: P.stoneDark })],
  statue: [[GARGOYLE[0]], (P) => ({ k: P.outline, g: P.stone, G: P.stoneMid, D: P.stoneDark, e: P.stoneDark, w: P.stone })],
  cactus: [[CACTUS], (P) => ({ k: P.outline, g: P.cactus, G: P.cactusDark, l: P.cactusLight })],
  brazier: [BRAZIER, (P) => ({ k: P.outline, I: P.iron, i: P.ironDark, r: P.fireRed, f: P.fire, F: P.fireLight })],
};

function buildTileSet(paletteName) {
  const P = AREA_PALETTES[paletteName];
  const set = {};
  for (const [name, paint] of Object.entries(GROUND)) {
    set[name] = [makeCanvas(TILE, TILE, (g) => paint(g, P))];
  }
  set.water = [0, 1, 2, 3].map((f) => makeCanvas(TILE, TILE, (g) => paintWater(g, P, f)));
  set.lava = [0, 1].map((f) => makeCanvas(TILE, TILE, (g) => paintLava(g, P, f)));
  set.vent = [0, 1, 2, 3, 4].map((f) => makeCanvas(TILE, TILE, (g) => paintVent(g, P, f)));
  for (const [name, [frames, colors]] of Object.entries(OVERLAYS)) {
    set[name] = frames.map((art) => makeSprite(art, colors(P)));
  }
  return set;
}

const tileSetCache = {};
export function getTileSet(paletteName) {
  return (tileSetCache[paletteName] ??= buildTileSet(paletteName));
}

const ANIM_FPS = { water: 2, brazier: 6, lava: 2 };

function frameOf(set, name, time) {
  const frames = set[name];
  return frames[Math.floor(time * (ANIM_FPS[name] ?? 1)) % frames.length];
}

function ventFrame(set, tx, ty, time) {
  const { state, t } = ventPhase(tx, ty, time);
  if (state === 'idle') return set.vent[0];
  const fast = Math.floor(t * (state === 'glow' ? 8 : 14)) % 2;
  return set.vent[(state === 'glow' ? 1 : 3) + fast];
}

// (tx, ty): the tile's coordinates in the room, for tiles that animate per position (vents).
export function drawTile(ctx, set, ch, groundCh, x, y, time, tx = 0, ty = 0) {
  const def = TILES[ch] ?? TILES['.'];
  if (def.name === 'vent') {
    ctx.drawImage(ventFrame(set, tx, ty, time), x, y);
    return;
  }
  if (def.overlay) {
    const ground = TILES[groundCh] ?? TILES['.'];
    ctx.drawImage(frameOf(set, ground.name, time), x, y);
  }
  ctx.drawImage(frameOf(set, def.name, time), x, y);
}
