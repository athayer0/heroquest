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
  bufferTime: 0.15, // a click this close to the end of a swing queues the next one
};

// Dodge roll (Space): a quick dash with invincibility for its whole duration.
export const DODGE = {
  speed: 210, // px/s while rolling
  time: 0.26, // seconds the roll lasts (~3.4 tiles)
  cooldown: 0.35, // seconds after a roll ends before the next one
};

// Mana (MP) for casting spells. It refills on its own, after a short pause following each cast.
export const MANA = {
  max: 20,
  regenPerSec: 2,
  regenDelay: 0.75, // seconds after a cast before mana starts refilling
  castCooldown: 0.3, // seconds between casts
  emptyFlashTime: 0.4, // the MP bar flashes this long when a cast is short on mana
};

// Spells, cast with right-click toward the mouse. `price` is set for tomes sold in the shop.
export const SPELLS = {
  firebolt: {
    name: 'Firebolt', school: 'destruction', cost: 5,
    bolt: 'firebolt', element: 'fire', // sets what it hits burning
    damage: 10,
    speed: 150, // px/s
    range: 180, // px before the bolt fizzles
  },
  heal: {
    name: 'Heal', school: 'restoration', cost: 8, price: 40,
    heal: 15,
  },
  frostShard: {
    name: 'Frost Shard', school: 'destruction', cost: 6,
    bolt: 'icebolt', element: 'ice', // chills what it hits (a second chill freezes)
    damage: 6,
    speed: 160,
    range: 180,
  },
  chainLightning: {
    name: 'Chain Lightning', school: 'destruction', cost: 14,
    damage: 12, // to each enemy it hits
    range: 150, // px from the hero to the first target
    aimRadius: 48, // px: the first target is the enemy nearest the mouse, within this far of it
    jumps: 2, // then it jumps to this many more enemies...
    jumpRange: 64, // ...each within this far of the last one hit
  },
  ward: {
    name: 'Ward', school: 'restoration', cost: 10,
    time: 3, // seconds the shield lasts
    radius: 18, // px around the hero where enemy projectiles are destroyed
  },
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
    hp: 10, attack: 3, xp: 5, gold: [3, 5],
    hopInterval: [0.7, 1.3], // seconds resting between hops
    hopTime: 0.35, // seconds in the air
    hopSpeed: 55, // px/s while hopping
  },
  bat: {
    hp: 14, attack: 5, xp: 8, gold: [5, 8],
    speed: 60, // flies over obstacles
    turnInterval: [0.25, 0.6], // seconds between random heading changes
    aimWobble: 1.4, // radians of randomness around the heading toward the player
    restEvery: [2.5, 4], // seconds of flight before perching
    restTime: 0.8, // seconds perched (easy to hit)
  },
  goblin: {
    hp: 22, attack: 6, xp: 12, gold: [8, 12],
    wanderSpeed: 25,
    wanderTurn: [1, 2], // seconds between wander direction changes
    detectRange: 60, // px — starts a charge when the player is this close
    windupTime: 0.45, // telegraph ("!") before charging
    chargeSpeed: 110,
    chargeTime: 0.6,
    recoverTime: 0.7, // dazed after a charge (easy to hit)
    chargeCooldown: 1.2,
  },
  // Lava Cave (Lv 9). Ranged enemies (skeletons and spirits) share the RangedEnemy behavior:
  // they only shoot with a clear line, move to find one, lead their shots and spread out.
  skeleton: {
    hp: 55, attack: 14, xp: 28, gold: [18, 26],
    speed: 30,
    keepDistance: [40, 96], // backs off when closer than min, approaches when farther than max
    shotInterval: [1.0, 1.5],
    windupTime: 0.5, // holds the bone overhead before throwing
    shotSpeed: 100,
    leadFactor: 0.6, // aims this share of the way toward where you'll be when the bone arrives
    repositionTime: 1.6, // seconds spent moving to a spot with a clear shot before trying again
    spacing: 28, // px: keeps at least this far from other ranged enemies
  },
  fireSpirit: {
    hp: 30, attack: 12, xp: 24, gold: [14, 20],
    speed: 34, // floats over lava
    keepDistance: [48, 104],
    shotInterval: [1.8, 2.6],
    windupTime: 0.55, // flares up before shooting
    shotSpeed: 95,
    leadFactor: 0.4,
    repositionTime: 1.6,
    spacing: 28,
    immune: ['fire'], // Firebolt and burning do nothing to it
  },
  // Desert (Lv 6)
  mummy: {
    hp: 30, attack: 8, xp: 15, gold: [10, 16],
    speed: 52, // always walks straight at you; never stops to wander
  },
  vulture: {
    hp: 22, attack: 7, xp: 12, gold: [9, 13],
    speed: 85, // flies over obstacles, like a bat
    turnInterval: [0.2, 0.45],
    aimWobble: 1.0,
    restEvery: [4, 6],
    restTime: 0.6,
    swoopEvery: [3, 5], // seconds between swoops
    screechTime: 0.45, // hovers and screeches before swooping (the telegraph)
    swoopSpeed: 170, // straight-line dive at where you were
    swoopTime: 0.5,
  },
  // Frozen Peaks (Lv 12)
  iceSpirit: {
    hp: 34, attack: 13, xp: 30, gold: [18, 26],
    speed: 34,
    keepDistance: [48, 104],
    shotInterval: [1.8, 2.6],
    windupTime: 0.55,
    shotSpeed: 95,
    leadFactor: 0.4,
    repositionTime: 1.6,
    spacing: 28,
    immune: ['ice'], // Frost Shard and chill do nothing to it
    weak: ['fire'], // Firebolt does double damage
  },
  wolf: {
    hp: 40, attack: 13, xp: 30, gold: [18, 26],
    speed: 46,
    lungeEvery: [2, 3], // seconds between lunges
    lungeRange: 110, // px: only lunges when this close
    crouchTime: 0.4, // crouches (the telegraph), aiming where you are now...
    lungeSpeed: 200, // ...then lunges in a straight line
    lungeTime: 0.35,
    recoverTime: 0.6, // stands still after a lunge (your opening)
  },
  // Castle (Lv 15)
  knight: {
    hp: 80, attack: 18, xp: 40, gold: [20, 30],
    speed: 22,
    turnInterval: 0.8, // seconds between re-aiming at the player (lets you circle behind)
    turnPause: 0.25, // stands still briefly after turning
    blockPause: 0.3, // stands still briefly after blocking
    frontArcDegrees: 120, // hits from inside this cone in front are blocked
  },
  gargoyle: {
    hp: 90, attack: 18, xp: 45, gold: [20, 30],
    speed: 22, // walks steadily at you
    noKnockback: true, // can't be pushed away: dodge it instead
  },
};

