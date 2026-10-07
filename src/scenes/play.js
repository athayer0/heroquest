// The main gameplay scene: current room, player, NPCs, enemies, projectiles, drops,
// interactions and flip-screen transitions.
import { TILE, ROOM_W, ROOM_H, HUD_H, EDGE_VEC, DEBUG } from '../constants.js';
import { TIMING, LEVELING, DEATH, SPELLS, SKILLS, PERKS, TERRAIN, CASTLE_GATE, POTION, MANA_POTION, SKILL_XP } from '../config.js';
import { SPELL_KEYS } from '../input.js';
import { World } from '../world/world.js';
import { AREAS } from '../world/areas.js';
import { ALL_ROOMS, START_ROOM } from '../world/rooms/index.js';
import { Player } from '../entities/player.js';
import { Npc } from '../entities/npc.js';
import { createEnemy } from '../entities/enemies/index.js';
import { createBoss, sealCount, rewardChestId, rewardContents } from '../entities/bosses/index.js';
import { Chest } from '../entities/chest.js';
import { FloatText, Spark, Puff, LevelUpBurst, Shockwave, HeartFloat } from '../entities/effects.js';
import { getHeartIcon } from '../entities/pickup.js';
import { playerAttackDamage, damageToPlayer } from '../systems/combat.js';
import { rollDrops } from '../systems/loot.js';
import { addXp, xpToNext } from '../systems/leveling.js';
import { castSpell } from '../systems/magic.js';
import { addSkillXp, heroBonus, perkValue, SKILL_IDS } from '../systems/skills.js';
import { updateStatus, applyBurn, applyChill, applyElement, isFrozen } from '../systems/status.js';
import { ventPhase } from '../world/tiles.js';
import { saveGame, applySave } from '../systems/save.js';
import { rectsOverlap, formatTime } from '../util.js';
import { drawText, drawTextShadow, textWidth } from '../gfx/font.js';
import { px } from '../gfx/sprites.js';
import { drawHud } from '../ui/hud.js';
import { drawPanel } from '../ui/panel.js';
import { LevelUpScene } from '../ui/levelUp.js';
import { DialogueScene } from '../ui/dialogue.js';
import { ShopScene } from '../ui/shop.js';
import { PauseScene } from '../ui/pause.js';
import { DeathScene } from '../ui/screens.js';
import { MapScene } from '../ui/map.js';

const PROBE = 10; // px in front of the hero checked for things to talk to
const FADE_IN = 0.6; // seconds of fade-in after starting or respawning
const TOAST_TIME = 1.6;
const BOSS_TRIGGER_Y = ROOM_H - 40; // the door locks once the hero walks this far into the throne room
const ENDING_FADE = 1.5;

export class PlayScene {
  // slot: the save file this game writes to. save: data from loadGame() to continue, or null for a new game.
  constructor(game, slot, save = null) {
    this.game = game;
    this.slot = slot;
    this.countsPlayTime = true;
    this.world = new World(ALL_ROOMS, AREAS);
    const home = this.world.get(START_ROOM);
    this.player = new Player(home.def.respawn.x * TILE, home.def.respawn.y * TILE);
    if (save) applySave(this.player, save);
    this.startRoomId = START_ROOM;
    // Keep only rooms that still exist, and fall back to the Village if the last town is unknown.
    const p = this.player;
    p.visitedRooms = new Set([...p.visitedRooms].filter((id) => this.world.rooms.has(id)));
    if (!this.world.rooms.get(p.lastVillage)?.area.village) p.lastVillage = START_ROOM;

    // Continue from the save point you saved at (a town or the merchant's camp); otherwise start in the Village.
    let start = home;
    const savedRoom = save?.location && this.world.rooms.get(save.location);
    if (savedRoom?.def.savePoint) {
      start = savedRoom;
      this.player.x = savedRoom.def.savePoint.x * TILE;
      this.player.y = savedRoom.def.savePoint.y * TILE;
    }
    this.transition = null; // { from, dir, t }
    this.pendingLevelUps = 0;
    this.celebrateT = 0; // level-up animation countdown before the menu opens
    this.interactTarget = null;
    this.toast = null; // { text, t }
    this.toastQueue = []; // more toasts waiting their turn
    this.saveLocation = save?.location ?? null; // where Continue starts: a save-point room, or null for the Village
    this.fadeT = FADE_IN;
    this.shakeT = 0;
    this.boss = null; // the boss while the fight is on
    this.bossFight = null; // { state: 'waiting' | 'active', bannerT, name, maxHp, introTime }
    this.bossBarHp = 0; // displayed HP; trails the real value
    this.bossDefeated = false; // the Dark Lord, this session (he returns on Continue after the ending)
    this.enterRoom(start);
  }

  // Every visit spawns the room fresh, so enemies respawn when you come back.
  enterRoom(room) {
    this.room = room;
    room.resetTiles();
    this.clearRoomContents();
    this.boss = null;
    this.bossFight = room.def.boss && this.bossFightReady(room.def.boss) ? { state: 'waiting' } : null;
    this.applySealGate(room);
    this.vents = [];
    room.map.forEach((row, ty) => [...row].forEach((ch, tx) => { if (ch === '^') this.vents.push({ tx, ty }); }));
    this.player.visitedRooms.add(room.id);
    if (DEBUG && room.area !== this.loggedArea) {
      this.loggedArea = room.area;
      this.runLog(`entered ${room.area.name}`);
    }
    if (room.area.village) {
      this.player.secondWindUsed = false; // a new trip begins
      this.player.lastVillage = room.area.hub; // dying brings you back here
    }
    this.npcs = (room.def.npcs ?? []).map((def) => new Npc(def));
    this.chests = (room.def.chests ?? []).map((def) => new Chest(def, this.player.openedChests.includes(def.id)));
    if (room.def.boss && this.rewardWaiting(room.def.boss)) this.chests.push(this.makeRewardChest(room.def.boss));
    room.solidRects = [...this.npcs, ...this.chests].map((n) => n.hitbox);
    for (const e of room.def.enemies ?? []) this.spawnEnemy(e.type, e.x * TILE, e.y * TILE);
    // Autosave in towns and at save points (the towns past the Village, the merchant's camp).
    // Save points also become where Continue starts; dying sends you to the last town you entered.
    const savesHere = room.area.village || room.def.savePoint;
    if (savesHere) {
      this.saveLocation = room.def.savePoint ? room.id : null;
      if (this.save()) this.showToast('GAME SAVED');
    }
  }

  // (x, y): top-left in room px. Enemies fade in with a puff.
  spawnEnemy(type, x, y) {
    const enemy = createEnemy(type, x, y);
    this.enemies.push(enemy);
    const c = enemy.center;
    this.effects.push(new Puff(c.x, c.y, enemy.spawnT));
  }

  save() {
    return saveGame(this.slot, this.player, this.saveLocation);
  }

