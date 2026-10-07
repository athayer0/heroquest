// XP and level-ups. `player.xp` is progress toward the next level; extra XP carries over.
import { LEVELING } from '../config.js';

export function xpToNext(level) {
  return LEVELING.xpPerLevel * level;
}

export function isMaxLevel(player) {
  return player.level >= LEVELING.maxLevel;
}

// Adds XP and returns how many levels were gained (can be more than one).
export function addXp(player, amount) {
  if (isMaxLevel(player)) return 0;
  player.xp += amount;
  let gained = 0;
  while (!isMaxLevel(player) && player.xp >= xpToNext(player.level)) {
    player.xp -= xpToNext(player.level);
    player.level++;
    gained++;
  }
  if (isMaxLevel(player)) player.xp = 0;
  return gained;
}

export const LEVEL_CHOICES = [
  {
    id: 'hp',
    label: `+${LEVELING.hpChoice} MAX HP`,
    preview: (p) => `${p.maxHp} > ${p.maxHp + LEVELING.hpChoice}`,
    apply: (p) => { p.maxHp += LEVELING.hpChoice; },
  },
  {
    id: 'damage',
    label: `+${LEVELING.damageChoice} DAMAGE`,
    preview: (p) => `${p.baseDamage} > ${p.baseDamage + LEVELING.damageChoice}`,
    apply: (p) => { p.baseDamage += LEVELING.damageChoice; },
  },
];

// Applies the chosen bonus, then fully heals.
export function applyLevelChoice(player, choice) {
  choice.apply(player);
  player.hp = player.maxHp;
}