// Fire and ice effects, shared by the hero, enemies and bosses (bosses can't be frozen).
// Burn: damage over time; a new fire hit restarts it. Chill: slows, and a second chill while
// slowed freezes for a moment; when the freeze ends the slow is cleared too.
export const STATUS = {
  burn: { time: 3, damagePerSec: 2, tickTime: 0.5 },
  slow: { time: 2.5, speedMult: 0.5 },
  freeze: { time: 1 },
};

// Terrain.
export const TERRAIN = {
  quicksandSpeedMult: 0.5, // walking speed on quicksand (rolling is unaffected)
  iceAccel: 2.5, // how fast your velocity turns toward where you're steering on ice (per second)
  vent: {
    period: 3.2, // seconds between eruptions
    glowTime: 1.0, // warning glow before each eruption
    eruptTime: 0.45,
    attack: 8, // also sets you burning
  },
};

// The sealed gate before the Castle. Each mid-boss drops a seal; the gate opens once you hold
// this many.
export const CASTLE_GATE = {
  sealsRequired: 2,
};

// Desert boss. Sinks into the sand and bursts up under you (a growing shadow marks the spot),
// then throws a fan of cursed bandages. Phase 2 raises mummies and resurfaces faster.
export const PHARAOH = {
  name: 'THE SAND PHARAOH',
  hp: 400,
  attack: 12, // bandages and bursting out of the sand
  contactAttack: 9,
  xp: 150, // hero XP, the first time only
  gold: 120, // in the reward chest, first time only
  rematchGold: 30, // each later win (he's back once the chest is opened)
  bladeXpPerHit: 3,
  burstRadius: 18, // px: stand this far from the shadow's center when he surfaces
  phase2At: 0.5,
  hitCooldown: 0.4,
  introTime: 2.0,
  phaseChangeTime: 1.4,
  deathTime: 2.4,
  drop: { spell: 'ward', seal: true },
  phase1: {
    walkSpeed: 18,
    walkTime: [0.85, 1.25], // seconds above ground before sinking
    sinkTime: 0.35,
    trackTime: 1.0, // the shadow follows you...
    trackSpeed: 70,
    lockTime: 0.45, // ...then stops and flashes before he bursts up
    riseTime: 0.25,
    riseRecover: 0.65, // stands still after surfacing (a good moment to hit him)
    throwWindup: 0.45,
    bandages: 5,
    spreadDegrees: 18, // between neighboring bandages
    bandageSpeed: 70,
    throwRecover: 0.5,
  },
  phase2: {
    walkSpeed: 24,
    walkTime: [0.55, 0.85],
    sinkTime: 0.28,
    trackTime: 0.65,
    trackSpeed: 90,
    lockTime: 0.35,
    riseTime: 0.2,
    riseRecover: 0.55,
    throwWindup: 0.35,
    bandages: 7,
    spreadDegrees: 16,
    bandageSpeed: 78,
    throwRecover: 0.45,
    mummies: 2, // raised at the phase change, and again on surfacing once they're all gone
  },
};

