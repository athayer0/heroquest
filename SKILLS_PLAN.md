# HeroQuest: Skills, Magic & World Expansion Plan

This builds on the finished game in `PLAN.md`. It adds a Skyrim-style "get better at what you do" system (five skills that level up through use, perk trees, a mana bar, and spells cast with the mouse). It also adds two new areas, each with a boss, and a stronger Dark Lord to match a hero who now has spells and perks. As before, every number lives in `src/config.js`, and each phase ends with a game you can play.

---

## Decisions

| Topic | Decision |
|---|---|
| Hero XP | **Every XP source feeds the hero's level directly.** Kills still give XP, and every point of skill XP *also* goes into the hero's XP bar at the moment it's earned. You don't have to level a skill up for its XP to count. |
| Skill XP | Each skill has its own XP and level. Using a skill raises its level, which makes that skill stronger (passive scaling) and unlocks perks. |
| Level-up reward | A **perk point**, plus the existing level-up menu, which now offers **+10 Max HP** or **+10 Max Mana**. The +Damage choice goes away, since Blade now covers damage. |
| Level cap | **30** (it was 10). |
| Skill cap | **50** per skill. Perks unlock at skill levels 1 / 10 / 20 / 30. |
| Spells | Basic tomes are sold in the shop. Stronger spells are found in the world: each new boss drops one, plus chests and the story NPC. |
| World | Two new areas, each ending in a boss: the **Desert** (after the Forest) and the **Frozen Peaks** (after the Cave). The Cave becomes a **Lava Cave**, and the Castle gains **gargoyles**. The Castle gate stays sealed until both bosses are beaten. |
| Bosses | Beating a mid-boss is permanent and saved. The Dark Lord is reworked: more HP, harder hits, and a third phase. |
| Controls | Left-click swings the sword. **Right-click casts the equipped spell toward the mouse.** **1–4** or the **mouse wheel** switches spells. |
| Shops & travel (Phase 10) | Gear is sold one tier per village: the starting Village, then a Desert village, then a Peaks village. A **map** (M) shows where you've been, and you can **fast travel** between villages you've visited from any room with no enemies left. |

---

## How XP flows

```
kill an enemy ─────────────────────────────► hero XP
use a skill ──► skill XP (that skill) ──────► hero XP  (× LEVELING.skillXpShare, starts at 1.0)
```

`addXp(player, amount)` in `leveling.js` stays the one place where hero XP is added. A new `addSkillXp(player, skillId, amount)` adds to the skill, then calls `addXp(player, amount * skillXpShare)`. Both functions return any level-ups, so `play.js` can trigger the level-up celebration for the hero and show a toast like `BLADE 12` for a skill.

**Skill XP curve:** `skillXpToNext(level) = SKILLS.xpBase + SKILLS.xpPerLevel × level` (starting values 5 + 3 × level). Early levels come fast, and the curve slows down later.

**Hero XP curve:** keep `xpToNext = 20 × level` to start. With skill XP added on top, the hero levels roughly 1.5–2× faster than today, which suits a cap of 30. Re-tune this in Phase 9 (see the balance check below).

---

## Skills

All skills start at level 1. The "scales" column is a passive bonus that grows with skill level, so you get stronger at a skill even without spending perk points on it.

