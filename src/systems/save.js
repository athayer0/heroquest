// Save system: one slot in localStorage. Saving happens whenever the hero enters the Village
// or a save-point room (the merchant's camp).
// Every storage access is wrapped, since storage can be unavailable (private windows, blocked
// site data); the game simply runs without saves in that case.
import { SWORDS, ARMOR, POTION, LEVELING } from '../config.js';

const KEY = 'heroquest.save';
const VERSION = 1;

export function newRunStats() {
  return { playTime: 0, kills: 0, deaths: 0, goldCollected: 0 };
}

// location: id of a save-point room to continue from, or null to continue in the Village.
export function saveGame(player, location = null) {
  const data = {
    version: VERSION,
    savedAt: Date.now(),
    location,
    level: player.level,
    xp: player.xp,
    maxHp: player.maxHp,
    baseDamage: player.baseDamage,
    gold: player.gold,
    potions: player.potions,
    swordTier: player.swordTier,
    armorTier: player.armorTier,
    stats: { ...player.stats },
  };
  try {
    localStorage.setItem(KEY, JSON.stringify(data));
    return true;
  } catch {
    return false;
  }
}

export function loadGame() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const data = JSON.parse(raw);
    return data?.version === VERSION ? data : null;
  } catch {
    return null;
  }
}

export function hasSave() {
  return loadGame() !== null;
}

export function clearSave() {
  try {
    localStorage.removeItem(KEY);
  } catch {
    // nothing to clear
  }
}

const int = (v, min, max, fallback) => (Number.isFinite(v) ? Math.max(min, Math.min(max, Math.floor(v))) : fallback);

// Copies saved values onto a fresh player, clamping anything out of range. Loads at full HP.
export function applySave(player, data) {
  player.level = int(data.level, 1, LEVELING.maxLevel, 1);
  player.xp = int(data.xp, 0, 1e6, 0);
  player.maxHp = int(data.maxHp, 1, 1e4, player.maxHp);
  player.baseDamage = int(data.baseDamage, 1, 1e4, player.baseDamage);
  player.gold = int(data.gold, 0, 1e7, 0);
  player.potions = int(data.potions, 0, POTION.max, 0);
  player.swordTier = int(data.swordTier, 0, SWORDS.length - 1, 0);
  player.armorTier = int(data.armorTier, 0, ARMOR.length - 1, 0);
  const s = data.stats ?? {};
  player.stats = {
    playTime: Math.max(0, Number(s.playTime) || 0),
    kills: int(s.kills, 0, 1e7, 0),
    deaths: int(s.deaths, 0, 1e7, 0),
    goldCollected: int(s.goldCollected, 0, 1e9, 0),
  };
  player.hp = player.maxHp;
}
