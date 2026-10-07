import { Slime } from './slime.js';
import { Bat } from './bat.js';
import { Goblin } from './goblin.js';
import { Skeleton } from './skeleton.js';
import { Knight } from './knight.js';
import { Mummy } from './mummy.js';
import { Vulture } from './vulture.js';
import { FireSpirit, IceSpirit } from './spirit.js';
import { Wolf } from './wolf.js';
import { Gargoyle } from './gargoyle.js';

const ENEMY_CLASSES = {
  slime: Slime,
  bat: Bat,
  goblin: Goblin,
  skeleton: Skeleton,
  knight: Knight,
  mummy: Mummy,
  vulture: Vulture,
  fireSpirit: FireSpirit,
  iceSpirit: IceSpirit,
  wolf: Wolf,
  gargoyle: Gargoyle,
};

export function createEnemy(type, x, y) {
  const Cls = ENEMY_CLASSES[type];
  if (!Cls) throw new Error(`Unknown enemy type "${type}"`);
  return new Cls(x, y);
}
