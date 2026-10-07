// ============================================================
//  HeroQuest balance config — every tunable number lives here.
// ============================================================

export const PLAYER = {
  maxHp: 30,
  baseDamage: 5,
  defense: 0,
  gold: 0,
  speed: 80, // pixels per second (16px tiles → 5 tiles/sec)
  invincibleTime: 1.0, // seconds of flashing after taking a hit
  knockbackSpeed: 160, // px/s pushed away from whatever hit you
  knockbackTime: 0.15, // seconds the knockback lasts
};

export const SWORD = {
  swingTime: 0.25, // seconds the sword stays out
  cooldown: 0.08, // pause after a swing before the next one
  arcDegrees: 140, // width of the sweep, centered on the facing direction
  reach: 20, // px from the hero's hand that the sweep can hit (blade tip is at 18)
  hitPadding: 2, // extra forgiveness around enemy hitboxes
};

// How enemies react to being hit, and their spawn-in delay (harmless while spawning).
export const ENEMY_HIT = {
  flashTime: 0.15,
  knockbackSpeed: 150,
  knockbackTime: 0.12,
  spawnTime: 0.5,
};

// gold: [min, max] inclusive. Behavior tuning sits next to each enemy's stats.
export const ENEMIES = {
  slime: {
    hp: 10, attack: 3, xp: 5, gold: [2, 4],
    hopInterval: [0.7, 1.3], // seconds resting between hops
    hopTime: 0.35, // seconds in the air
    hopSpeed: 55, // px/s while hopping
  },
  bat: {
    hp: 14, attack: 5, xp: 8, gold: [4, 6],
    speed: 60, // flies over obstacles
    turnInterval: [0.25, 0.6], // seconds between random heading changes
    aimWobble: 1.4, // radians of randomness around the heading toward the player
    restEvery: [2.5, 4], // seconds of flight before perching
    restTime: 0.8, // seconds perched (easy to hit)
  },
  goblin: {
    hp: 22, attack: 6, xp: 12, gold: [6, 10],
    wanderSpeed: 25,
    wanderTurn: [1, 2], // seconds between wander direction changes
    detectRange: 60, // px — starts a charge when the player is this close
    windupTime: 0.45, // telegraph ("!") before charging
    chargeSpeed: 110,
    chargeTime: 0.6,
    recoverTime: 0.7, // dazed after a charge (easy to hit)
    chargeCooldown: 1.2,
  },
  skeleton: {
    hp: 35, attack: 9, xp: 20, gold: [10, 15],
    speed: 28,
    keepDistance: [40, 96], // backs off when closer than min, approaches when farther than max
    throwInterval: [1.6, 2.4],
    windupTime: 0.5, // holds the bone overhead before throwing
    boneSpeed: 85,
  },
  knight: {
    hp: 50, attack: 12, xp: 30, gold: [15, 25],
    speed: 22,
    turnInterval: 0.8, // seconds between re-aiming at the player (lets you circle behind)
    turnPause: 0.25, // stands still briefly after turning
    blockPause: 0.3, // stands still briefly after blocking
    frontArcDegrees: 120, // hits from inside this cone in front are blocked
  },
};

// Final boss. Every attack has a visible wind-up followed by a recovery window.
export const BOSS = {
  name: 'THE DARK LORD',
  hp: 250,
  attack: 15, // projectiles and ground slam
  contactAttack: 12, // touching him (no telegraph, so it hurts a bit less)
  phase2At: 0.5, // phase 2 starts at this fraction of max HP
  hitCooldown: 0.4, // seconds after taking a hit before he can be hurt again (paces the fight)
  introTime: 2.0, // name banner after the door locks; he doesn't act yet
  phaseChangeTime: 1.6, // roar between phases (invulnerable, clears his shots)
  deathTime: 2.4,
  phase1: {
    speed: 20,
    volleyInterval: [2.4, 3.2], // seconds of walking between volleys
    windup: 0.7, // glows and charges an orb before firing
    recover: 0.7, // stands still after firing
    projectileSpeed: 50,
    spreadDegrees: 22, // angle between the three shots
  },
  phase2: {
    speed: 32,
    volleyInterval: [3.0, 3.8],
    windup: 0.55,
    recover: 0.6,
    projectileSpeed: 56,
    spreadDegrees: 22,
    slamInterval: [3.6, 4.6],
    slamWarning: 1.0, // warning circle on the ground before impact
    slamRadius: 34,
    slamRecover: 1.1,
  },
};

export const LEVELING = {
  xpPerLevel: 20, // XP to next level = xpPerLevel × current level
  maxLevel: 10,
  hpChoice: 10, // "+10 Max HP"
  damageChoice: 2, // "+2 Damage"
  menuInputDelay: 0.5, // seconds before the level-up menu accepts input (avoids mashed swings)
  celebrateTime: 1.0, // level-up animation before the menu: HP refills, hero is invincible
  postMenuInvincibleTime: 1.0, // invincibility after the menu closes
};

export const DROPS = {
  heartChance: 0.1, // chance an enemy drops a heart
  heartHeal: 10,
  pickupLifetime: 12, // seconds before an uncollected drop disappears
  pickupBlinkTime: 3, // drops blink during their last N seconds
};

// Shop gear. Index 0 is the starting gear. Buying auto-equips; you can skip tiers
// but can't buy anything at or below your current tier.
export const SWORDS = [
  { id: 'wooden', name: 'Wooden Sword', bonus: 0, price: 0 },
  { id: 'iron', name: 'Iron Sword', bonus: 4, price: 40 },
  { id: 'steel', name: 'Steel Sword', bonus: 8, price: 120 },
  { id: 'hero', name: "Hero's Blade", bonus: 14, price: 300 },
];

export const ARMOR = [
  { id: 'cloth', name: 'Cloth Tunic', defense: 0, price: 0 },
  { id: 'leather', name: 'Leather Armor', defense: 2, price: 35 },
  { id: 'chainmail', name: 'Chainmail', defense: 4, price: 100 },
  { id: 'plate', name: 'Plate Armor', defense: 7, price: 250 },
];

export const POTION = {
  heal: 20,
  price: 15,
  max: 5, // how many you can carry
};

export const DEATH = {
  goldLossFraction: 0.5, // lose this share of current gold, rounded down
  spinTime: 0.9, // hero spins before the screen fades
  fadeTime: 0.6,
  screenTime: 2.2, // how long "You fell..." stays up (any key skips after a moment)
};

export const TIMING = {
  roomSlide: 0.45, // seconds for the flip-screen slide between rooms
};
