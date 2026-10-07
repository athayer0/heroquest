// Skills: Blade, Armor, Evasion, Destruction and Restoration level up through use.
// Every point of skill XP also goes into the hero's XP the moment it's earned.
// Perks are bought with perk points (one per hero level) once their skill is high enough.
import { SKILLS, SKILL_XP, LEVELING, PERKS } from '../config.js';
import { addXp } from './leveling.js';

export const SKILL_IDS = Object.keys(SKILLS);

export function newSkills() {
  return Object.fromEntries(SKILL_IDS.map((id) => [id, { level: 1, xp: 0 }]));
}

export function skillXpToNext(level) {
  return SKILL_XP.xpBase + SKILL_XP.xpPerLevel * level;
}

export function isSkillMaxed(skill) {
  return skill.level >= SKILL_XP.maxLevel;
}

// Adds XP to one skill and the same amount (× skillXpShare) to the hero.
// Returns { skillLevels, heroLevels }: how many levels each gained.
export function addSkillXp(player, id, amount) {
  if (!(amount > 0)) return { skillLevels: 0, heroLevels: 0 };
  const skill = player.skills[id];
  let skillLevels = 0;
  if (!isSkillMaxed(skill)) {
    skill.xp += amount;
    while (!isSkillMaxed(skill) && skill.xp >= skillXpToNext(skill.level)) {
      skill.xp -= skillXpToNext(skill.level);
      skill.level++;
      skillLevels++;
    }
    if (isSkillMaxed(skill)) skill.xp = 0;
  }
  const heroLevels = addXp(player, amount * LEVELING.skillXpShare);
  return { skillLevels, heroLevels };
}

// ---------- Perks ----------

// perk id → { skillId, ...perk }. Perk ids are unique across all skills.
export const PERK_INDEX = Object.fromEntries(
  Object.entries(PERKS).flatMap(([skillId, perks]) => Object.entries(perks).map(([id, perk]) => [id, { skillId, ...perk }])),
);

export function hasPerk(player, id) {
  return player.perks.includes(id);
}

// Sum of one effect across every owned perk (0 if none has it).
export function perkValue(player, key) {
  let total = 0;
  for (const id of player.perks) total += PERK_INDEX[id]?.effects?.[key] ?? 0;
  return total;
}

// 'owned' | 'available' | 'locked' (skill level too low) | 'nopoints'
export function perkState(player, id) {
  const perk = PERK_INDEX[id];
  if (hasPerk(player, id)) return 'owned';
  if (player.skills[perk.skillId].level < perk.skillLevel) return 'locked';
  return player.perkPoints > 0 ? 'available' : 'nopoints';
}

// Returns true if the perk was bought.
export function buyPerk(player, id) {
  if (perkState(player, id) !== 'available') return false;
  player.perkPoints--;
  player.perks.push(id);
  return true;
}

// ---------- Passive bonuses ----------

// Percent bonus that grows with a skill's level (none at level 1).
const pct = (player, id, perLevel) => (perLevel * (player.skills[id].level - 1)) / 100;

// Passive bonuses from skill levels (shown on the Skills screen).
export const skillBonus = {
  swordDamageMult: (p) => 1 + pct(p, 'blade', SKILLS.blade.damagePctPerLevel),
  defense: (p) => Math.floor(p.skills.armor.level / SKILLS.armor.levelsPerDefense),
  rollCooldownMult: (p) => Math.max(0, 1 - pct(p, 'evasion', SKILLS.evasion.rollCooldownPctPerLevel)),
  spellDamageMult: (p) => 1 + pct(p, 'destruction', SKILLS.destruction.damagePctPerLevel),
  healMult: (p) => 1 + pct(p, 'restoration', SKILLS.restoration.healPctPerLevel),
  manaRegenMult: (p) => 1 + pct(p, 'restoration', SKILLS.restoration.manaRegenPctPerLevel),
};

// Skill bonuses combined with perks: what gameplay code uses.
const perkPct = (p, key) => perkValue(p, key) / 100;
export const heroBonus = {
  swordDamageMult: (p) => skillBonus.swordDamageMult(p) + perkPct(p, 'swordDamagePct'),
  swordArcDegrees: (p) => perkValue(p, 'swordArcDegrees'),
  critChance: (p) => perkPct(p, 'critChancePct'),
  defense: (p) => {
    const lowHp = p.hp < p.maxHp * PERKS.armor.lastStand.below;
    return skillBonus.defense(p) + perkValue(p, 'defense') + (lowHp ? perkValue(p, 'lowHpDefense') : 0);
  },
  knockbackMult: (p) => Math.max(0, 1 + perkPct(p, 'knockbackPct')),
  thorns: (p) => perkPct(p, 'thornsPct'),
  rollCooldownMult: (p) => skillBonus.rollCooldownMult(p) * Math.max(0, 1 + perkPct(p, 'rollCooldownPct')),
  rollSpeedMult: (p) => 1 + perkPct(p, 'rollDistancePct'),
  rollsBeforeCooldown: (p) => 1 + perkValue(p, 'extraRolls'),
  spellDamageMult: (p) => skillBonus.spellDamageMult(p),
  destructionCostMult: (p) => Math.max(0, 1 + perkPct(p, 'destructionCostPct')),
  boltPierce: (p) => perkValue(p, 'boltPierce'),
  healMult: (p) => skillBonus.healMult(p),
  manaRegenMult: (p) => skillBonus.manaRegenMult(p) + perkPct(p, 'manaRegenPct'),
  potionHealMult: (p) => 1 + perkPct(p, 'potionHealPct'),
  regenHpPerSec: (p) => perkValue(p, 'regenHpPerSec'),
};

// Short description of a skill's current passive bonus, e.g. "SWORD DMG +18%".
export function bonusText(player, id) {
  const p100 = (mult) => Math.round(Math.abs(mult - 1) * 100);
  switch (id) {
    case 'blade': return `SWORD DMG +${p100(skillBonus.swordDamageMult(player))}%`;
    case 'armor': return `DEFENSE +${skillBonus.defense(player)}`;
    case 'evasion': return `ROLL WAIT -${p100(skillBonus.rollCooldownMult(player))}%`;
    case 'destruction': return `SPELL DMG +${p100(skillBonus.spellDamageMult(player))}%`;
    case 'restoration': return `HEAL+${p100(skillBonus.healMult(player))}% MP+${p100(skillBonus.manaRegenMult(player))}%`;
    default: return '';
  }
}
