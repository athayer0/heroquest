// Damage formulas from the design spec, including skill and perk bonuses.
import { heroBonus } from './skills.js';

// Sword damage with the equipped sword, or with a different sword's bonus (for shop previews).
export function playerAttackDamage(player, swordBonus = player.swordBonus) {
  return Math.round((player.baseDamage + swordBonus) * heroBonus.swordDamageMult(player));
}

export function damageToPlayer(enemyAttack, playerDefense) {
  return Math.max(1, enemyAttack - playerDefense);
}

export function spellDamage(player, spell) {
  return Math.round(spell.damage * heroBonus.spellDamageMult(player));
}

export function spellHealAmount(player, spell) {
  return Math.round(spell.heal * heroBonus.healMult(player));
}