| Skill | Trained by (skill XP per event) | Scales |
|---|---|---|
| **Blade** | Landing a sword hit on an enemy: `enemy.xp × 0.25` | Sword damage +2% per level |
| **Armor** | Taking a hit: `damage taken × 0.5` | Defense +1 per 10 levels |
| **Evasion** | A roll's i-frames absorbing a hit that would have landed (a "perfect dodge"): `that attack's damage × 0.75` | Roll cooldown −1% per level |
| **Destruction** | An offensive spell damaging an enemy: `damage × 0.25` | Spell damage +2% per level |
| **Restoration** | HP actually restored by spells (overheal doesn't count): `HP healed × 0.3` | Heal amount +2% per level, mana regen +1% per level |

**Anti-grind rules:** skill XP only comes from real outcomes. Swinging at air, healing at full HP, or rolling with nothing to dodge earns nothing. Enemies respawn when you re-enter a room, so grinding is possible but slow, which is the same as today.

**Detecting a perfect dodge:** `Player.takeHit` currently returns `false` for any invincibility. It needs to say *why* the hit was blocked, e.g. return `'dodged'` when `rollT > 0`, so `play.js` can award Evasion XP (and later trigger Riposte).

---

## Perks

You get one perk point per hero level (29 by level 30). Each perk requires a minimum level in its skill. The perks within a skill don't depend on each other, so you can skip any of them.

| Skill | Lv 1 | Lv 10 | Lv 20 | Lv 30 |
|---|---|---|---|---|
| **Blade** | *Sharpened*: +15% sword damage | *Wide Arc*: swing arc 140° → 180° | *Critical Edge*: 15% chance of double damage | *Whirlwind*: hold click ~0.6s for a 360° spin attack |
| **Armor** | *Toughened*: +2 defense | *Steady*: knockback halved | *Thorns*: enemies that touch you take 25% of the damage back | *Last Stand*: +4 defense below 25% HP |
| **Evasion** | *Nimble*: roll cooldown −30% | *Long Roll*: +25% roll distance | *Riposte*: for 1s after a perfect dodge, your next swing does double damage | *Double Roll*: two rolls before the cooldown starts |
| **Destruction** | *Efficient*: Destruction spells cost 20% less | *Inferno*: your burns deal double damage and last 5s | *Piercing*: bolts pass through the first enemy | *Shatter*: hits on a frozen enemy deal +50% damage |
| **Restoration** | *Mana Flow*: +50% mana regen | *Potion Lore*: potions heal 50% more | *Regeneration*: +1 HP/s while standing still | *Second Wind*: once per trip out of the Village, a lethal hit leaves you at 1 HP |

**How perks are implemented:** as data in `config.js`, e.g. `PERKS.blade.sharpened = { skillLevel: 1, effects: { swordDamagePct: 15 } }`. Gameplay code asks `perkValue(player, 'swordDamagePct')`, which sums that effect across every owned perk. Most perks then need no special-case code. The few behaviour perks (Whirlwind, Riposte, Double Roll, Second Wind) check `hasPerk(player, id)` at the one place they matter.

---

## Mana & spells

**Mana:** starts at 20 max and regenerates at 2/s, with a short pause after casting (0.75s) so regen doesn't cancel out spell costs. The level-up menu can add +10 Max Mana. **Mana potions** (15g, restore 20 MP) are sold in a new shop tab. You can carry 5, the same as health potions. **E** stays talk/interact and **Q** stays health potion; **R** drinks a mana potion.

| Spell | School | Cost | Effect | How you get it |
|---|---|---|---|---|
| **Firebolt** | Destruction | 5 | A bolt toward the mouse: 8 damage + **burn** | Given by the story NPC at the start of a new game |
| **Heal** | Restoration | 8 | Instantly restores 15 HP | Shop tome, 40g |
| **Ward** | Restoration | 10 | 3s shield that destroys enemy projectiles | Dropped by the Sand Pharaoh (Desert boss) |
| **Frost Shard** | Destruction | 6 | A bolt toward the mouse: 5 damage + **chill** (slow, or freeze if already slowed) | Dropped by the Frost Wyrm (Frozen Peaks boss) |
| **Chain Lightning** | Destruction | 14 | Hits the target and jumps to 2 nearby enemies, 10 damage each | Chest behind a secret wall in the Castle, so it helps against the Dark Lord |

Each boss's spell is a useful counter for what comes next: Ward blocks the skeleton bones and spirit bolts in the Lava Cave and Peaks, plus the Dark Lord's orbs, and Frost Shard slows the Castle's gargoyles.

**Casting:** right-click casts the equipped spell toward the mouse. Like the sword, it doesn't stop you moving. A spell has a short cast cooldown (0.3s), and casting while rolling is blocked. With too little mana, the MP bar flashes and nothing happens. Bolts reuse `projectile.js` with a `friendly` flag, so `play.js` checks them against enemies instead of the player.

**Switching:** 1–4 select a known spell, and the mouse wheel cycles through them. The equipped spell shows in a third HUD slot next to the sword and armor.

### Fire & ice effects

The same rules apply to **everyone**: the hero, enemies and bosses, except that **bosses can't be frozen** (see below). They're shared code, used by spells, enemy bolts and terrain.

- **Burn (fire): damage over time.** A fire hit sets the target burning for 3s, taking 2 damage per second. Being hit by fire again while burning restarts the 3s instead of stacking. Burn ticks don't cause knockback or trigger i-frames, and the target flickers orange while burning.
- **Chill (ice): slow, then freeze.**
  1. An ice hit on a target that **isn't slowed** slows it to 50% speed for 2.5s (a pale-blue tint).
  2. An ice hit on a target that **is already slowed** **freezes** it for **1 second**. It can't move, attack, roll or cast, and an ice-block overlay is drawn on it.
  3. When the freeze ends, the slow is cleared too, so the target is **back to normal speed**. The next ice hit starts the cycle again at step 1.
- **What causes them:**
  - Fire: Firebolt, Fire Spirit bolts, fire vents.
  - Ice: Frost Shard, Ice Spirit bolts, the Frost Wyrm's breath and icicles.
- **Immunities:** fire creatures (Fire Spirits) can't burn, and ice creatures (Ice Spirits, the Frost Wyrm) can't be chilled.
- **Freezing enemies:** a frozen enemy's wind-up or charge is cancelled, and it doesn't hurt on contact while frozen.
- **Bosses can be slowed but never frozen.** An ice hit on a slowed boss just restarts its 2.5s slow. Bosses can still burn. (The Frost Wyrm ignores ice entirely.)
- **Config:** `STATUS = { burn: { time, damagePerSec }, slow: { time, speedMult }, freeze: { time } }` in `config.js`.

---

## World expansion & bosses

### New route

```
Village → Meadow (Lv 1) → Forest (Lv 3) → DESERT (Lv 6) ─ the Sand Pharaoh
        → LAVA CAVE (Lv 9, was the Cave; the merchant's camp stays) → FROZEN PEAKS (Lv 12) ─ the Frost Wyrm
        → Castle (Lv 15, gate sealed until both bosses fall) ─ the Dark Lord
```

The recommended levels on the existing signs move up to match. The Cave's and Castle's existing enemies get stronger stats for their new, later level bands. Each area gets one terrain mechanic, so it plays differently from the others, not just looking different.

**Elemental rule:** fire enemies are immune to Firebolt and burning, and ice enemies take double damage from Firebolt and can't be chilled. That gives the starting spell a clear moment to shine, and pushes you to use other tools in the lava cave.

### The Desert (new, after the Forest)
- **Look:** sand and sandstone palette, dunes, cacti, ruined pillars.
- **Mechanic:** *quicksand* tiles you can walk through at half speed. Rolling through them still works at full speed, which teaches the roll.
- **Enemies:**
  - **Mummy** (melee): slow but relentless. It constantly walks straight toward the hero and never stops to wander. It's sturdy for its level, so it's the "keep moving and chip away" enemy. Starting stats: HP 30, attack 8, speed 26, XP 15.
  - **Vulture** (a better bat): the bat's erratic flight, but faster, tougher and harder-hitting, and it rests less often. Starting stats: HP 22, attack 7, speed 85, XP 12. Optionally, a telegraphed straight-line swoop every few seconds (a screech and a pause first).
- **Boss: The Sand Pharaoh.** HP ~200.
  - Phase 1: sinks into the sand and resurfaces under the hero (a growing shadow marks the spot), then throws a fan of cursed bandages (projectiles).
  - Phase 2 (below 50%): raises 2 mummies from the sand and resurfaces faster.
  - **Drops: the Ward tome** and the first **seal** for the Castle gate.

### The Lava Cave (reworks the existing Cave)
- **Look:** the cave palette becomes dark rock with orange-red lava. It's no longer a dark area, since the lava lights it, but the glow flickers.
- **Mechanic:** lava pools are impassable, like water. *Fire vents* on the floor glow for ~1s, then erupt briefly, hurting and **burning** anything standing on them.
- **Enemies:**
  - **Skeleton** (upgraded):
    - Throws more often: `throwInterval` goes from 1.6–2.4s to about **1.0–1.5s**.
    - **Looks for better angles.** Before a wind-up, it checks for a clear line of sight to the hero (no walls or lava in the way). If blocked, it strafes to a spot with a clear shot.
    - It avoids lining up directly behind another skeleton, leads its throw slightly toward where the hero is moving, and spreads out from other skeletons.
  - **Fire Spirit** (ranged): floats, keeps its distance like the skeleton, and shoots **fire bolts** at the hero. A hit sets the hero **burning**. It's immune to burning, so Firebolt only does its direct damage.
- No boss. The merchant's camp save point stays here, between the two boss areas.

### The Frozen Peaks (new, after the Lava Cave)
- **Look:** white and pale-blue palette, snow, ice, pine trees.
- **Mechanic:** *ice* tiles where the hero slides and keeps momentum, so dodging takes more care.
- **Enemies:**
  - **Ice Spirit** (ranged): works like the Fire Spirit but shoots **ice bolts** that **chill** the hero instead of burning, so a second bolt while you're slowed freezes you for 1s. It takes double damage from Firebolt and can't be chilled.
  - **Wolf** (melee): moves toward the hero, and every **2–3 seconds** crouches (a ~0.4s telegraph) and **lunges** in a fast straight line. After a lunge it recovers briefly, which is your opening.
- **Boss: The Frost Wyrm.** HP ~300, a big 2×2-tile sprite.
  - Phase 1: an ice-breath cone that **chills** (a cold-mist telegraph shows the cone first) and a tail sweep when you're behind it.
  - Phase 2 (below 50%): falling icicles (shadows on the ground first) while it keeps breathing.
  - Armored hide: sword damage is halved unless it's stunned. It's stunned for ~2s after its breath attack ends. This rewards reading the fight and dodging, not just trading hits.
  - **Drops: the Frost Shard tome** and the second **seal**.

### The Castle (existing, new enemy)
- **Knight:** as today (shield blocks frontal hits), with stats raised for Lv 15.
- **Gargoyle** (new, tank):
  - Walks steadily toward the hero.
  - **Never takes knockback**, so you can't push it away; dodge it instead.
  - Lots of HP and hits very hard. Starting stats: HP 90, attack 18, speed 22, XP 45.
  - Mixing these with knights forces you to deal with a shield you have to flank and a wall you have to dodge at the same time. Frost Shard (from the Peaks boss just before) is a strong counter: two hits freeze a gargoyle for a free second of damage.

### The Dark Lord, reworked
He was tuned for a Lv 7 hero with no spells or perks. He now needs to stand up to a Lv ~15 hero with a build.

| | Today | Reworked |
|---|---|---|
| HP | 250 | **~700** (final number set in the balance phase) |
| Attack / contact | 15 / 12 | **22 / 16** |
| Phases | 2 (switching at 50%) | **3**, switching at 66% and 33% |

- **Phase 1:** as today (3-way projectile fans, walks toward you), but faster.
- **Phase 2:** as today's phase 2 (ground slam plus fans), with 5-way fans.
- **Phase 3, new:** he teleports to a random corner (with a dark-smoke telegraph), **awakens 2 gargoyles** from statues in the boss room, and fires **homing orbs** that can be destroyed by sword or spells. Ward blocks them, which pays off the Desert reward.
- Every attack keeps the "visible wind-up, then a recovery window" rule from `PLAN.md`.

### The boss framework
`boss.js` is written for the Dark Lord only. Before adding more bosses, split out a shared **`Boss` base class**: HP, phases, the intro banner, the door lock, the big HP bar, hit cooldown, `onDefeated`, and `freezeImmune = true` (bosses can be slowed but not frozen). `play.js`'s `updateBossFight` then works with any boss. Rooms name their boss with `boss: 'pharaoh' | 'frostWyrm' | 'darkLord'`.

**Rewards (changed after Phase 10):** a mid-boss's first defeat gives its hero XP immediately and leaves a **reward chest** in the room holding its gold, spell tome and seal. The chest waits (even across save/load) until opened. Once it's opened, the boss is back every time you re-enter its room; rematches give no chest or XP bonus, just `rematchGold` (a quarter of the first-win gold). Saves from before this got their rewards on the spot, so their chests count as opened.

**Saved progress:** add `bossesDefeated: []` to the save. A defeated mid-boss stays dead: its room stays open and its drop isn't given again. The Dark Lord still comes back on Continue after the ending, the same as now, but only drops his reward the first time.

**Castle seals:** the Castle entrance gets a sealed-door tile with two empty sockets. Each mid-boss fills one. With both filled, the door opens. A sign by the door hints at where the seals are, so a player who skips ahead knows what to do.

---

## Code changes at a glance

| File | Change |
|---|---|
| `config.js` | New `MANA`, `SPELLS`, `SKILLS`, `PERKS` tables. `LEVELING`: `maxLevel: 30`, `manaChoice: 10`, `skillXpShare: 1.0`, and `damageChoice` removed. `POTION` gets a mana-potion sibling. |
| `systems/skills.js` (new) | `addSkillXp`, `skillXpToNext`, `skillBonus` (passive scaling), `perkValue`, `hasPerk`, `buyPerk`. |
| `systems/status.js` (new) | `applyBurn(target)`, `applyChill(target)` (slow, or freeze if already slowed and the target isn't `freezeImmune`, which all bosses are), and `updateStatus(target, dt)`, which ticks burn, ends the freeze and clears the slow. Used by the player, enemies and bosses. |
| `systems/magic.js` (new) | `castSpell(player, spellId, target, ctx)`, mana spend/regen, and the spell effects. |
| `systems/leveling.js` | Level choices become +HP / +Mana. Each level-up also grants a perk point. |
| `systems/combat.js` | Damage formulas include skill scaling and perks. |
| `entities/player.js` | Burn, slow and freeze on the hero (a frozen hero can't move, attack, roll or cast). `mana`, `maxMana`, `skills`, `perks`, `perkPoints`, `knownSpells`, `spellIndex`, `castCd`. `takeHit` reports dodges. |
| `entities/projectile.js` | Friendly projectiles, plus `element: 'fire' | 'ice'`, which applies burn or chill on hit. |
| `entities/enemy.js` | Calls the shared status code in its base `update`. Burn ticks, slowed speed, and frozen skipping `think()`. `immune: ['fire']`-style flags. |
| `entities/chest.js` (new) | Opened with E, one time only. Gives a spell tome, gold or a potion. Opened chests are saved. |
| `input.js` | Right-click (and blocking the browser's context menu on the canvas), mouse wheel, keys 1–4 and R. |
| `scenes/play.js` | Awards skill XP at each hook (sword hits, hits taken, dodges, spell hits/heals). Shows skill-level toasts. Resolves friendly projectiles against enemies. |
| `ui/hud.js` | MP bar and spell slot (see the layout note below). |
| `ui/pause.js` | New **SKILLS** tab. |
| `ui/shop.js` | **Magic** tab: spell tomes and mana potions. |
| `entities/boss.js` | Split into a shared `Boss` base plus `DarkLord`. New `bosses/pharaoh.js` and `bosses/frostWyrm.js`. |
| `entities/enemies/` | New `mummy.js`, `vulture.js` (built on the bat), `spirit.js` (one class for the fire and ice variants), `wolf.js`, `gargoyle.js`. `skeleton.js` gets the line-of-sight and angle-seeking upgrade. `enemy.js` gets a `noKnockback` flag for gargoyles. |
| `world/rooms/` | New `desert.js` and `peaks.js`. `cave.js` gets lava, vents and new enemy placements. `castle.js` gets gargoyles, the boss-room statues and the seal door. Reconnect the room graph (Forest → Desert → Lava Cave → Peaks → Castle). |
| `world/tiles.js` | Quicksand (half speed), lava (impassable), fire vents (timed damage) and ice (sliding) tiles. |
| `world/areas.js`, `gfx/palette.js` | Desert and peaks areas and palettes. The cave palette becomes lava. The `cave` area is no longer `dark`. |
| `systems/save.js` | `VERSION` 2: saves mana, skills, perks, perk points, known spells, opened chests and defeated bosses. **Loads version 1 saves** by filling in defaults. Today's `loadGame` rejects any other version, so this must change, or existing File 1/File 2 saves would vanish. Old saves get `level − 1` perk points to spend. |

**HUD layout note:** the 40px HUD already has three rows (HP, XP, area/ATK/DEF). Fitting an MP bar means thinner 5px bars with rows at y = 4 / 13 / 22, and the area + stats line at y = 31. The spell slot goes right of the armor slot, which pushes gold and potions slightly right. Mock this up before building it.

---

## Phases

**Status:** Phase 1 ✅ · Phase 2 ✅ · Phase 3 ✅ · Phase 4 ✅ · Phase 5 ✅ · Phase 6 ✅ · Phase 7 ✅ · Phase 8 ✅ · Phase 9 🟡 (tuned from a model; confirm with a playtest) · Phase 10 ✅

### Phase 1: Mana & first spells
- `MANA` and `SPELLS` config, plus mana, regen and the cast cooldown on the player.
- Right-click casts toward the mouse. Firebolt (friendly projectile) and Heal.
- The story NPC gives Firebolt on a new game. Heal is sold in a new **Magic** shop tab alongside mana potions. R drinks a mana potion.
- HUD: MP bar and the equipped-spell slot. Keys 1–4 and the mouse wheel switch spells.
- Save `VERSION` 2 with version-1 migration (mana, known spells).
- Update the pause-menu controls list and the title-screen hint.

**Verify:** Firebolt kills a slime (burn arrives in Phase 4; until then it's direct damage only), Heal restores HP, mana drains and refills, an empty MP bar blocks casting, and a version-1 save from before this change still loads.

### Phase 2: Skills & unified XP
- `SKILLS` config and `systems/skills.js`. All five skills earn XP at their hooks in `play.js`.
- Skill XP flows into hero XP immediately (`skillXpShare`). Kill XP stays.
- Passive skill scaling applied in `combat.js`, the roll cooldown and the spell code.
- `takeHit` reports perfect dodges, which award Evasion XP.
- Level cap 30. The level-up menu offers +Max HP / +Max Mana.
- Skill level-up toasts (`BLADE 5`). Skills are saved.

**Verify:** each action raises the right skill, the hero XP bar moves on skill use as well as on kills, skill levels visibly change numbers (damage, roll cooldown), and rolling through a goblin's charge gives Evasion XP.

### Phase 3: Perks & the Skills screen
- `PERKS` config, `perkValue` / `hasPerk`, and one perk point per hero level.
- Pause menu **SKILLS** tab: each skill with its level and XP bar, and selecting one shows its 4 perks (owned / available / locked with the required level). Spend points here.
- Implement every perk from the table. Do the stat perks first, then Riposte, Double Roll, Second Wind and Whirlwind.
- Save perks and unspent points. Version-1 saves get `level − 1` points.

**Verify:** you can buy each perk only when its skill level is high enough, every perk's effect is noticeable in play, and perks survive save/load.

### Phase 4: Boss framework & world plumbing
- Split `boss.js` into a shared `Boss` base plus `DarkLord`, with no change to how the Dark Lord plays yet.
- Save `bossesDefeated` and opened chests. Boss drops (a spell tome or a seal) are only given once.
- `systems/status.js`: burn and chill (slow → freeze → reset) shared by enemies *and* the hero, with immunities. The `noKnockback` enemy flag.
- `chest.js` entity (opened with E, saved once opened).
- New tile types: quicksand, lava, fire vents and ice.
- Reconnect the room graph so new areas can slot in. Add the Castle seal door (it opens immediately until Phase 7 adds the second boss).

**Verify:** the Dark Lord fight is unchanged, a test chest stays open after save/load, and each new tile type behaves correctly in a test room. With a debug key, apply burn and chill to a slime, the hero and the Dark Lord: burn ticks for 3s, a second chill freezes for exactly 1s, then the target is back to full speed and a third chill slows it again. The Dark Lord only ever slows.

### Phase 5: The Desert & the Sand Pharaoh
- Desert rooms (3–4 screens) between the Forest and the Cave, with its palette and area name. Recommended-level signs updated along the whole route.
- Mummy and Vulture.
- The Sand Pharaoh fight (two phases) in the Desert's last room. He drops the Ward tome and the first seal.
- The Ward spell.

**Verify:** mummies never stop chasing, vultures feel like a clear step up from bats, the Pharaoh's resurfacing shadow is readable, and Ward plus the seal stay after save/load.

### Phase 6: The Lava Cave
- Lava palette, lava pools and fire vents in the existing cave rooms. Remove the darkness.
- The Fire Spirit (with the shared `spirit.js`) and the burn status on the hero.
- The skeleton upgrade: faster throws, line-of-sight checks, angle-seeking, spreading out and leading throws.
- Raise skeleton stats for the new level band. Keep the merchant's camp.

**Verify:** skeletons no longer throw into walls and visibly reposition for clear shots, fire spirits ignore Firebolt, and vents are always telegraphed before they hurt.

### Phase 7: The Frozen Peaks & the Frost Wyrm
- Peaks rooms (3–4 screens) between the Lava Cave and the Castle.
- The Ice Spirit (an ice variant of `spirit.js`, slowing the hero) and the Wolf (a lunge every 2–3s).
- The Frost Wyrm fight (2×2 sprite, armored until stunned). It drops the Frost Shard tome and the second seal.
- The Frost Shard spell. The Castle seal door now needs both seals.

**Verify:** sliding on ice is fun rather than frustrating, wolf lunges are telegraphed and dodgeable, the Wyrm's stun window is clear, and the Castle stays sealed until both bosses are beaten.

### Phase 8: The Castle & the Dark Lord rework
- The Gargoyle (no knockback, tanky, hits hard) mixed in with knights. Raise knight stats.
- Dark Lord: new HP and attack values, 5-way fans in phase 2, and the third phase (teleport, statue gargoyles, homing orbs).
- Chain Lightning in a secret-wall chest in the Castle.
- Update the ending/princess dialogue if it mentions the old route.

**Verify:** gargoyles can't be pushed back but can be dodged and slowed, all three Dark Lord phases are readable, and homing orbs can be destroyed by sword, spells and Ward.

### Phase 9: Balance pass
- A full playthrough on a new file. Tune the XP curves, spell costs and damage, perk strength, and boss HP.
- Make sure a sword-focused build and a magic-focused build can both beat all three bosses.

**Verify:** a run from title to ending reaches the Dark Lord around Lv 15 with ~14 perk points spent, takes roughly 45–60 minutes, and neither build feels forced.

**First pass (done, from a model of the route).** A script walked the real rooms and enemies in route order, assuming one clear of each room (and, separately, 30% of kills repeated), the gear each town sells, Blade XP from hits per kill, some hits taken and some spellcasting. Changes made:
- **Hero XP curve:** `20 × level`, plus 15% more per level above 10 (`LEVELING.steepFrom`, `steepPctPerLevel`). The flat curve tracked the signs until the Castle, whose ~800 XP then overshot to Lv 17–18 at the throne. Predicted arrival levels now: Forest 3–4, Desert 5–6, Cave 9, Peaks 11–12, Castle 13–14, **throne 15–16 with 14–15 perk points**. Castle signs lowered from Lv 15 to 14 to match.
- **Gold:** with gear split across towns (Phase 10), you arrived at each town 50–350 gold short. Enemy gold raised in every area, the Pharaoh and the Wyrm now pay 120 and 180 gold (first win only), and the later gear is ~10% cheaper (Steel 110, Chainmail 90, Hero's Blade 260, Plate 220). Now you can afford one piece on arrival and the other soon after, or both with normal replaying.
- **Magic builds:** sword damage roughly quadruples over the game through gear; spells only had Destruction. Firebolt 8→10, Frost Shard 5→6, Chain Lightning 10→12; Destruction +3% spell damage per level (was 2%) and 0.35 XP per damage (was 0.25, which gave about half the skill XP of killing the same enemy with the sword). **Boss hit cooldowns now only pace sword hits**: bolts that landed during the cooldown used to burst for no damage.

**Still to confirm with a real playthrough** (with `?debug`, the console logs a `[run]` line for every new area, boss win and death, and `window.heroquestRun` holds them all): actual levels and gold at each town, total time (target 45–60 min), whether a sword build and a magic build both beat all three bosses, and perk strength, which the model doesn't cover.

### Phase 10: Frontier villages, the map & fast travel
Do this **before Phase 9**: it changes the route, the gold economy and how far you walk, which are exactly what the balance pass tunes.

**Gear by village.** Today the Village sells every tier, and so does the merchant's camp. Instead, each village sells one tier, so better gear is something you reach:

| Village | Where | Sword | Armor |
|---|---|---|---|
| **The Village** (start) | where it is today | Iron Sword (40g) | Leather Armor (35g) |
| **Sunwell** (an oasis town) | the Desert, on the main path between Desert West and the Ruins | Steel Sword (120g) | Chainmail (100g) |
| **Frosthold** (a mountain hamlet) | the Frozen Peaks, on the main path between the Base and the Slope | Hero's Blade (300g) | Plate Armor (250g) |

- Every village shop also sells potions, mana potions and the Heal tome, so supplies are never far away.
- Each village sells **only its own tier**. A tier you skipped stays on sale back where it was (fast travel makes the trip cheap). The "can't buy at or below your current tier" rule is unchanged.
- The **merchant's camp** in the Lava Cave becomes a supply stop: potions and mana potions only. It stays a save point.
- Sunwell and Frosthold are peaceful (no enemies), with a shop counter, a few townsfolk with tips about the area ahead, and their own look (desert and snow palettes). Each is one screen.

**Villages as safe havens.**
- Entering any village autosaves and makes it the place Continue starts, like the camp today.
- **Dying sends you to the last village you visited**, not always back to the start. (Gold loss on death is unchanged.)
- Second Wind's "once per trip" resets in any village.

**The map (M, or MAP in the pause menu).**
- Shows every room you've visited, laid out by how the rooms connect (worked out from the room links rather than the `pos` grid, since the route's segments live in different parts of that grid).
- Rooms are tinted by area. The current room blinks. Villages, the camp, boss rooms (crossed out once beaten) and the Castle gate are marked with small icons.
- Rooms you haven't visited aren't shown, apart from a faint outline for rooms next to ones you have, so you can see where unexplored exits lead.
- Visited rooms are saved.

**Fast travel (from the map).**
- Pick a village you've visited and travel there.
- Only allowed when **the room you're in has no enemies left**: either it never had any (villages, the camp, the halls between areas) or you've defeated them all. Never during a boss fight. If travel isn't allowed, the map says why ("DEFEAT THE ENEMIES HERE FIRST").
- Travelling fades out, lands you in the village and autosaves.
- Enemies respawn when you re-enter a room, as today, so fast travel doesn't let you skip clearing the way back.

**Code changes.**
- `config.js`: each shop's stock (`SHOPS`: which sword and armor tiers, and whether it sells tomes), replacing the "every tier" tabs.
- `systems/shop.js` and `ui/shop.js`: tabs built from the shop's stock; tabs with nothing to sell are hidden.
- `world/rooms/`: `sunwell.js` and `frosthold.js` (or one `villages.js`); `LINKS` updated to slot them into the Desert and Peaks; `village: true` on village rooms.
- `ui/map.js` (new): the map screen and the fast-travel picker. `input.js`: M opens the map.
- `scenes/play.js`: track visited rooms, the last village, "room cleared", and the travel itself.
- `systems/save.js`: `visitedRooms` and `lastVillage`. Older saves start with only the rooms they're standing in plus the Village marked visited.
- NPC and sign text that says "the shop sells everything" or points at the camp for gear gets updated.

**Verify:** each village sells exactly its tier (and supplies), the camp sells only supplies, the map fills in as you explore and survives save/load, you can't fast travel with an enemy alive in the room or during a boss fight, travel works from a cleared room to every visited village, and dying sends you to the last village you entered.

---

## Balance sanity check (starting estimates, to be checked in Phase 9)

**Content size:** the Desert and Peaks add ~7 screens and ~35 more kills, about doubling the game. Expect ~70 kills total before the Dark Lord.

**XP by the Dark Lord:**
- Kill XP: today's ~420, plus ~35 new-area kills at ~25 XP (between the Cave's and the Castle's enemies) plus ~10 Castle kills at 30 ≈ **~1,600**
- Skill XP adds roughly as much again (Blade ≈ 0.75 × kill XP, plus armor/evasion/spells) ≈ **~1,400**
- Mid-boss kills: give each a large XP reward (~150) ≈ **~300**

**Total ≈ 3,300 XP.** On `20 × level`, Lv 15 needs 20 × (1 + 2 + … + 14) = **2,100**, and Lv 18 needs **3,060**. That's slightly ahead of the target Lv 15, so the hero curve probably needs to steepen (e.g. `25 × level`). Lv 15–30 is left for postgame and future content.

**Damage check against the reworked Dark Lord:** at Blade 25 (+50%) with Steel and Sharpened (+15%), ~25 base damage (base 5 + Steel; Hero sword later) becomes about **~40 per hit**, plus spell damage. With 700 HP and the 0.4s hit cooldown, that's ~18 sword hits, which is in line with how long today's fight feels, now spread across three phases. **First knobs to turn:** `BOSS.hp`, the Blade % per level, `skillXpShare` and the hero XP curve.
