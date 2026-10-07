// Small item and spell icons shared by the HUD and the shop.
import { makeSprite } from './sprites.js';
import { POTION, SPELL_FIREBOLT, SPELL_FROST, SPELL_LIGHTNING, SPELL_HEAL, SPELL_WARD, TOME } from './art.js';

const K = '#1b1b23';

const SPELL_ART = {
  firebolt: { art: SPELL_FIREBOLT, colors: { k: K, r: '#c8301a', o: '#f07a1a', y: '#ffd040', w: '#fff8d0' } },
  frostShard: { art: SPELL_FROST, colors: { k: K, b: '#8ad0f8', w: '#ffffff' } },
  chainLightning: { art: SPELL_LIGHTNING, colors: { k: K, y: '#ffe860' } },
  heal: { art: SPELL_HEAL, colors: { k: K, g: '#5ad86a', G: '#2a9a4a', w: '#d8ffd8' } },
  ward: { art: SPELL_WARD, colors: { k: K, b: '#6ab0f0', B: '#3a6ab0', w: '#e0f4ff', y: '#ffe070' } },
};

// Tome cover colors by spell school.
const TOME_COVER = {
  destruction: { b: '#a83a2a', B: '#6a2018' },
  restoration: { b: '#3a8a4a', B: '#20582c' },
};

const cache = new Map();
const cached = (key, build) => {
  if (!cache.has(key)) cache.set(key, build());
  return cache.get(key);
};

// 12x12
export function getSpellIcon(id) {
  return cached(`spell-${id}`, () => makeSprite(SPELL_ART[id].art, SPELL_ART[id].colors));
}

// 12x12
export function getTomeIcon(school) {
  return cached(`tome-${school}`, () => makeSprite(TOME, { k: K, ...TOME_COVER[school], g: '#c89a30', y: '#ffe070', w: '#f4f0e0' }));
}

// 7x9, the health potion's bottle filled with blue.
export function getManaPotionIcon() {
  return cached('manaPotion', () => makeSprite(POTION, { k: K, c: '#a0703a', g: '#c8ecff', r: '#3a6ae8', w: '#ffffff' }));
}