  // Beaten at least once (mid-bosses: saved; the Dark Lord: this session only).
  bossBeaten(id) {
    return id === 'darkLord' ? this.bossDefeated : this.player.bossesDefeated.includes(id);
  }

  // A beaten mid-boss's reward chest that hasn't been opened yet.
  rewardWaiting(id) {
    return this.bossBeaten(id) && !!rewardContents(id) && !this.player.openedChests.includes(rewardChestId(id));
  }

  // The boss fights when you enter, unless its reward chest is still waiting to be opened.
  // Once it's opened, mid-bosses are back for a rematch (with no rewards) every time.
  bossFightReady(id) {
    if (id === 'darkLord') return !this.bossDefeated;
    return !this.rewardWaiting(id);
  }

  // The chest a boss leaves after its first defeat, placed clear of the hero so they can't get stuck in it.
  makeRewardChest(bossId) {
    const spots = [{ x: 7.5, y: 4 }, { x: 7.5, y: 2 }, { x: 3.5, y: 5 }, { x: 11.5, y: 5 }];
    const hb = this.player.hitbox;
    const clear = (s) => !rectsOverlap({ x: s.x * TILE - 4, y: s.y * TILE + 2, w: TILE + 8, h: TILE + 2 }, hb);
    const spot = spots.find(clear) ?? spots[0];
    return new Chest({ id: rewardChestId(bossId), ...spot, contents: rewardContents(bossId), reward: true }, false);
  }

  // The sealed gate before the Castle shows one socket per seal needed, filled by the seals you
  // hold; once you hold enough, it's open floor.
  applySealGate(room) {
    const gate = room.def.sealGate;
    if (!gate) return;
    const seals = sealCount(this.player);
    const open = seals >= CASTLE_GATE.sealsRequired;
    gate.forEach((g, i) => room.setTile(g.x, g.y, open ? room.ground : i < seals ? 'J' : 'G'));
  }

  // Toasts show one at a time; a few more can wait in line.
  showToast(text) {
    if (!this.toast) this.toast = { text, t: TOAST_TIME };
    else if (this.toastQueue.length < 3) this.toastQueue.push(text);
  }

  clearRoomContents() {
    this.npcs = [];
    this.chests = [];
    this.foundSecret = false;
    this.enemies = [];
    this.projectiles = [];
    this.pickups = [];
    this.effects = [];
  }

  update(dt) {
    this.fadeT = Math.max(0, this.fadeT - dt);
    this.shakeT = Math.max(0, this.shakeT - dt);
    if (this.toast && (this.toast.t -= dt) <= 0) {
      const next = this.toastQueue.shift();
      this.toast = next ? { text: next, t: TOAST_TIME } : null;
    }

    if (this.transition) {
      this.transition.t += dt;
      this.player.animT += dt;
      if (this.transition.t >= TIMING.roomSlide) {
        this.transition = null;
        this.enterRoom(this.room);
      }
      return;
    }

    if (this.ending) {
      this.updateEnding(dt);
      for (const fx of this.effects) fx.update(dt);
      this.effects = this.effects.filter((fx) => !fx.done);
      return;
    }

    const { player, room } = this;
    const input = this.game.input;

    if (input.wasPressed('pause')) {
      this.game.push(new PauseScene(this.game, player));
      return;
    }
    if (input.wasPressed('map')) {
      this.game.push(new MapScene(this.game, this));
      return;
    }
    if (DEBUG) this.debugKeys(input);
    if (input.wasPressed('potion')) this.drinkPotion();
    if (input.wasPressed('manaPotion')) this.drinkManaPotion();
    for (let i = 0; i < SPELL_KEYS; i++) if (input.wasPressed(`spell${i + 1}`)) player.selectSpell(i);
    if (input.wheel) player.cycleSpell(input.wheel);

    this.interactTarget = this.findInteraction();
    if (input.wasPressed('interact') && this.interactTarget && !player.attacking) {
      this.interact(this.interactTarget);
      return;
    }

    const enemyCtx = {
      player,
      room,
      enemies: this.enemies,
      spawnProjectile: (p) => this.projectiles.push(p),
      spawnEnemy: (type, x, y) => this.spawnEnemy(type, x, y),
      countEnemies: (type) => this.enemies.filter((e) => e.type === type && !e.dead).length,
      addEffect: (fx) => this.effects.push(fx),
      clearProjectiles: () => { this.projectiles = []; },
      shake: (seconds) => this.shake(seconds),
      slam: (x, y, radius, attack) => this.slam(x, y, radius, attack),
      hurtPlayer: (attack, x, y, source) => this.hurtPlayer(attack, x, y, source),
      awakenStatues: () => this.awakenStatues(),
      strike: (enemy, damage, from) => this.spellStrike(enemy, damage, from),
      onBossDefeated: (boss) => this.onBossDefeated(boss),
      addSkillXp: (id, amount) => this.addSkillXp(id, amount),
    };
    player.update(dt, input, room);
    if (input.rightClicked && input.pointer) this.castSpell({ x: input.pointer.x, y: input.pointer.y - HUD_H }, enemyCtx);
    for (const e of this.enemies) e.update(dt, enemyCtx);
    for (const p of this.projectiles) {
      p.update(dt, room);
      if (p.dead && p.friendly) {
        this.effects.push(new Puff(p.x, p.y, 0.2, '#ffb040')); // fizzles against a wall
        this.breakCrackedWalls((r) => rectsOverlap(r, { x: p.x - 6, y: p.y - 6, w: 12, h: 12 }));
      }
    }
    for (const p of this.pickups) p.update(dt, room);
    for (const fx of this.effects) fx.update(dt);

    this.updateStatuses(dt);
    this.updateVents();
    this.resolveCombat();
    this.resolveProjectiles();
    this.collectPickups();

    this.enemies = this.enemies.filter((e) => !e.dead);
    this.projectiles = this.projectiles.filter((p) => !p.dead);
    this.pickups = this.pickups.filter((p) => !p.expired);
    this.effects = this.effects.filter((fx) => !fx.done);

    if (player.hp <= 0) {
      this.startDeath();
      return;
    }

    this.updateBossFight(dt);

    if (this.celebrateT > 0) {
      this.celebrateT -= dt;
      this.keepPlayerInRoom(); // no leaving the screen mid-celebration
      if (this.celebrateT <= 0) this.openLevelUp();
      return;
    }

    const edge = player.exitEdge();
    if (edge && room.neighbors[edge]) this.startTransition(edge);
  }

  // ---------- Debug (?debug in the URL) ----------
  //   B burn / C chill the hero and every enemy   T test room (again: back to the Village)
  //   K throne room   P +10 to every skill and +5 perk points   G +1000 gold

