// Damage formulas from the design spec.

export function playerAttackDamage(player) {
  return player.baseDamage + player.swordBonus;
}

export function damageToPlayer(enemyAttack, playerDefense) {
  return Math.max(1, enemyAttack - playerDefense);
}
