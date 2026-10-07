// Turns a defeated enemy into drops.
import { DROPS } from '../config.js';
import { Pickup } from '../entities/pickup.js';
import { randInt, chance } from '../util.js';

export function rollDrops(enemy) {
  const { x, y } = enemy.center;
  const drops = [];

  // Gold is split across 1–3 coins so bigger rewards look bigger.
  const gold = randInt(enemy.stats.gold[0], enemy.stats.gold[1]);
  const coins = gold <= 3 ? 1 : gold <= 8 ? 2 : 3;
  for (let i = 0; i < coins; i++) {
    const value = Math.floor(gold / coins) + (i < gold % coins ? 1 : 0);
    drops.push(new Pickup('coin', x, y, value));
  }

  if (chance(DROPS.heartChance)) drops.push(new Pickup('heart', x, y, DROPS.heartHeal));
  return drops;
}