// Peaks boss. Breathes a cone of ice (a cold mist shows the cone first) and sweeps its tail
// at you if you get behind it. Its armored hide halves sword damage, except while it's stunned
// for a moment after each breath. Phase 2 adds falling icicles. It ignores ice entirely.
export const FROST_WYRM = {
  name: 'THE FROST WYRM',
  hp: 600,
  attack: 14, // breath, tail and icicles
  contactAttack: 10,
  xp: 200, // hero XP, the first time only
  gold: 180, // in the reward chest, first time only
  rematchGold: 45, // each later win (it's back once the chest is opened)
  bladeXpPerHit: 3,
  phase2At: 0.5,
  hitCooldown: 0.4,
  introTime: 2.0,
  phaseChangeTime: 1.4,
  deathTime: 2.4,
  drop: { spell: 'frostShard', seal: true },
  immune: ['ice'],
  armorMult: 0.5, // sword damage while not stunned
  speed: 22,
  turnSpeed: 2.2, // radians per second: slow enough to get behind it
  breathEvery: [1.55, 2.25], // seconds of walking between breaths
  breathWindup: 0.65, // the cold mist shows the cone
  breathTime: 0.8,
  breathRange: 76, // px from its mouth
  breathHalfAngle: 30, // degrees each side of where it faces
  stunTime: 1.4, // after each breath: no contact damage, full sword damage
  tailRange: 44, // px: you're "behind" it within this range...
  tailDelay: 0.25, // ...for this long, and it starts a tail sweep
  tailWindup: 0.35,
  tailRadius: 26,
  tailRecover: 0.35,
  phase2: {
    speed: 28,
    breathEvery: [1.25, 1.8],
    icicleEvery: [1.8, 2.4], // a volley of icicles; shadows mark where they'll land
    icicles: 3, // one where you stand, the rest nearby
    icicleSpread: 40,
    icicleFallTime: 0.8,
    icicleRadius: 12,
  },
};

// Final boss. Every attack has a visible wind-up followed by a recovery window.
// Phase 1: walks at you firing fans of orbs. Phase 2: adds a ground slam and wider fans.
// Phase 3: teleports between the room's corners (dark smoke marks where he'll appear), wakes the
// gargoyle statues, and fires homing orbs (destroy them with the sword, a spell, or Ward).
export const BOSS = {
  name: 'THE DARK LORD',
  final: true, // beating him ends the game
  hp: 700,
  attack: 22, // projectiles and ground slam
  contactAttack: 16, // touching him (no telegraph, so it hurts a bit less)
  phase2At: 0.66, // phase 2 starts at this fraction of max HP
  phase3At: 0.33,
  hitCooldown: 0.4, // seconds after a sword hit before the sword can hurt him again (paces the fight)
  bladeXpPerHit: 3, // Blade skill XP per sword hit (other enemies give a share of their kill XP)
  introTime: 2.0, // name banner after the door locks; he doesn't act yet
  phaseChangeTime: 1.6, // roar between phases (invulnerable, clears his shots)
  deathTime: 2.4,
  phase1: {
    speed: 26,
    volleyInterval: [2.0, 2.8], // seconds of walking between volleys
    windup: 0.6, // glows and charges an orb before firing
    recover: 0.6, // stands still after firing
    projectileSpeed: 58,
    shots: 3,
    spreadDegrees: 22, // angle between neighboring shots
  },
  phase2: {
    speed: 34,
    volleyInterval: [1.8, 2.4],
    windup: 0.35,
    recover: 0.4,
    projectileSpeed: 62,
    shots: 5,
    spreadDegrees: 18,
    slamInterval: [2.25, 2.95],
    slamWarning: 0.65, // warning circle on the ground before impact
    slamRadius: 34,
    slamRecover: 0.7,
  },
  phase3: {
    teleportTime: 0.8, // fades out while smoke gathers where he'll appear
    windup: 0.6,
    recover: 0.8,
    homingOrbs: 2,
    homingSpeed: 46,
    homingTurnRate: 1.8, // radians per second: they curve after you, but you can outrun the turn
    homingLife: 6,
    projectileSpeed: 60, // the fan he fires before teleporting again
    shots: 5,
    spreadDegrees: 18,
  },
};