  debugKeys(input) {
    const { player } = this;
    const everyone = [player, ...this.enemies.filter((e) => e.active)];
    if (input.wasPressed('debugBurn')) everyone.forEach((t) => applyBurn(t));
    if (input.wasPressed('debugChill')) everyone.forEach((t) => applyChill(t));
    if (input.wasPressed('debugTestRoom')) this.debugTeleport(this.room.id === 'debug_test' ? START_ROOM : 'debug_test');
    if (input.wasPressed('debugThrone')) this.debugTeleport('castle_throne', { x: 7.5 * TILE, y: 8 * TILE });
    if (input.wasPressed('debugSkills')) {
      for (const id of SKILL_IDS) player.skills[id].level = Math.min(SKILL_XP.maxLevel, player.skills[id].level + 10);
      player.perkPoints += 5;
      this.showToast('DEBUG: SKILLS +10');
    }
    if (input.wasPressed('debugGold')) {
      player.gold += 1000;
      this.showToast('DEBUG: +1000 GOLD');
    }
  }

  // Run log for balance playtests (?debug): one console line per new area, boss win and death,
  // also kept in window.heroquestRun so the whole run can be copied at the end.
  runLog(event) {
    const p = this.player;
    const s = (id) => p.skills[id].level;
    const line = `[run] ${formatTime(p.stats.playTime)} ${event} | Lv ${p.level} (${Math.floor(p.xp)}/${xpToNext(p.level)} xp) `
      + `HP ${p.maxHp} MP ${p.maxMana} | gold ${p.gold} | ${p.sword.name}, ${p.armor.name} | kills ${p.stats.kills} deaths ${p.stats.deaths} `
      + `| perks ${p.perks.length} (+${p.perkPoints} unspent) | blade ${s('blade')} armor ${s('armor')} `
      + `destruction ${s('destruction')} restoration ${s('restoration')}`;
    console.log(line);
    (globalThis.heroquestRun ??= []).push(line);
  }

  debugTeleport(roomId, at = null) {
    const room = this.world.get(roomId);
    const spot = at ?? room.def.savePoint ?? room.def.respawn ?? { x: 7.5, y: 5 };
    const { player } = this;
    player.x = at ? spot.x : spot.x * TILE;
    player.y = at ? spot.y : spot.y * TILE;
    player.clearCombatState();
    this.fadeT = FADE_IN;
    this.enterRoom(room);
  }

  // ---------- Interaction ----------

  probeRect() {
    const hb = this.player.hitbox;
    switch (this.player.facing) {
      case 'up': return { x: hb.x + 1, y: hb.y - PROBE, w: hb.w - 2, h: PROBE };
      case 'down': return { x: hb.x + 1, y: hb.y + hb.h, w: hb.w - 2, h: PROBE };
      case 'left': return { x: hb.x - PROBE, y: hb.y, w: PROBE, h: hb.h };
      case 'right': return { x: hb.x + hb.w, y: hb.y, w: PROBE, h: hb.h };
    }
  }

  // What the hero is facing that can be talked to or read: an NPC, a sign, or the shop counter.
  findInteraction() {
    const probe = this.probeRect();
    for (const npc of this.npcs) {
      if (rectsOverlap(probe, npc.hitbox)) return { kind: 'npc', npc, anchor: { x: npc.x + 8, y: npc.y - 2 } };
    }
    for (const chest of this.chests) {
      if (!chest.opened && rectsOverlap(probe, chest.hitbox)) return { kind: 'chest', chest, anchor: { x: chest.x + 8, y: chest.y + 2 } };
    }
    const { room } = this;
    const x0 = Math.floor(probe.x / TILE);
    const x1 = Math.floor((probe.x + probe.w - 0.001) / TILE);
    const y0 = Math.floor(probe.y / TILE);
    const y1 = Math.floor((probe.y + probe.h - 0.001) / TILE);
    for (let ty = y0; ty <= y1; ty++) {
      for (let tx = x0; tx <= x1; tx++) {
        const ch = room.tileAt(tx, ty);
        const anchor = { x: tx * TILE + 8, y: ty * TILE - 2 };
        if (ch === 'S') {
          const sign = room.def.signs?.find((s) => s.x === tx && s.y === ty);
          if (sign) return { kind: 'sign', sign, anchor };
        }
        if (ch === 'C' && room.def.shop) return { kind: 'shop', anchor };
        if (ch === 'G' || ch === 'J') return { kind: 'gate', anchor };
      }
    }
    return null;
  }

  interact(target) {
    const { game } = this;
    this.player.moving = false;
    if (target.kind === 'npc' && target.npc.def.shop) {
      // Merchant NPCs can open a shop directly (def.shop: a key of SHOPS).
      game.push(new ShopScene(game, this.player, target.npc.def.shop));
    } else if (target.kind === 'npc') {
      // An NPC with a gift (the Elder's Firebolt) adds a few lines and hands it over once.
      const { npc } = target;
      const gift = npc.def.gift;
      const giving = gift && !this.player.knowsSpell(gift.spell);
      game.push(new DialogueScene(game, {
        speaker: npc.name,
        messages: giving ? [...npc.lines, ...gift.lines] : npc.lines,
        onDone: giving ? () => this.learnSpell(gift.spell) : undefined,
      }));
    } else if (target.kind === 'gate') {
      const seals = sealCount(this.player);
      game.push(new DialogueScene(game, { messages: [
        `The Castle gate is sealed. ${seals} of ${CASTLE_GATE.sealsRequired} seals are in place.`,
        "The Sand Pharaoh guards one in his tomb in the Desert. The Frost Wyrm guards the other in its lair here in the Peaks.",
      ] }));
    } else if (target.kind === 'chest') {
      this.openChest(target.chest);
    } else if (target.kind === 'sign') {
      game.push(new DialogueScene(game, { messages: [target.sign.text] }));
    } else if (target.kind === 'shop') {
      game.push(new ShopScene(game, this.player, this.room.def.shop)); // a key of SHOPS
    }
  }

  drinkPotion() {
    const { player } = this;
    const pc = player.center;
    if (player.potions <= 0) {
      this.effects.push(new FloatText('NO POTIONS', pc.x, pc.y - 18, '#c0c0d0'));
    } else if (player.hp >= player.maxHp) {
      this.effects.push(new FloatText('HP IS FULL', pc.x, pc.y - 18, '#c0c0d0'));
    } else {
      const healed = player.drinkPotion();
      this.effects.push(new FloatText(`+${healed}`, pc.x, pc.y - 18, '#80ff90'));
    }
  }

