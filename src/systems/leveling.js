// XP and level-ups. `player.xp` is progress toward the next level; extra XP carries over.
// XP comes from kills and from skill XP (see skills.js), so it can be fractional.
import { LEVELING } from '../config.js';

export function xpToNext(level) {
  const steep = Math.max(0, level - LEVELING.steepFrom) * LEVELING.steepPctPerLevel;
  return Math.round(LEVELING.xpPerLevel * level * (1 + steep / 100));
}

export function isMaxLevel(player) {
  return player.level >= LEVELING.maxLevel;
}

// Adds XP and returns how many levels were gained (can be more than one).
// Each level also gives a perk point.
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
  player.perkPoints += gained;
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
    id: 'mana',
    label: `+${LEVELING.manaChoice} MAX MANA`,
    preview: (p) => `${p.maxMana} > ${p.maxMana + LEVELING.manaChoice}`,
    apply: (p) => { p.maxMana += LEVELING.manaChoice; },
  },
];

// Applies the chosen bonus, then fully restores HP and mana.
export function applyLevelChoice(player, choice) {
  choice.apply(player);
  player.hp = player.maxHp;
  player.mana = player.maxMana;
}
