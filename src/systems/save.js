// Save system: two save files in localStorage. Saving happens whenever the hero enters the Village
// or a save-point room (the merchant's camp), and once more after the ending. A file is only
// replaced when the player starts a new game in it.
// Every storage access is wrapped, since storage can be unavailable (private windows, blocked
// site data); the game simply runs without saves in that case.
import { SWORDS, ARMOR, POTION, MANA_POTION, SPELLS, LEVELING, SKILL_XP } from '../config.js';
import { SKILL_IDS, newSkills, PERK_INDEX } from './skills.js';
import { isBossId, rewardChestId, rewardContents } from '../entities/bosses/index.js';

export const SAVE_SLOTS = 2;
const LEGACY_KEY = 'heroquest.save'; // the single save from before there were two files
const keyFor = (slot) => `heroquest.save.${slot + 1}`;
// Version 2 added mana, spells, skills, perks, beaten bosses, opened chests, the map and the last town. Version 1 saves still load; applySave fills in the new fields.
const VERSION = 2;
const LOADABLE_VERSIONS = [1, VERSION];

export function newRunStats() {
  return { playTime: 0, kills: 0, deaths: 0, goldCollected: 0 };
}

// location: id of a save-point room to continue from, or null to continue in the Village.
export function saveGame(slot, player, location = null) {
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
    manaPotions: player.manaPotions,
    maxMana: player.maxMana,
    knownSpells: [...player.knownSpells],
    spellIndex: player.spellIndex,
    skills: Object.fromEntries(SKILL_IDS.map((id) => [id, { ...player.skills[id] }])),
    perks: [...player.perks],
    perkPoints: player.perkPoints,
    bossesDefeated: [...player.bossesDefeated],
    openedChests: [...player.openedChests],
    visitedRooms: [...player.visitedRooms],
    lastVillage: player.lastVillage,
    rewardChests: true, // boss rewards come in chests (older saves got them on the spot)
    swordTier: player.swordTier,
    armorTier: player.armorTier,
    cleared: player.cleared,
    stats: { ...player.stats },
  };
  try {
    localStorage.setItem(keyFor(slot), JSON.stringify(data));
    return true;
  } catch {
    return false;
  }
}

export function loadGame(slot) {
  try {
    const raw = localStorage.getItem(keyFor(slot));
    if (!raw) return null;
    const data = JSON.parse(raw);
    return LOADABLE_VERSIONS.includes(data?.version) ? data : null;
  } catch {
    return null;
  }
}

// Every file's save data (null for an empty file). An old single save moves into file 1.
export function loadAllSaves() {
  try {
    const legacy = localStorage.getItem(LEGACY_KEY);
    if (legacy !== null) {
      if (localStorage.getItem(keyFor(0)) === null) localStorage.setItem(keyFor(0), legacy);
      localStorage.removeItem(LEGACY_KEY);
    }
  } catch {
    // no storage
  }
  return Array.from({ length: SAVE_SLOTS }, (_, slot) => loadGame(slot));
}

const num = (v, min, max, fallback) => (Number.isFinite(v) ? Math.max(min, Math.min(max, v)) : fallback);
const int = (v, min, max, fallback) => num(Number.isFinite(v) ? Math.floor(v) : v, min, max, fallback);

// Copies saved values onto a fresh player, clamping anything out of range. Loads at full HP and MP.
export function applySave(player, data) {
  player.level = int(data.level, 1, LEVELING.maxLevel, 1);
  player.xp = num(data.xp, 0, 1e6, 0);
  player.maxHp = int(data.maxHp, 1, 1e4, player.maxHp);
  player.baseDamage = int(data.baseDamage, 1, 1e4, player.baseDamage);
  player.gold = int(data.gold, 0, 1e7, 0);
  player.potions = int(data.potions, 0, POTION.max, 0);
  player.swordTier = int(data.swordTier, 0, SWORDS.length - 1, 0);
  player.armorTier = int(data.armorTier, 0, ARMOR.length - 1, 0);
  player.cleared = data.cleared === true;
  player.manaPotions = int(data.manaPotions, 0, MANA_POTION.max, 0);
  player.maxMana = int(data.maxMana, 1, 1e4, player.maxMana);
  // Version 1 heroes would already have Firebolt from the Elder.
  const spells = data.version === 1 ? ['firebolt'] : Array.isArray(data.knownSpells) ? data.knownSpells : [];
  player.knownSpells = [...new Set(spells.filter((id) => typeof id === 'string' && Object.hasOwn(SPELLS, id)))];
  player.spellIndex = int(data.spellIndex, 0, Math.max(0, player.knownSpells.length - 1), 0);
  player.skills = newSkills();
  for (const id of SKILL_IDS) {
    const saved = data.skills?.[id];
    if (!saved) continue;
    player.skills[id] = { level: int(saved.level, 1, SKILL_XP.maxLevel, 1), xp: num(saved.xp, 0, 1e6, 0) };
  }
  // Saves from before perks existed get a point for every level already gained.
  const perks = Array.isArray(data.perks) ? data.perks : [];
  player.perks = [...new Set(perks.filter((id) => typeof id === 'string' && Object.hasOwn(PERK_INDEX, id)))];
  const ids = (list, valid) => [...new Set((Array.isArray(list) ? list : []).filter((id) => typeof id === 'string' && valid(id)))];
  player.bossesDefeated = ids(data.bossesDefeated, isBossId);
  player.openedChests = ids(data.openedChests, () => true);
  // Saves from before reward chests already got each beaten boss's rewards on the spot.
  if (data.rewardChests !== true) {
    for (const id of player.bossesDefeated) {
      if (rewardContents(id) && !player.openedChests.includes(rewardChestId(id))) player.openedChests.push(rewardChestId(id));
    }
  }
  // Rooms are checked against the world by the play scene. Saves from before the map remember the Village.
  player.visitedRooms = new Set(Array.isArray(data.visitedRooms) ? ids(data.visitedRooms, () => true) : ['village_square']);
  player.lastVillage = typeof data.lastVillage === 'string' ? data.lastVillage : null;
  player.perkPoints = data.perkPoints === undefined ? player.level - 1 : int(data.perkPoints, 0, LEVELING.maxLevel, 0);
  const s = data.stats ?? {};
  player.stats = {
    playTime: Math.max(0, Number(s.playTime) || 0),
    kills: int(s.kills, 0, 1e7, 0),
    deaths: int(s.deaths, 0, 1e7, 0),
    goldCollected: int(s.goldCollected, 0, 1e9, 0),
  };
  player.hp = player.maxHp;
  player.mana = player.maxMana;
}