  // Chests open once; what's inside goes straight to the hero. Potions over the carry limit are lost.
  openChest(chest) {
    const { player } = this;
    chest.opened = true;
    player.openedChests.push(chest.id);
    const c = { x: chest.x + 8, y: chest.y };
    this.effects.push(new Puff(c.x, c.y + 6, 0.4, '#ffe060'));
    const { spell, gold, potions, manaPotions, seal } = chest.def.contents;
    const texts = [];
    if (gold) {
      player.gold += gold;
      player.stats.goldCollected += gold;
      texts.push(`+${gold}G`);
    }
    if (potions) {
      player.potions = Math.min(POTION.max, player.potions + potions);
      texts.push(`+${potions} POTION${potions > 1 ? 'S' : ''}`);
    }
    if (manaPotions) {
      player.manaPotions = Math.min(MANA_POTION.max, player.manaPotions + manaPotions);
      texts.push(`+${manaPotions} MANA POTION${manaPotions > 1 ? 'S' : ''}`);
    }
    texts.forEach((text, i) => this.effects.push(new FloatText(text, c.x, c.y - 6 - i * 9, '#ffe070', 1.4)));
    if (spell) this.learnSpell(spell);
    if (seal) this.showToast('GOT A CASTLE SEAL!');
    if (chest.def.reward) this.save(); // a boss's rewards are saved right away
  }

  drinkManaPotion() {
    const { player } = this;
    const pc = player.center;
    if (player.manaPotions <= 0) {
      this.effects.push(new FloatText('NO MANA POTIONS', pc.x, pc.y - 18, '#c0c0d0'));
    } else if (player.mana >= player.maxMana) {
      this.effects.push(new FloatText('MP IS FULL', pc.x, pc.y - 18, '#c0c0d0'));
    } else {
      const restored = player.drinkManaPotion();
      this.effects.push(new FloatText(`+${restored} MP`, pc.x, pc.y - 18, '#80b0ff'));
    }
  }

  // ---------- Magic ----------

  castSpell(target, ctx) {
    const { player } = this;
    if (!player.spellId) {
      const pc = player.center;
      this.effects.push(new FloatText('NO SPELLS YET', pc.x, pc.y - 18, '#c0c0d0'));
      return;
    }
    castSpell(player, target, ctx);
  }

  learnSpell(id) {
    const { player } = this;
    player.learnSpell(id);
    this.effects.push(new LevelUpBurst(player, 0.8));
    this.showToast(`LEARNED ${SPELLS[id].name.toUpperCase()}!`);
  }

  // ---------- Combat ----------

  resolveCombat() {
    const { player } = this;
    const pc = player.center;
    if (player.attacking) this.breakCrackedWalls((r) => player.swordHits(r));

    for (const enemy of this.enemies) {
      if (!enemy.active) continue;

      if (player.swordHits(enemy.hitbox)) {
        const { damage, label } = this.swordDamage(enemy);
        const result = enemy.hurt(damage, pc.x, pc.y, player.swingId);
        const c = enemy.center;
        if (result === true) {
          const stats = enemy.stats;
          this.addSkillXp('blade', stats.bladeXpPerHit ?? stats.xp * SKILLS.blade.xpPerEnemyXp);
          if (label) this.effects.push(new FloatText(label, c.x, c.y - 14, '#ffe040'));
        }
        this.showHitResult(enemy, result, (c.x + pc.x) / 2, (c.y + pc.y) / 2);
        if (result === 'blocked') player.pushBack(c.x, c.y);
      }

      if (enemy.active && !enemy.harmless && rectsOverlap(player.hitbox, enemy.hitbox)) {
        const c = enemy.center;
        this.hurtPlayer(enemy.attack, c.x, c.y, enemy);
      }
    }
  }

  // One sword hit's damage with perk bonuses, plus a label for the special ones.
  swordDamage(enemy) {
    const { player } = this;
    let damage = playerAttackDamage(player) * this.shatterMult(enemy);
    let label = null;
    if (player.riposting) {
      damage *= PERKS.blade.riposte.damageMult;
      label = 'RIPOSTE!';
    }
    if (Math.random() < heroBonus.critChance(player)) {
      damage *= PERKS.blade.criticalEdge.damageMult;
      label = 'CRITICAL!';
    }
    return { damage: Math.round(damage), label };
  }

  // Cracked walls ('W') crumble when `hits(tileRect)` is true for them, opening secret passages.
  breakCrackedWalls(hits) {
    const { room } = this;
    room.map.forEach((row, ty) => [...row].forEach((ch, tx) => {
      if (ch !== 'W') return;
      const r = { x: tx * TILE, y: ty * TILE, w: TILE, h: TILE };
      if (!hits(r)) return;
      room.setTile(tx, ty, room.ground);
      this.effects.push(new Puff(r.x + 8, r.y + 8, 0.45, '#c8c0d0'));
      if (!this.foundSecret) {
        this.foundSecret = true;
        this.showToast('A SECRET PASSAGE!');
      }
    }));
  }

  // Chain Lightning (and other instant spells): full spell damage that ignores shields.
  spellStrike(enemy, damage, from) {
    const dealt = Math.round(damage * this.shatterMult(enemy));
    const result = enemy.hurt(dealt, from.x, from.y, null, { unblockable: true });
    if (result === true) this.addSkillXp('destruction', dealt * SKILLS.destruction.xpPerDamage);
    const c = enemy.center;
    this.showHitResult(enemy, result, c.x, c.y, '#ffffa0');
  }

  // The Dark Lord's third phase: every statue in the room wakes up as a gargoyle.
  awakenStatues() {
    const { room } = this;
    room.map.forEach((row, ty) => [...row].forEach((ch, tx) => {
      if (ch !== 'Z') return;
      room.setTile(tx, ty, room.ground);
      this.effects.push(new Puff(tx * TILE + 8, ty * TILE + 8, 0.5, '#9890a8'));
      this.spawnEnemy('gargoyle', tx * TILE, ty * TILE);
    }));
    this.shake(0.4);
  }

  // Shatter: extra damage to frozen enemies.
  shatterMult(enemy) {
    return isFrozen(enemy) ? 1 + perkValue(this.player, 'frozenDamagePct') / 100 : 1;
  }

  // Sparks and BLOCK text where a sword or spell hit lands; a killing hit defeats the enemy.
  showHitResult(enemy, result, x, y, color = '#ffffff') {
    if (result === 'blocked') {
      const c = enemy.center;
      this.effects.push(new Spark(x, y, '#ffe040'));
      this.effects.push(new FloatText('BLOCK', c.x, c.y - 14, '#c0c0d0'));
    } else if (result) {
      this.effects.push(new Spark(x, y, color));
      if (enemy.dead) this.onEnemyDefeated(enemy);
    }
  }