export const LEVELING = {
  // XP to next level = xpPerLevel × level, plus steepPctPerLevel % more for each level above
  // steepFrom (so the Castle's big XP haul right before the Dark Lord doesn't overshoot).
  xpPerLevel: 20,
  steepFrom: 10,
  steepPctPerLevel: 15,
  maxLevel: 30,
  hpChoice: 10, // "+10 Max HP"
  manaChoice: 10, // "+10 Max Mana"
  skillXpShare: 1.0, // every point of skill XP also gives this much hero XP
  menuInputDelay: 0.5, // seconds before the level-up menu accepts input (avoids mashed swings)
  celebrateTime: 1.0, // level-up animation before the menu: HP refills, hero is invincible
  postMenuInvincibleTime: 1.0, // invincibility after the menu closes
};

// Skills level up through use. Each level gives a small passive bonus over a fresh (level 1) skill.
// Skill XP to next level = xpBase + xpPerLevel × current level.
export const SKILL_XP = {
  maxLevel: 50,
  xpBase: 5,
  xpPerLevel: 3,
};

export const SKILLS = {
  blade: {
    name: 'Blade',
    xpPerEnemyXp: 0.25, // landing a sword hit: this × the enemy's kill XP
    damagePctPerLevel: 2, // sword damage
  },
  armor: {
    name: 'Armor',
    xpPerDamage: 0.5, // taking a hit: this × damage taken
    levelsPerDefense: 10, // +1 defense every this many levels
  },
  destruction: {
    name: 'Destruction',
    xpPerDamage: 0.35, // an offensive spell damaging an enemy: this × the damage
    damagePctPerLevel: 3, // spell damage (swords also get better gear; spells only get this)
  },
  restoration: {
    name: 'Restoration',
    xpPerHeal: 0.3, // HP actually restored by spells: this × HP healed
    healPctPerLevel: 2, // healing spells
    manaRegenPctPerLevel: 1, // mana regen
  },
};

