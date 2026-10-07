# HeroQuest: Implementation Plan

A small top-down action RPG in the style of the original Legend of Zelda. It runs in the browser on HTML5 Canvas with vanilla JS (ES modules) and uses Vite as the dev server. There are no external assets: every sprite is a pixel array in code, and all balance numbers live in `src/config.js`.

---

## Core technical decisions

| Topic | Decision |
|---|---|
| Resolution | 16px tiles. A room is 16×11 tiles (256×176 px), with a 256×40 HUD bar on top. That gives a 256×216 internal canvas, scaled up by an integer factor (3× by default) with `imageSmoothingEnabled = false` for crisp pixels. |
| Game loop | `requestAnimationFrame` with a fixed 60 Hz update step (accumulator) and rendering decoupled from updates. |
| State machine | One top-level scene stack: `title → playing ⇄ (paused / dialogue / shop / levelUp) → dead → ending → complete`. Overlay scenes freeze the world update. |
| Sprites | Each sprite is a small string array (e.g. `"..11..", ".1221."`) plus a palette map. Sprites are pre-rendered once to offscreen canvases. Palette swaps produce the sword/armor tier colors and the darker cave palette. |
| Collision | AABB against the tile grid (solid tiles: wall, tree, water, rock, locked door) and against entities. Hitboxes are slightly smaller than sprites so movement feels forgiving. |
| Input | Key-state map plus "pressed this frame" edge detection. Arrows/WASD move, Space attacks, E interacts, Q drinks a potion, Esc pauses. |
| Config | `src/config.js` exports plain objects: `PLAYER`, `LEVELING`, `ENEMIES`, `BOSS`, `SHOP`, `DROPS`, `DEATH`, `TIMING`. No magic numbers elsewhere. |

### Folder structure

```
heroquest/
├── index.html
├── package.json            (vite only as a dev dependency)
└── src/
    ├── main.js             game loop, scene manager, canvas setup
    ├── config.js           ALL balance numbers
    ├── input.js
    ├── gfx/                palette.js, sprites.js (pixel arrays), renderer.js
    ├── world/              tiles.js, rooms/ (one file per area), world.js (room graph, transitions)
    ├── entities/           player.js, enemy.js (base), slime/bat/goblin/skeleton/knight.js,
    │                       boss.js, npc.js, pickup.js, projectile.js
    ├── systems/            combat.js, leveling.js, shop.js, save.js, stats.js
    └── ui/                 hud.js, dialogue.js, menus.js, screens.js (title/death/ending/complete)
```

---

## Phases

Each phase ends with a game that runs (`npm run dev`) and has a short checklist to verify.

**Status:** Phase 1 ✅ · Phase 2 ✅ · Phase 3 ✅ · Phase 4 ✅ · Phase 5 ✅ · Phase 6 ✅ · Phase 7 ✅ (awaiting playtest)

### Phase 1: Foundation: loop, rendering, movement, rooms
- Vite project setup, `index.html`, canvas scaling, fixed-timestep loop.
- Input module.
- Tile set (grass, wall, tree, water, rock, floor, door, path, sign) drawn from pixel arrays.
- Room format: a 16×11 array of tile chars plus metadata (`area`, `neighbors: {n,s,e,w}`, `entities`, `signs`).
- Player sprite with 4 facings and a 2-frame walk animation, plus tile collision.
- Flip-screen transitions: walking off an edge slides the old and new rooms over about 0.4s, then places the player on the opposite edge.
- Two or three test rooms to exercise the transitions.

**Verify:** the player walks around, can't pass walls or water, and the screen slides between rooms in all 4 directions.

### Phase 2: Combat core: sword, enemies, damage, drops
- Sword swing: a short attack hitbox in the facing direction with a brief animation and cooldown.
- Combat system: `damage dealt = baseDamage + swordBonus`, `damage taken = max(1, enemyAttack − playerDefense)`.
- Hit feedback: enemies flash white and get knocked back. The player gets 1s of i-frames (flashing) plus knockback.
- Enemy base class (HP, attack, XP, gold range, behavior `update()`), plus the **Slime** (hops toward the player).
- Drops: coins that you walk over to collect, and hearts (10% chance, heal 10).
- Enemies respawn on room re-entry: each room spawns fresh from its definition every time you enter it.

**Verify:** you can kill slimes, take damage, collect coins and hearts, and slimes come back after leaving and returning.

### Phase 3: Progression and remaining enemies
- XP and leveling: `xpToNext = 20 × level`, cap 10.
- Level-up overlay that pauses the game: choose **+10 Max HP** or **+2 Damage**, then fully heal.
- Remaining enemies, each with a distinct behavior:
  - **Bat**: fast, erratic flight (random direction changes, sine-wave wobble).
  - **Goblin**: wanders, then telegraphs (brief pause and flash) and charges when the player is near.
  - **Skeleton**: keeps distance and throws bone projectiles, with a short wind-up pose first.
  - **Knight**: slow, raises a shield on its facing side, so frontal hits bounce off with a "clink" spark. Hit it from the sides or back.
- Basic HUD placeholder (HP, level, XP, gold as text) so progression is visible.

**Verify:** all 5 enemy types work in a test room, leveling triggers the choice menu, and stats update.