  // The hero's bolts burst on the first enemy they touch (even if it can't be hurt right now).
  // A Piercing bolt carries on through its first enemy (each enemy is hit once). Shields stop it.
  // Bolts also shoot down enemy projectiles marked shootable (the Dark Lord's homing orbs).
  resolveFriendlyProjectile(p) {
    for (const q of this.projectiles) {
      if (q.dead || q.friendly || !q.shootable || !rectsOverlap(p.rect, q.rect)) continue;
      p.dead = true;
      q.dead = true;
      this.effects.push(new Spark(q.x, q.y, '#ffe080'));
      this.effects.push(new Puff(q.x, q.y, 0.25, '#ff8a7a'));
      return;
    }
    for (const enemy of this.enemies) {
      if (!enemy.active || p.hits.has(enemy) || !rectsOverlap(enemy.hitbox, p.rect)) continue;
      p.hits.add(enemy);
      // Immune to the bolt's element (a Firebolt on a fire spirit): it just fizzles.
      if (enemy.immune.includes(p.element)) {
        p.dead = true;
        const c = enemy.center;
        this.effects.push(new Puff(p.x, p.y, 0.25, '#ffb040'));
        this.effects.push(new FloatText('IMMUNE', c.x, c.y - 14, '#c0c0d0'));
        return;
      }
      // The hit comes from behind the bolt, so knockback follows its flight (and shields block it head-on).
      // Weak enemies take double damage from the bolt's element; Shatter adds to hits on frozen ones.
      const weakMult = enemy.weak.includes(p.element) ? 2 : 1;
      const damage = Math.round(p.attack * weakMult * this.shatterMult(enemy));
      const result = enemy.hurt(damage, p.x - p.vx, p.y - p.vy);
      if (p.pierce > 0 && result !== 'blocked') p.pierce--;
      else p.dead = true;
      if (result === true) {
        this.addSkillXp('destruction', damage * SKILLS.destruction.xpPerDamage);
        if (!enemy.dead) applyElement(enemy, p.element, this.heroBurnOpts());
      }
      this.effects.push(new Puff(p.x, p.y, 0.25, '#ffb040'));
      this.showHitResult(enemy, result, p.x, p.y, '#ffe080');
      return;
    }
  }

  resolveProjectiles() {
    const { player } = this;
    const pc = player.center;
    for (const p of this.projectiles) {
      if (p.dead) continue;
      if (p.friendly) {
        this.resolveFriendlyProjectile(p);
        continue;
      }
      if (player.wardT > 0 && Math.hypot(p.x - pc.x, p.y - pc.y) <= SPELLS.ward.radius) {
        p.dead = true;
        this.effects.push(new Spark(p.x, p.y, '#a0e0ff'));
        this.effects.push(new Puff(p.x, p.y, 0.2, '#a0e0ff'));
        continue;
      }
      if (p.swordable && player.swordHits(p.rect)) {
        p.dead = true;
        this.effects.push(new Spark(p.x, p.y));
        continue;
      }
      if (rectsOverlap(player.hitbox, p.rect) && this.hurtPlayer(p.attack, p.x, p.y, p)) {
        p.dead = true;
        applyElement(player, p.element);
      }
    }
  }

  // source: whatever is attacking (an enemy, a projectile, a slam), so a roll that passes
  // through it only reads as one dodge. Returns true if the hit landed.
  hurtPlayer(attack, fromX, fromY, source) {
    const { player } = this;
    const dmg = damageToPlayer(attack, player.defense);
    const hpBefore = player.hp;
    const result = player.takeHit(dmg, fromX, fromY);
    const pc = player.center;
    if (result === 'dodged' && !player.dodged.has(source)) {
      player.dodged.add(source);
      player.onPerfectDodge();
      this.effects.push(new FloatText('DODGE!', pc.x, pc.y - 14, '#a0e0ff'));
    }
    if (result !== true) return false;
    this.effects.push(new FloatText(`-${hpBefore - player.hp}`, pc.x, pc.y - 14, '#ff8080'));
    this.announceSecondWind();
    // Not on a lethal hit: a level-up would refill HP and cheat death.
    if (player.hp > 0) this.addSkillXp('armor', dmg * SKILLS.armor.xpPerDamage);
    this.applyThorns(source, dmg);
    return true;
  }

  announceSecondWind() {
    const { player } = this;
    if (!player.secondWindFired) return;
    player.secondWindFired = false;
    const pc = player.center;
    this.effects.push(new LevelUpBurst(player, 0.8));
    this.effects.push(new FloatText('SECOND WIND!', pc.x, pc.y - 24, '#80ff90', 1.4));
  }

  // Burns the hero causes: Inferno makes them stronger and longer.
  heroBurnOpts() {
    const { player } = this;
    return {
      byHero: true,
      damageMult: 1 + perkValue(player, 'burnDamagePct') / 100,
      extraTime: perkValue(player, 'burnTimeBonus'),
    };
  }

  // Burn ticks: no knockback or i-frames. The hero's burns on enemies count as Destruction damage.
  updateStatuses(dt) {
    const { player } = this;
    const burn = updateStatus(player, dt);
    if (burn > 0) {
      const pc = player.center;
      player.loseHp(burn);
      this.effects.push(new FloatText(`-${burn}`, pc.x, pc.y - 14, '#ffa050'));
      this.announceSecondWind();
    }
    for (const enemy of this.enemies) {
      if (!enemy.active) continue;
      const dmg = updateStatus(enemy, dt);
      if (dmg <= 0) continue;
      const c = enemy.center;
      this.effects.push(new FloatText(`${dmg}`, c.x, c.y - 12, '#ffa050', 0.5));
      if (enemy.status.burnByHero) this.addSkillXp('destruction', dmg * SKILLS.destruction.xpPerDamage);
      if (enemy.loseHp(dmg)) this.onEnemyDefeated(enemy);
    }
  }

  // Fire vents: each eruption hurts and burns whatever stands on the vent, once.
  updateVents() {
    const time = this.game.time;
    const { player } = this;
    const { attack } = TERRAIN.vent;
    for (const { tx, ty } of this.vents) {
      const phase = ventPhase(tx, ty, time);
      if (phase.state !== 'erupt') continue;
      const rect = { x: tx * TILE + 2, y: ty * TILE + 2, w: TILE - 4, h: TILE - 4 };
      const key = `vent ${tx},${ty},${phase.cycle}`; // one eruption = one attack (for dodging too)
      const cx = tx * TILE + 8;
      const cy = ty * TILE + 8;
      if (rectsOverlap(player.hitbox, rect) && this.hurtPlayer(attack, cx, cy, key)) applyBurn(player);
      for (const enemy of this.enemies) {
        if (!enemy.active || enemy.flying || enemy.lastVent === key || !rectsOverlap(enemy.hitbox, rect)) continue;
        enemy.lastVent = key;
        if (enemy.hurt(attack, cx, cy) === true) {
          applyBurn(enemy);
          if (enemy.dead) this.onEnemyDefeated(enemy);
        }
      }
    }
  }

  // Thorns: an enemy that hurts you by touching you takes a share of the damage back.
  applyThorns(source, dmg) {
    const share = heroBonus.thorns(this.player);
    if (!share || !this.enemies.includes(source) || !source.active) return;
    const pc = this.player.center;
    const c = source.center;
    const result = source.hurt(Math.max(1, Math.round(dmg * share)), pc.x, pc.y);
    this.showHitResult(source, result, (c.x + pc.x) / 2, (c.y + pc.y) / 2, '#c0ff80');
  }