// Perks: one perk point per hero level. Each perk needs a minimum level in its skill (the four
// tiers unlock at skill level 5, 10, 15 and 20); perks within a skill don't depend on each other. `effects` are summed across owned perks (see
// perkValue in systems/skills.js); the other numbers tune perks with special behavior.
export const PERKS = {
  blade: {
    sharpened: { name: 'Sharpened', skillLevel: 5, desc: '+15% SWORD DAMAGE', effects: { swordDamagePct: 15 } },
    wideArc: { name: 'Wide Arc', skillLevel: 10, desc: 'SWORD ARC 140 TO 180 DEGREES', effects: { swordArcDegrees: 40 } },
    criticalEdge: {
      name: 'Critical Edge', skillLevel: 15, desc: '15% CHANCE OF DOUBLE DAMAGE', effects: { critChancePct: 15 },
      damageMult: 2,
    },
    riposte: {
      name: 'Riposte', skillLevel: 20, desc: 'SWING RIGHT AFTER A DODGE: 2X',
      time: 1.0, // seconds after a perfect dodge to start the swing
      damageMult: 2,
    },
  },
  armor: {
    toughened: { name: 'Toughened', skillLevel: 5, desc: '+2 DEFENSE', effects: { defense: 2 } },
    steady: { name: 'Steady', skillLevel: 10, desc: 'KNOCKBACK HALVED', effects: { knockbackPct: -50 } },
    thorns: { name: 'Thorns', skillLevel: 15, desc: 'FOES THAT TOUCH YOU TAKE 25%', effects: { thornsPct: 25 } },
    lastStand: {
      name: 'Last Stand', skillLevel: 20, desc: '+4 DEFENSE BELOW 25% HP', effects: { lowHpDefense: 4 },
      below: 0.25, // fraction of max HP
    },
  },
  destruction: {
    efficient: { name: 'Efficient', skillLevel: 5, desc: 'DESTRUCTION SPELLS COST -20%', effects: { destructionCostPct: -20 } },
    inferno: { name: 'Inferno', skillLevel: 10, desc: 'BURNS DEAL 2X AND LAST 5S', effects: { burnDamagePct: 100, burnTimeBonus: 2 } },
    piercing: { name: 'Piercing', skillLevel: 15, desc: 'BOLTS PASS THROUGH 1 ENEMY', effects: { boltPierce: 1 } },
    shatter: { name: 'Shatter', skillLevel: 20, desc: '+50% DAMAGE TO FROZEN FOES', effects: { frozenDamagePct: 50 } },
  },
  restoration: {
    manaFlow: { name: 'Mana Flow', skillLevel: 5, desc: '+50% MANA REGEN', effects: { manaRegenPct: 50 } },
    potionLore: { name: 'Potion Lore', skillLevel: 10, desc: 'POTIONS HEAL 50% MORE', effects: { potionHealPct: 50 } },
    regeneration: { name: 'Regeneration', skillLevel: 15, desc: '+1 HP/S WHILE STANDING STILL', effects: { regenHpPerSec: 1 } },
    secondWind: { name: 'Second Wind', skillLevel: 20, desc: 'SURVIVE 1 LETHAL HIT PER TRIP' },
  },
};

export const DROPS = {
  heartChance: 0.1, // chance an enemy drops a heart
  heartHeal: 10,
  pickupLifetime: 12, // seconds before an uncollected drop disappears
  pickupBlinkTime: 3, // drops blink during their last N seconds
};

// Shop gear. Index 0 is the starting gear. Buying auto-equips; you can skip tiers
// but can't buy anything at or below your current tier. Each tier is sold in one village (SHOPS).
export const SWORDS = [
  { id: 'wooden', name: 'Wooden Sword', bonus: 0, price: 0 },
  { id: 'iron', name: 'Iron Sword', bonus: 4, price: 40 },
  { id: 'steel', name: 'Steel Sword', bonus: 8, price: 110 },
  { id: 'hero', name: "Hero's Blade", bonus: 14, price: 260 },
];

export const ARMOR = [
  { id: 'cloth', name: 'Cloth Tunic', defense: 0, price: 0 },
  { id: 'leather', name: 'Leather Armor', defense: 2, price: 35 },
  { id: 'chainmail', name: 'Chainmail', defense: 4, price: 90 },
  { id: 'plate', name: 'Plate Armor', defense: 7, price: 220 },
];

// What each shop sells. swords / armor: tier indexes into SWORDS / ARMOR. Better gear is sold
// further along the road; potions, mana potions and spell tomes are sold everywhere but the camp.
export const SHOPS = {
  village: {
    title: 'VILLAGE MARKET', greeting: 'WHAT WOULD YOU LIKE?',
    swords: [1], armor: [1], potions: true, manaPotions: true, tomes: true,
  },
  sunwell: {
    title: 'SUNWELL BAZAAR', greeting: 'FINEST STEEL THIS SIDE OF THE DUNES!',
    swords: [2], armor: [2], potions: true, manaPotions: true, tomes: true,
  },
  frosthold: {
    title: 'FROSTHOLD FORGE', greeting: 'FORGED IN THE COLD. BUILT TO LAST.',
    swords: [3], armor: [3], potions: true, manaPotions: true, tomes: true,
  },
  camp: {
    title: 'TRAVELLING MERCHANT', greeting: 'POTIONS FOR THE ROAD, FRIEND!',
    potions: true, manaPotions: true,
  },
};

export const POTION = {
  heal: 20,
  price: 15,
  max: 5, // how many you can carry
};

export const MANA_POTION = {
  restore: 20,
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
