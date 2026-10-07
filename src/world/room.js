import { TILE, ROOM_COLS, ROOM_ROWS } from '../constants.js';
import { TILES, isSolidChar, getTileSet, drawTile } from './tiles.js';

export class Room {
  constructor(def, area) {
    this.id = def.id;
    this.def = def;
    this.area = area;
    this.map = [...def.map]; // per-visit copy so tiles can change (e.g. the boss door)
    this.ground = def.ground ?? area.ground ?? '.';
    this.neighbors = { ...def.neighbors };
    this.solidRects = []; // extra blockers set by the scene (e.g. NPCs)
  }

  setTile(tx, ty, ch) {
    const row = this.map[ty];
    this.map[ty] = row.slice(0, tx) + ch + row.slice(tx + 1);
  }

  resetTiles() {
    this.map = [...this.def.map];
  }

  tileAt(tx, ty) {
    return this.map[ty]?.[tx];
  }

  // Name of the tile under a point in room pixels (e.g. 'ice'), or null off the map.
  groundAt(x, y) {
    return TILES[this.tileAt(Math.floor(x / TILE), Math.floor(y / TILE))]?.name ?? null;
  }

  // Off-map tiles are open only where a neighbor room exists (unless edgesSolid,
  // which keeps enemies and drops on screen). Flying things pass over low tiles (water).
  isSolidTile(tx, ty, edgesSolid = false, flying = false) {
    const outside = tx < 0 || tx >= ROOM_COLS || ty < 0 || ty >= ROOM_ROWS;
    if (outside && edgesSolid) return true;
    if (tx < 0) return !this.neighbors.w;
    if (tx >= ROOM_COLS) return !this.neighbors.e;
    if (ty < 0) return !this.neighbors.n;
    if (ty >= ROOM_ROWS) return !this.neighbors.s;
    return isSolidChar(this.map[ty][tx], flying);
  }

  rectBlocked(x, y, w, h, edgesSolid = false, flying = false) {
    for (const r of this.solidRects) {
      if (x < r.x + r.w && x + w > r.x && y < r.y + r.h && y + h > r.y) return true;
    }
    const x0 = Math.floor(x / TILE);
    const x1 = Math.floor((x + w - 0.001) / TILE);
    const y0 = Math.floor(y / TILE);
    const y1 = Math.floor((y + h - 0.001) / TILE);
    for (let ty = y0; ty <= y1; ty++) {
      for (let tx = x0; tx <= x1; tx++) {
        if (this.isSolidTile(tx, ty, edgesSolid, flying)) return true;
      }
    }
    return false;
  }

  draw(ctx, ox, oy, time) {
    const set = getTileSet(this.area.palette);
    for (let ty = 0; ty < ROOM_ROWS; ty++) {
      for (let tx = 0; tx < ROOM_COLS; tx++) {
        drawTile(ctx, set, this.map[ty][tx], this.ground, ox + tx * TILE, oy + ty * TILE, time, tx, ty);
      }
    }
  }
}
