// The room graph: builds Room objects from definitions, links neighbors and sanity-checks the layout.
//
// Rooms with `pos: [gx, gy]` are linked automatically to the room next to them on the
// grid wherever this room's edge has an opening. Rooms may also list `neighbors` explicitly.
import { ROOM_COLS, ROOM_ROWS, EDGE_VEC } from '../constants.js';
import { isSolidChar } from './tiles.js';
import { Room } from './room.js';

const OPPOSITE = { n: 's', s: 'n', e: 'w', w: 'e' };

export class World {
  constructor(roomDefs, areas) {
    this.rooms = new Map();
    for (const def of roomDefs) {
      const area = areas[def.area];
      if (!area) console.warn(`Room ${def.id}: unknown area "${def.area}"`);
      if (this.rooms.has(def.id)) console.warn(`Duplicate room id "${def.id}"`);
      this.rooms.set(def.id, new Room(def, area));
    }
    this.linkByPosition();
    this.validate();
  }

  get(id) {
    const room = this.rooms.get(id);
    if (!room) throw new Error(`Unknown room "${id}"`);
    return room;
  }

  linkByPosition() {
    const byPos = new Map();
    for (const room of this.rooms.values()) {
      if (room.def.pos) byPos.set(room.def.pos.join(','), room);
    }
    for (const room of this.rooms.values()) {
      if (!room.def.pos) continue;
      const [gx, gy] = room.def.pos;
      for (const [dir, v] of Object.entries(EDGE_VEC)) {
        if (room.neighbors[dir] || !edgeIsOpen(room, dir)) continue;
        const other = byPos.get(`${gx + v.x},${gy + v.y}`);
        if (other) room.neighbors[dir] = other.id;
      }
    }
  }

  // Dev-time checks: sizes, links, matching edge openings, and that signs/NPCs/spawns sit on sensible tiles.
  validate() {
    for (const room of this.rooms.values()) {
      const { map, id, def } = room;
      if (map.length !== ROOM_ROWS) console.warn(`Room ${id}: ${map.length} rows, expected ${ROOM_ROWS}`);
      map.forEach((row, i) => {
        if (row.length !== ROOM_COLS) console.warn(`Room ${id} row ${i}: ${row.length} cols, expected ${ROOM_COLS}`);
      });

      for (const e of def.enemies ?? []) {
        if (isSolidChar(room.tileAt(e.x, e.y))) console.warn(`Room ${id}: ${e.type} spawns inside a solid tile at ${e.x},${e.y}`);
      }
      for (const n of def.npcs ?? []) {
        if (isSolidChar(room.tileAt(n.x, n.y))) console.warn(`Room ${id}: NPC ${n.name} stands in a solid tile at ${n.x},${n.y}`);
      }
      map.forEach((row, y) => [...row].forEach((ch, x) => {
        if (ch === 'S' && !def.signs?.some((s) => s.x === x && s.y === y)) console.warn(`Room ${id}: sign at ${x},${y} has no text`);
      }));
      for (const s of def.signs ?? []) {
        if (room.tileAt(s.x, s.y) !== 'S') console.warn(`Room ${id}: sign text at ${s.x},${s.y} but no sign tile there`);
      }

      for (const dir of Object.keys(EDGE_VEC)) {
        if (edgeIsOpen(room, dir) && !room.neighbors[dir]) console.warn(`Room ${id}: open ${dir} edge leads nowhere`);
      }

      for (const [dir, otherId] of Object.entries(room.neighbors)) {
        const other = this.rooms.get(otherId);
        if (!other) { console.warn(`Room ${id}: neighbor ${dir} "${otherId}" missing`); continue; }
        if (other.neighbors[OPPOSITE[dir]] !== id) console.warn(`Room ${id} → ${otherId} (${dir}) is not linked back`);

        const n = dir === 'n' || dir === 's' ? ROOM_COLS : ROOM_ROWS;
        for (let i = 0; i < n; i++) {
          const [a, b] = edgePair(room, other, dir, i);
          if (isSolidChar(a) !== isSolidChar(b)) {
            console.warn(`Edge mismatch ${id} (${dir}) ↔ ${otherId} at index ${i}: '${a}' vs '${b}'`);
          }
        }
      }
    }
  }
}

function edgeTiles(room, dir) {
  const { map } = room;
  switch (dir) {
    case 'n': return [...map[0]];
    case 's': return [...map[ROOM_ROWS - 1]];
    case 'w': return map.map((row) => row[0]);
    case 'e': return map.map((row) => row[ROOM_COLS - 1]);
  }
}

function edgeIsOpen(room, dir) {
  return edgeTiles(room, dir).some((ch) => !isSolidChar(ch));
}

function edgePair(room, other, dir, i) {
  return [edgeTiles(room, dir)[i], edgeTiles(other, OPPOSITE[dir])[i]];
}