  // Skill XP also feeds the hero's XP. Skill level-ups get a toast, e.g. "BLADE 5".
  addSkillXp(id, amount) {
    const { skillLevels, heroLevels } = addSkillXp(this.player, id, amount);
    if (skillLevels > 0) this.showToast(`${SKILLS[id].name.toUpperCase()} ${this.player.skills[id].level}`);
    this.onHeroLevels(heroLevels);
  }

  onHeroLevels(gained) {
    if (gained <= 0) return;
    this.pendingLevelUps += gained;
    if (this.celebrateT <= 0) this.startLevelUpCelebration();
  }

  onEnemyDefeated(enemy) {
    const c = enemy.center;
    const { player } = this;
    player.stats.kills++;
    const xp = enemy.stats.xp;
    this.onHeroLevels(addXp(player, xp));
    this.effects.push(new Puff(c.x, c.y));
    this.effects.push(new FloatText(`+${xp} XP`, c.x, c.y - 12, '#a0e0ff'));
    this.pickups.push(...rollDrops(enemy));
  }

  // Level-up animation: HP refills and the hero glows (invincible) while play continues;
  // the menu opens when it finishes.
  startLevelUpCelebration() {
    const { player } = this;
    const pc = player.center;
    const healed = player.maxHp - player.hp;
    player.hp = player.maxHp;
    player.grantGlow(LEVELING.celebrateTime);
    this.celebrateT = LEVELING.celebrateTime;
    this.effects.push(new LevelUpBurst(player, LEVELING.celebrateTime));
    this.effects.push(new FloatText('LEVEL UP!', pc.x, pc.y - 20, '#ffe040', LEVELING.celebrateTime));
    if (healed > 0) this.effects.push(new FloatText(`+${healed}`, pc.x, pc.y - 30, '#80ff90', LEVELING.celebrateTime));
  }

  // Shows one level-up menu per level gained, one after another; the hero keeps
  // glowing for a moment after the last one closes.
  openLevelUp() {
    this.pendingLevelUps--;
    this.game.push(new LevelUpScene(this.game, this.player, () => {
      if (this.pendingLevelUps > 0) this.openLevelUp();
      else this.player.grantGlow(LEVELING.postMenuInvincibleTime);
    }));
  }

  keepPlayerInRoom() {
    const { player } = this;
    const hb = player.hitbox;
    if (hb.x < 0) player.x -= hb.x;
    if (hb.y < 0) player.y -= hb.y;
    if (hb.x + hb.w > ROOM_W) player.x -= hb.x + hb.w - ROOM_W;
    if (hb.y + hb.h > ROOM_H) player.y -= hb.y + hb.h - ROOM_H;
  }

  collectPickups() {
    const { player } = this;
    const hb = player.hitbox;
    for (const p of this.pickups) {
      if (!p.collectable || !rectsOverlap(hb, p.rect)) continue;
      p.collected = true;
      if (p.kind === 'coin') {
        player.gold += p.value;
        player.stats.goldCollected += p.value;
        this.effects.push(new FloatText(`+${p.value}G`, p.x, p.y - 10, '#ffe070'));
      } else if (p.kind === 'heart') {
        const healed = player.heal(p.value);
        this.effects.push(new FloatText(`+${healed}`, p.x, p.y - 10, '#80ff90'));
      }
    }
  }

  // ---------- Boss fight ----------

  updateBossFight(dt) {
    const fight = this.bossFight;
    if (!fight) return;
    if (fight.state === 'waiting') {
      if (this.player.center.y < BOSS_TRIGGER_Y) this.startBossFight();
      return;
    }
    fight.bannerT = Math.max(0, fight.bannerT - dt);
    if (!this.boss) return;
    // The bar fills up during the intro, then trails behind damage.
    const { maxHp, introTime } = fight;
    const intro = this.boss.state === 'intro';
    const target = intro ? maxHp * (1 - fight.bannerT / introTime) : this.boss.hp;
    const rate = intro ? maxHp : 60;
    this.bossBarHp = target < this.bossBarHp && !intro
      ? Math.max(target, this.bossBarHp - rate * dt)
      : Math.min(maxHp, Math.max(target, this.bossBarHp));
  }

  // The door slams shut behind the hero and the room's boss appears.
  startBossFight() {
    const { room } = this;
    for (const d of room.def.bossDoor ?? []) room.setTile(d.x, d.y, 'L');
    this.shake(0.3);
    this.boss = createBoss(room.def.boss);
    this.enemies.push(this.boss);
    const c = this.boss.center;
    this.effects.push(new Puff(c.x, c.y, 0.6, '#d050f0'));
    const { name, introTime } = this.boss.stats;
    this.bossFight = { state: 'active', bannerT: introTime, name, introTime, maxHp: this.boss.maxHp };
    this.bossBarHp = 0;
  }

  // A burst of damage in a circle. Returns true if it hit the hero.
  slam(x, y, radius, attack) {
    this.effects.push(new Shockwave(x, y, radius));
    const pc = this.player.center;
    return Math.hypot(pc.x - x, pc.y - y) <= radius + 4 && this.hurtPlayer(attack, x, y, {});
  }

  shake(seconds) {
    this.shakeT = Math.max(this.shakeT, seconds);
  }

  // A boss falls. Its drop (a spell tome and/or a Castle seal) is only given the first time.
  // A mid-boss is saved as beaten right away; the Dark Lord starts the ending.
  onBossDefeated(boss) {
    const c = boss.center;
    const { player } = this;
    const firstTime = !player.bossesDefeated.includes(boss.id);
    if (firstTime) player.bossesDefeated.push(boss.id);
    this.boss = null;
    this.bossFight = null;
    this.projectiles = [];
    player.stats.kills++;
    player.clearCombatState();
    player.invulnT = 0;
    this.room.resetTiles(); // door unlocks
    this.applySealGate(this.room);
    this.shake(0.5);
    this.effects.push(new Puff(c.x, c.y, 0.8, '#ffe060'));
    this.effects.push(new FloatText('VICTORY!', c.x, c.y - 10, '#ffe040', 2));
    // Anything the boss summoned crumbles away (no rewards for those).
    for (const e of this.enemies) {
      if (e === boss || e.dead) continue;
      e.dead = true;
      const ec = e.center;
      this.effects.push(new Puff(ec.x, ec.y));
    }
    // First win only: hero XP now, and the gold, spell and seal in a chest that appears.
    const { xp } = boss.stats;
    if (firstTime && xp) {
      this.effects.push(new FloatText(`+${xp} XP`, c.x, c.y + 2, '#a0e0ff', 2));
      this.onHeroLevels(addXp(player, xp));
    }
    if (firstTime && rewardContents(boss.id)) {
      const chest = this.makeRewardChest(boss.id);
      this.chests.push(chest);
      this.room.solidRects.push(chest.hitbox);
      this.effects.push(new Puff(chest.x + 8, chest.y + 10, 0.6, '#ffe060'));
    }
    // Rematches (after the chest is opened) still pay some gold, straight to the hero.
    const { rematchGold } = boss.stats;
    if (!firstTime && rematchGold) {
      player.gold += rematchGold;
      player.stats.goldCollected += rematchGold;
      this.effects.push(new FloatText(`+${rematchGold}G`, c.x, c.y + 2, '#ffe070', 2));
    }
    if (DEBUG) this.runLog(`beat ${boss.name}`);
    if (!boss.stats.final) {
      this.save();
      return;
    }

    this.bossDefeated = true;
    this.finalStats = {
      ...player.stats,
      level: player.level,
      swordId: player.sword.id,
      armorId: player.armor.id,
    };
    this.ending = { phase: 'pause', t: 1.6 };
    this.countsPlayTime = false;
  }

