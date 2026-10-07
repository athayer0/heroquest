// Engine constants (not balance numbers — those live in config.js).

export const TILE = 16;
export const ROOM_COLS = 16;
export const ROOM_ROWS = 11;
export const ROOM_W = TILE * ROOM_COLS; // 256
export const ROOM_H = TILE * ROOM_ROWS; // 176
export const HUD_H = 40;
export const SCREEN_W = ROOM_W;
export const SCREEN_H = ROOM_H + HUD_H; // 216

export const STEP = 1 / 60; // fixed update timestep (seconds)

// Debug keys (see PlayScene.debugKeys) are on when the page URL has ?debug or #debug.
// A red DEBUG label in the corner of the play area shows they're on.
export const DEBUG = typeof location !== 'undefined'
  && (new URLSearchParams(location.search).has('debug') || location.hash === '#debug');

// Room-edge directions used by neighbors and transitions.
export const EDGE_VEC = {
  n: { x: 0, y: -1 },
  s: { x: 0, y: 1 },
  e: { x: 1, y: 0 },
  w: { x: -1, y: 0 },
};
