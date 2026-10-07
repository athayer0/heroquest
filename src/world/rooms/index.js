import { VILLAGE_ROOMS } from './village.js';
import { MEADOW_ROOMS } from './meadow.js';
import { FOREST_ROOMS } from './forest.js';
import { CAVE_ROOMS } from './cave.js';
import { CASTLE_ROOMS } from './castle.js';

export const ALL_ROOMS = [...VILLAGE_ROOMS, ...MEADOW_ROOMS, ...FOREST_ROOMS, ...CAVE_ROOMS, ...CASTLE_ROOMS];

export const START_ROOM = 'village_square';