  // ---------- Ending cutscene ----------
  // pause → the princess appears and walks to the hero → dialogue → hearts → fade → completion screen.

  updateEnding(dt) {
    const e = this.ending;
    const { player } = this;
    e.t -= dt;
    player.moving = false;

    if (e.phase === 'pause' && e.t <= 0) {
      const princess = new Npc({ x: 0, y: 0, look: 'princess', name: 'Princess', lines: [] });
      princess.x = ROOM_W / 2 - 8;
      princess.y = 1.5 * TILE;
      this.princess = princess;
      this.npcs.push(princess);
      this.effects.push(new Puff(princess.x + 8, princess.y + 8, 0.6, '#ffc0e0'));
      this.effects.push(new LevelUpBurst(princess, 1));
      e.phase = 'walk';
      e.t = 4; // safety limit on the walk
    } else if (e.phase === 'walk') {
      const pr = this.princess;
      // Stop just in front of the hero (above if there's room, otherwise below).
      const pc = player.center;
      const tx = player.x;
      const ty = pc.y > 3 * TILE ? player.y - 18 : player.y + 18;
      const dx = tx - pr.x;
      const dy = ty - pr.y;
      const dist = Math.hypot(dx, dy);
      const step = 36 * dt;
      if (dist > step && e.t > 0) {
        pr.x += (dx / dist) * step;
        pr.y += (dy / dist) * step;
      } else {
        player.facing = pr.y < player.y ? 'up' : 'down';
        e.phase = 'talk';
        this.game.push(new DialogueScene(this.game, {
          speaker: 'PRINCESS',
          messages: [
            'You came for me! I knew someone would.',
            'The Dark Lord is gone, and the kingdom is free at last. Thank you, brave hero!',
            "Come, let's go home. The whole village will want to celebrate!",
          ],
          onDone: () => {
            e.phase = 'hearts';
            e.t = 2;
            e.heartT = 0;
          },
        }));
      }
    } else if (e.phase === 'hearts') {
      e.heartT -= dt;
      if (e.heartT <= 0) {
        e.heartT = 0.22;
        const pr = this.princess;
        const mx = (pr.x + player.x) / 2 + 8;
        const my = Math.min(pr.y, player.y) - 2;
        this.effects.push(new HeartFloat(mx + (Math.random() - 0.5) * 20, my, getHeartIcon()));
      }
      if (e.t <= 0) {
        e.phase = 'fade';
        e.t = ENDING_FADE;
      }
    } else if (e.phase === 'fade' && e.t <= 0) {
      // Keep the file: mark it cleared and save, so Continue picks up in the Village.
      this.player.cleared = true;
      saveGame(this.slot, this.player);
      this.game.finishGame(this.finalStats);
    }
  }

  // ---------- Death ----------

  // Gold is lost right away so the death screen can show the amount.
  startDeath() {
    const { player } = this;
    if (DEBUG) this.runLog(`died in ${this.room.area.name}`);
    const lost = Math.floor(player.gold * DEATH.goldLossFraction);
    player.gold -= lost;
    player.stats.deaths++;
    player.clearCombatState();
    player.moving = false;
    this.celebrateT = 0;
    this.pendingLevelUps = 0;
    this.game.push(new DeathScene(this.game, this, lost));
  }

  // Back to the last town you entered at full HP; level, XP and gear are kept. Entering it autosaves.
  respawn() {
    const { player } = this;
    player.hp = player.maxHp;
    player.facing = 'down';
    player.invulnT = 0;
    player.glowT = 0;
    this.placeInTown(player.lastVillage);
  }

  // Puts the hero at a town's respawn spot and enters it (which autosaves).
  placeInTown(roomId) {
    const { player } = this;
    const room = this.world.get(roomId);
    const spot = room.def.respawn ?? room.def.savePoint;
    player.x = spot.x * TILE;
    player.y = spot.y * TILE;
    player.clearCombatState();
    this.fadeT = FADE_IN;
    this.enterRoom(room);
  }

  // ---------- Fast travel ----------

  // Towns you've visited, other than the one you're in: [{ roomId, name }].
  travelDestinations() {
    const out = [];
    for (const room of this.world.rooms.values()) {
      const { area } = room;
      if (!area?.village || area.hub !== room.id || area === this.room.area) continue;
      if (this.player.visitedRooms.has(room.id)) out.push({ roomId: room.id, name: area.name });
    }
    return out;
  }

  // Allowed only once the room you're in has no enemies left, and never during a boss fight.
  canFastTravel() {
    if (this.bossFight?.state === 'active') return { ok: false, reason: "YOU CAN'T FLEE THIS FIGHT!" };
    if (this.enemies.some((e) => !e.dead)) return { ok: false, reason: 'DEFEAT THE ENEMIES HERE FIRST' };
    if (this.transition || this.ending) return { ok: false, reason: '' };
    return { ok: true };
  }

  travelTo(roomId) {
    this.player.moving = false;
    this.placeInTown(roomId);
  }

  startTransition(dir) {
    const from = this.room;
    this.room = this.world.get(from.neighbors[dir]);
    this.player.enterFrom(dir);
    this.player.clearCombatState();
    this.clearRoomContents();
    this.interactTarget = null;
    this.transition = { from, dir, t: 0 };
  }

  // ---------- Drawing ----------

