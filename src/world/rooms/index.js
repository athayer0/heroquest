import { VILLAGE_ROOMS } from './village.js';
import { MEADOW_ROOMS } from './meadow.js';
import { FOREST_ROOMS } from './forest.js';
import { DESERT_ROOMS } from './desert.js';
import { FRONTIER_VILLAGE_ROOMS } from './villages.js';
import { CAVE_ROOMS } from './cave.js';
import { PEAKS_ROOMS } from './peaks.js';
import { CASTLE_ROOMS } from './castle.js';
import { DEBUG_ROOMS } from './debug.js';

// The route is built from segments, each on its own part of the world grid (rooms inside a
// segment link up automatically by `pos`). These links join the segments, so a new area
// slots in by changing them: [room, edge, room on the other side].
const LINKS = [
  ['forest_cave_mouth', 'e', 'desert_west'],
  ['desert_east', 'e', 'cave_entrance'],
  ['cave_exit', 'n', 'peaks_base'],
  ['peaks_gate', 'n', 'castle_hall'],
];

const OPPOSITE = { n: 's', s: 'n', e: 'w', w: 'e' };

function link(rooms) {
  const byId = new Map(rooms.map((r) => [r.id, r]));
  for (const [from, dir, to] of LINKS) {
    const a = byId.get(from);
    const b = byId.get(to);
    a.neighbors = { ...a.neighbors, [dir]: to };
    b.neighbors = { ...b.neighbors, [OPPOSITE[dir]]: from };
  }
  return rooms;
}

export const ALL_ROOMS = link([...VILLAGE_ROOMS, ...MEADOW_ROOMS, ...FOREST_ROOMS, ...DESERT_ROOMS, ...CAVE_ROOMS, ...PEAKS_ROOMS, ...CASTLE_ROOMS, ...FRONTIER_VILLAGE_ROOMS, ...DEBUG_ROOMS]);

export const START_ROOM = 'village_square';
