import { Slime } from './slime.js';
import { Bat } from './bat.js';
import { Goblin } from './goblin.js';
import { Skeleton } from './skeleton.js';
import { Knight } from './knight.js';

const ENEMY_CLASSES = {
  slime: Slime,
  bat: Bat,
  goblin: Goblin,
  skeleton: Skeleton,
  knight: Knight,
};

export function createEnemy(type, x, y) {
  const Cls = ENEMY_CLASSES[type];
  if (!Cls) throw new Error(`Unknown enemy type "${type}"`);
  return new Cls(x, y);
}
