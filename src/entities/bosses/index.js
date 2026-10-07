// Boss registry. Rooms name their boss with `boss: '<id>'`.
// Each boss's config may have `final: true` (beating it ends the game), and for mid-bosses
// `gold` and `drop: { spell, seal }`: the first win leaves a reward chest holding them. Once that
// chest is opened, the boss is back whenever you re-enter its room, paying only `rematchGold`.
import { BOSS, PHARAOH, FROST_WYRM } from '../../config.js';
import { DarkLord } from './darkLord.js';
import { Pharaoh } from './pharaoh.js';
import { FrostWyrm } from './frostWyrm.js';

const BOSS_CLASSES = {
  pharaoh: Pharaoh,
  frostWyrm: FrostWyrm,
  darkLord: DarkLord,
};

const BOSS_CONFIGS = {
  pharaoh: PHARAOH,
  frostWyrm: FROST_WYRM,
  darkLord: BOSS,
};

export function createBoss(id) {
  const Cls = BOSS_CLASSES[id];
  if (!Cls) throw new Error(`Unknown boss "${id}"`);
  return new Cls(Cls.spawnAt.x, Cls.spawnAt.y);
}

export function isBossId(id) {
  return Object.hasOwn(BOSS_CONFIGS, id);
}

// The reward chest a boss leaves after its first defeat (its id goes in openedChests once opened).
export const rewardChestId = (bossId) => `boss_${bossId}`;

// What's in a boss's reward chest, or null if it has none (the Dark Lord).
export function rewardContents(bossId) {
  const cfg = BOSS_CONFIGS[bossId];
  if (cfg.final || !(cfg.gold || cfg.drop)) return null;
  return { gold: cfg.gold, spell: cfg.drop?.spell, seal: cfg.drop?.seal };
}

// Castle seals the hero holds: one per opened reward chest with a seal in it.
export function sealCount(player) {
  return Object.keys(BOSS_CONFIGS).filter((id) => BOSS_CONFIGS[id].drop?.seal && player.openedChests.includes(rewardChestId(id))).length;
}