  draw(ctx) {
    const time = this.game.time;

    ctx.save();
    ctx.beginPath();
    ctx.rect(0, HUD_H, ROOM_W, ROOM_H);
    ctx.clip();

    if (this.transition) {
      // Old room slides out, new room slides in; the player rides with the new room.
      const { from, dir, t } = this.transition;
      const p = Math.min(1, t / TIMING.roomSlide);
      const v = EDGE_VEC[dir];
      const oldX = Math.round(-v.x * p * ROOM_W);
      const oldY = Math.round(-v.y * p * ROOM_H) + HUD_H;
      const newX = Math.round(v.x * (1 - p) * ROOM_W);
      const newY = Math.round(v.y * (1 - p) * ROOM_H) + HUD_H;
      from.draw(ctx, oldX, oldY, time);
      if (from.area.dark) this.drawDarkness(ctx, from, oldX, oldY);
      this.room.draw(ctx, newX, newY, time);
      this.player.draw(ctx, newX, newY);
      if (this.room.area.dark) this.drawDarkness(ctx, this.room, newX, newY);
    } else {
      const shake = this.shakeT > 0 ? () => Math.round((Math.random() - 0.5) * 4) : () => 0;
      this.drawRoomContents(ctx, shake(), HUD_H + shake(), time);
      if (this.bossFight?.state === 'active') this.drawBossUi(ctx);
    }

    if (this.toast) this.drawToast(ctx);
    if (this.ending?.phase === 'fade') {
      ctx.fillStyle = `rgba(0,0,0,${(1 - Math.max(0, this.ending.t) / ENDING_FADE).toFixed(3)})`;
      ctx.fillRect(0, 0, ROOM_W, HUD_H + ROOM_H);
    }
    if (this.fadeT > 0) {
      ctx.fillStyle = `rgba(0,0,0,${(this.fadeT / FADE_IN).toFixed(3)})`;
      ctx.fillRect(0, HUD_H, ROOM_W, ROOM_H);
    }

    ctx.restore();

    drawHud(ctx, { player: this.player, room: this.room });
    if (DEBUG) drawTextShadow(ctx, 'DEBUG', 4, HUD_H + ROOM_H - 11, '#ff5050');
  }

  drawToast(ctx) {
    const { text } = this.toast;
    const w = textWidth(text) + 12;
    const x = ROOM_W - w - 6;
    const y = HUD_H + ROOM_H - 20;
    drawPanel(ctx, x, y, w, 14);
    drawText(ctx, text, x + 6, y + 4, '#80ff90');
  }

  // Large boss HP bar at the top of the room, plus the name banner during the intro.
  drawBossUi(ctx) {
    const boss = this.boss;
    const fight = this.bossFight;
    const w = 200;
    const x = Math.round((ROOM_W - w) / 2);
    const y = HUD_H + 4;
    px(ctx, '#000', x - 2, y - 2, w + 4, 20);
    px(ctx, '#5a3a6a', x - 1, y - 1, w + 2, 18);
    px(ctx, '#140a1a', x, y, w, 16);
    drawText(ctx, fight.name, x + 4, y + 2, '#e8d0f0');

    const barY = y + 10;
    const barW = w - 8;
    px(ctx, '#2a0a2a', x + 4, barY, barW, 4);
    const shown = Math.round((barW * this.bossBarHp) / fight.maxHp);
    const real = boss ? Math.round((barW * boss.hp) / fight.maxHp) : 0;
    px(ctx, '#f4f4f0', x + 4, barY, shown, 4); // recent damage, drains away
    px(ctx, boss?.barColor ?? '#b03ad8', x + 4, barY, Math.min(real, shown), 4);
    // Phase threshold markers
    for (const at of boss?.phaseMarkers ?? []) px(ctx, '#ffe040', x + 4 + Math.round(barW * at), barY - 1, 1, 6);

    if (fight.bannerT > 0) {
      const fade = Math.min(1, fight.bannerT / 0.4, (fight.introTime - fight.bannerT) / 0.4);
      ctx.save();
      ctx.globalAlpha = Math.max(0, fade);
      const text = fight.name;
      drawTextShadow(ctx, text, (ROOM_W - textWidth(text, 2)) / 2, HUD_H + ROOM_H / 2 + 6, '#ff5050', 2);
      ctx.restore();
    }
  }

  drawRoomContents(ctx, ox, oy, time) {
    this.room.draw(ctx, ox, oy, time);
    for (const e of this.enemies) e.drawGround?.(ctx, ox, oy);
    for (const p of this.pickups) p.draw(ctx, ox, oy);

    // Y-sort actors so whoever is lower on screen draws in front.
    const actors = [...this.npcs, ...this.chests, ...this.enemies, this.player];
    actors.sort((a, b) => a.hitbox.y + a.hitbox.h - (b.hitbox.y + b.hitbox.h));
    for (const a of actors) a.draw(ctx, ox, oy, time);

    for (const p of this.projectiles) p.draw(ctx, ox, oy);
    for (const fx of this.effects) fx.draw(ctx, ox, oy);

    if (this.room.area.dark) this.drawDarkness(ctx, this.room, ox, oy);
    this.drawLavaGlow(ctx, this.room, ox, oy, time);
    if (this.interactTarget) this.drawInteractPrompt(ctx, this.interactTarget.anchor, ox, oy, time);
  }

  // Lava lights up its surroundings with a warm, flickering glow.
  drawLavaGlow(ctx, room, ox, oy, time) {
    let any = false;
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    room.map.forEach((row, ty) => [...row].forEach((ch, tx) => {
      if (ch !== '=') return;
      any = true;
      const flicker = 0.07 + 0.04 * Math.sin(time * 7 + tx * 1.7 + ty * 2.3);
      const x = tx * TILE + 8 + ox;
      const y = ty * TILE + 8 + oy;
      const g = ctx.createRadialGradient(x, y, 2, x, y, 30);
      g.addColorStop(0, `rgba(255,110,30,${flicker.toFixed(3)})`);
      g.addColorStop(1, 'rgba(255,110,30,0)');
      ctx.fillStyle = g;
      ctx.fillRect(x - 30, y - 30, 60, 60);
    }));
    ctx.restore();
    // The whole cave pulses faintly with the lava's light.
    if (any) {
      ctx.fillStyle = `rgba(255,80,20,${(0.03 + 0.02 * Math.sin(time * 5)).toFixed(3)})`;
      ctx.fillRect(ox, oy, ROOM_W, ROOM_H);
    }
  }

  // Dark areas are lit only in a circle around the hero.
  drawDarkness(ctx, room, ox, oy) {
    const c = this.player.center;
    const cx = c.x + ox;
    const cy = c.y + oy;
    const g = ctx.createRadialGradient(cx, cy, 36, cx, cy, 150);
    g.addColorStop(0, 'rgba(6,4,12,0)');
    g.addColorStop(1, 'rgba(6,4,12,0.62)');
    ctx.fillStyle = g;
    ctx.fillRect(ox, oy, ROOM_W, ROOM_H);
  }

  // Small "E" bubble over whatever the hero can interact with.
  drawInteractPrompt(ctx, anchor, ox, oy, time) {
    const bob = Math.floor(time * 3) % 2;
    const x = Math.round(anchor.x + ox - 5);
    const y = Math.round(anchor.y + oy - 12 - bob);
    drawPanel(ctx, x, y, 11, 11);
    drawText(ctx, 'E', x + 3, y + 2, '#ffe040');
  }
}