### Phase 4: The world: all 5 areas, Village, NPCs, shop
- Build every room map:
  1. **Village** (3 screens): houses, shop building, story NPC, respawn point. No enemies.
  2. **Meadow** (3 screens): slimes. Sign "Recommended Lv 1".
  3. **Forest** (3–4 screens): bats and goblins. Sign "Recommended Lv 3".
  4. **Cave** (3 screens): skeletons, darker palette. Sign "Recommended Lv 5".
  5. **Castle** (3–4 screens): knights, ends at the boss room door. Sign "Recommended Lv 7".
- Dialogue system: a box at the bottom with a typewriter effect. E advances.
- Story NPC (the princess was captured by the Dark Lord), sign interactions, and a few flavor NPCs.
- Shop menu (talk to the shopkeeper): Swords, Armor, and Potion tabs. Each item shows `current → new` stats before you buy. Buying auto-equips and the old item can't be rebought. Potions cap at 5.
- Sword and armor sprites recolored by tier (wood brown → iron grey → steel blue → hero gold, cloth → leather → chain → plate).
- Potion use with Q.

**Verify:** you can walk Village → Castle gate, read signs and NPCs, buy gear with visible stat and sprite changes, and drink potions.

### Phase 5: Death, saving, HUD and title polish
- Death: a "You fell..." screen (about 2s), then respawn at the Village point at full HP. Keep level, XP and gear, and lose `floor(gold / 2)`.
- Save system: autosave to `localStorage` on entering any Village room. It stores stats, gear, potions, gold, level/XP, and the run stats (play time, kills, deaths, gold collected).
- Title screen: **Start** (new game) and **Continue** (greyed out when there's no save).
- Final HUD: HP bar, level, XP bar, gold, potion count, and sword/armor icons.
- Pause menu (Esc): Resume, controls reference, Quit to title.
- Run-stat tracking (timer runs only while playing, not while paused).

**Verify:** dying works with the correct gold loss, refreshing the page and pressing Continue restores progress, and the HUD is readable.

### Phase 6: Boss fight: The Dark Lord
- Boss room: the door locks behind the player when they step in, and a large boss HP bar appears at the top.
- **Phase 1 (above 50% HP):** walks toward the player and fires slow 3-way projectile fans. The boss glows and pauses for about 0.5s before each volley.
- **Phase 2 (below 50% HP):** a short transition (flash or roar), higher move speed, and a ground slam: a warning circle grows on the floor for 1s, then impacts. Projectile fans continue at a slower cadence.
- Telegraphing rules: every attack has a visible wind-up, and every attack ends in a recovery window where the boss is open to hits.
- Dying in the boss room respawns you in the Village. The boss resets to full HP.

**Verify:** the fight is readable and fair, and beatable at about Lv 7 with Steel + Chainmail (see the balance check below).

### Phase 7: Ending and final tuning
- On boss death: a fade, then the princess appears, a thank-you dialogue, and a fade out.
- Completion screen: "Congratulations! You saved the princess!" with final level, total play time, enemies defeated, deaths, and gold collected, plus a **Play Again** button (clears the save, back to title).
- Full playthrough pass: tune `config.js` to a relaxed 15–25 minute run, fix collision snags, and make sure no room can softlock you.

**Verify:** a complete run from title to completion screen works, and Play Again starts fresh.

---

## Balance sanity check (starting values, all in `config.js`)

**XP to reach Lv 7:** 20+40+60+80+100+120 = **420 XP**, roughly:
- Meadow: ~12 slimes (60 XP) → about Lv 3
- Forest: ~14 bats/goblins (~140 XP) → about Lv 5
- Cave: ~11 skeletons (~220 XP) → about Lv 7

That's about 37 kills, which fits the 15–25 minute target.

**Gold:** those same kills drop about 270g. That covers Steel (120) + Chainmail (100), with some left over for potions. A player who dies a lot might grind a little.

**Boss at Lv 7 + Steel + Chainmail**, assuming a balanced 3 HP / 3 damage level-up split:
- Player: 60 HP, 5 + 6 + 8 = 19 damage. That's **14 hits** to kill the 250 HP boss.
- Boss: 15 − 4 = **11 damage** per hit. The player survives 5 hits, about 10 with 5 potions.

This is forgiving enough when attacks are well telegraphed. If it plays too hard, the first knobs to turn are boss projectile speed, slam radius, and making boss *contact* damage lower than its attack value.

---

## Interpretation choices (flag any you want changed)
1. **Knight block:** frontal sword hits do 0 damage (with a visual spark). Hits from the side or back do full damage.
2. **Enemy contact:** touching any enemy deals its attack damage. Projectiles deal the attack value of the enemy that fired them.
3. **Shop:** you can't downgrade or rebuy gear you own. Higher tiers can be bought in any order (you could skip Iron).
4. **Boss retry:** the boss resets on death, and you keep everything except half your gold, same as normal deaths.
5. **Save timing:** autosave happens *only* on entering the Village (per spec), so quitting mid-dungeon loses progress back to the last Village visit.
6. **Play Again** wipes the save and starts a fresh game.

---

## How to run (once built)
```
cd heroquest
npm install
npm run dev
```
Then open the URL Vite prints (usually http://localhost:5173).
