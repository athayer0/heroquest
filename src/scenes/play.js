// The main gameplay scene: current room, player, NPCs, enemies, projectiles, drops,
// interactions and flip-screen transitions.
import { TILE, ROOM_W, ROOM_H, HUD_H, EDGE_VEC } from '../constants.js';
import { TIMING, LEVELING, DEATH, BOSS } from '../config.js';
import { World } from '../world/world.js';
import { AREAS } from '../world/areas.js';
import { ALL_ROOMS, START_ROOM } from '../world/rooms/index.js';
import { Player } from '../entities/player.js';
import { Npc } from '../entities/npc.js';
import { createEnemy } from '../entities/enemies/index.js';
import { DarkLord } from '../entities/boss.js';
import { FloatText, Spark, Puff, LevelUpBurst, Shockwave, HeartFloat } from '../entities/effects.js';
import { getHeartIcon } from '../entities/pickup.js';
import { playerAttackDamage, damageToPlayer } from '../systems/combat.js';
import { rollDrops } from '../systems/loot.js';
import { addXp } from '../systems/leveling.js';
import { saveGame, applySave } from '../systems/save.js';
import { rectsOverlap } from '../util.js';
import { drawText, drawTextShadow, textWidth } from '../gfx/font.js';
import { px } from '../gfx/sprites.js';
import { drawHud } from '../ui/hud.js';
import { drawPanel } from '../ui/panel.js';
import { LevelUpScene } from '../ui/levelUp.js';
import { DialogueScene } from '../ui/dialogue.js';
import { ShopScene } from '../ui/shop.js';
import { PauseScene } from '../ui/pause.js';
import { DeathScene } from '../ui/screens.js';

const PROBE = 10; // px in front of the hero checked for things to talk to
const FADE_IN = 0.6; // seconds of fade-in after starting or respawning
const TOAST_TIME = 1.6;
const BOSS_TRIGGER_Y = ROOM_H - 40; // the door locks once the hero walks this far into the throne room
const ENDING_FADE = 1.5;

export class PlayScene {
  // save: data from loadGame() to continue, or null for a new game.
  constructor(game, save = null) {
    this.game = game;
    this.countsPlayTime = true;
    this.world = new World(ALL_ROOMS, AREAS);
    const home = this.world.get(START_ROOM);
    this.respawnPoint = { room: home.id, x: home.def.respawn.x * TILE, y: home.def.respawn.y * TILE };
    this.player = new Player(this.respawnPoint.x, this.respawnPoint.y);
    if (save) applySave(this.player, save);

    // Continue from the save point you saved at (e.g. the merchant's camp); otherwise start in the Village.
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
    this.fadeT = FADE_IN;
    this.shakeT = 0;
    this.boss = null; // the DarkLord while the fight is on
    this.bossFight = null; // { state: 'waiting' | 'active', bannerT }
    this.bossBarHp = 0; // displayed HP; trails the real value
    this.bossDefeated = false;
    this.enterRoom(start);
  }

  // Every visit spawns the room fresh, so enemies respawn when you come back.
  enterRoom(room) {
    this.room = room;
    room.resetTiles();
    this.clearRoomContents();
    this.boss = null;
    this.bossFight = room.def.boss && !this.bossDefeated ? { state: 'waiting' } : null;
    this.npcs = (room.def.npcs ?? []).map((def) => new Npc(def));
    room.solidRects = this.npcs.map((n) => n.hitbox);
    for (const e of room.def.enemies ?? []) {
      const enemy = createEnemy(e.type, e.x * TILE, e.y * TILE);
      this.enemies.push(enemy);
      const c = enemy.center;
      this.effects.push(new Puff(c.x, c.y, enemy.spawnT));
    }
    // Autosave in the Village and at save points (the merchant's camp). Save points also
    // become where Continue starts; dying still sends you to the Village.
    const savesHere = room.def.area === 'village' || room.def.savePoint;
    if (savesHere && saveGame(this.player, room.def.savePoint ? room.id : null)) this.showToast('GAME SAVED');
  }

  showToast(text) {
    this.toast = { text, t: TOAST_TIME };
  }

  clearRoomContents() {
    this.npcs = [];
    this.enemies = [];
    this.projectiles = [];
    this.pickups = [];
    this.effects = [];
  }

  update(dt) {
    this.fadeT = Math.max(0, this.fadeT - dt);
    this.shakeT = Math.max(0, this.shakeT - dt);
    if (this.toast && (this.toast.t -= dt) <= 0) this.toast = null;

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
    if (input.wasPressed('potion')) this.drinkPotion();

    this.interactTarget = this.findInteraction();
    if (input.wasPressed('interact') && this.interactTarget && !player.attacking) {
      this.interact(this.interactTarget);
      return;
    }

    const enemyCtx = {
      player,
      room,
      spawnProjectile: (p) => this.projectiles.push(p),
      addEffect: (fx) => this.effects.push(fx),
      clearProjectiles: () => { this.projectiles = []; },
      shake: (seconds) => this.shake(seconds),
      slam: (x, y, radius, attack) => this.slam(x, y, radius, attack),
      onBossDefeated: (boss) => this.onBossDefeated(boss),
    };
    player.update(dt, input, room);
    for (const e of this.enemies) e.update(dt, enemyCtx);
    for (const p of this.projectiles) p.update(dt, room);
    for (const p of this.pickups) p.update(dt, room);
    for (const fx of this.effects) fx.update(dt);

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
      }
    }
    return null;
  }

  interact(target) {
    const { game } = this;
    this.player.moving = false;
    if (target.kind === 'npc' && target.npc.def.shop) {
      // Merchant NPCs open the shop directly, greeting you in the message line.
      const { title, greeting } = target.npc.def.shop;
      game.push(new ShopScene(game, this.player, { title, greeting }));
    } else if (target.kind === 'npc') {
      game.push(new DialogueScene(game, { speaker: target.npc.name, messages: target.npc.lines }));
    } else if (target.kind === 'sign') {
      game.push(new DialogueScene(game, { messages: [target.sign.text] }));
    } else if (target.kind === 'shop') {
      // room.def.shop is `true` (village defaults) or { title, greeting }.
      const opts = typeof this.room.def.shop === 'object' ? this.room.def.shop : {};
      game.push(new ShopScene(game, this.player, opts));
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

  // ---------- Combat ----------

  resolveCombat() {
    const { player } = this;
    const pc = player.center;

    for (const enemy of this.enemies) {
      if (!enemy.active) continue;

      if (player.swordHits(enemy.hitbox)) {
        const result = enemy.hurt(playerAttackDamage(player), pc.x, pc.y, player.swingId);
        const c = enemy.center;
        const mid = { x: (c.x + pc.x) / 2, y: (c.y + pc.y) / 2 };
        if (result === 'blocked') {
          this.effects.push(new Spark(mid.x, mid.y, '#ffe040'));
          this.effects.push(new FloatText('BLOCK', c.x, c.y - 14, '#c0c0d0'));
          player.pushBack(c.x, c.y);
        } else if (result) {
          this.effects.push(new Spark(mid.x, mid.y));
          if (enemy.dead) this.onEnemyDefeated(enemy);
        }
      }

      if (enemy.active && rectsOverlap(player.hitbox, enemy.hitbox)) {
        const c = enemy.center;
        this.hurtPlayer(enemy.attack, c.x, c.y);
      }
    }
  }

  resolveProjectiles() {
    const { player } = this;
    for (const p of this.projectiles) {
      if (p.dead) continue;
      if (p.swordable && player.swordHits(p.rect)) {
        p.dead = true;
        this.effects.push(new Spark(p.x, p.y));
        continue;
      }
      if (rectsOverlap(player.hitbox, p.rect) && this.hurtPlayer(p.attack, p.x, p.y)) p.dead = true;
    }
  }

  hurtPlayer(attack, fromX, fromY) {
    const { player } = this;
    const dmg = damageToPlayer(attack, player.defense);
    if (!player.takeHit(dmg, fromX, fromY)) return false;
    const pc = player.center;
    this.effects.push(new FloatText(`-${dmg}`, pc.x, pc.y - 14, '#ff8080'));
    return true;
  }

  onEnemyDefeated(enemy) {
    const c = enemy.center;
    const { player } = this;
    player.stats.kills++;
    const xp = enemy.stats.xp;
    const gained = addXp(player, xp);
    if (gained > 0) {
      this.pendingLevelUps += gained;
      if (this.celebrateT <= 0) this.startLevelUpCelebration();
    }
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
    const target = this.boss.state === 'intro' ? BOSS.hp * (1 - fight.bannerT / BOSS.introTime) : this.boss.hp;
    const rate = this.boss.state === 'intro' ? BOSS.hp : 60;
    this.bossBarHp = target < this.bossBarHp && this.boss.state !== 'intro'
      ? Math.max(target, this.bossBarHp - rate * dt)
      : Math.min(BOSS.hp, Math.max(target, this.bossBarHp));
  }

  // The door slams shut behind the hero and the Dark Lord appears.
  startBossFight() {
    const { room } = this;
    for (const d of room.def.bossDoor ?? []) room.setTile(d.x, d.y, 'L');
    this.shake(0.3);
    this.boss = new DarkLord(ROOM_W / 2 - 16, 2 * TILE);
    this.enemies.push(this.boss);
    const c = this.boss.center;
    this.effects.push(new Puff(c.x, c.y, 0.6, '#d050f0'));
    this.bossFight = { state: 'active', bannerT: BOSS.introTime };
    this.bossBarHp = 0;
  }

  slam(x, y, radius, attack) {
    this.effects.push(new Shockwave(x, y, radius));
    const pc = this.player.center;
    if (Math.hypot(pc.x - x, pc.y - y) <= radius + 4) this.hurtPlayer(attack, x, y);
  }

  shake(seconds) {
    this.shakeT = Math.max(this.shakeT, seconds);
  }

  // The Dark Lord falls: freeze the run stats and start the ending.
  onBossDefeated(boss) {
    const c = boss.center;
    const { player } = this;
    this.bossDefeated = true;
    this.boss = null;
    this.bossFight = null;
    this.projectiles = [];
    player.stats.kills++;
    player.clearCombatState();
    player.invulnT = 0;
    this.room.resetTiles(); // door unlocks
    this.shake(0.5);
    this.effects.push(new Puff(c.x, c.y, 0.8, '#ffe060'));
    this.effects.push(new FloatText('VICTORY!', c.x, c.y - 10, '#ffe040', 2));
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
      this.game.finishGame(this.finalStats);
    }
  }

  // ---------- Death ----------

  // Gold is lost right away so the death screen can show the amount.
  startDeath() {
    const { player } = this;
    const lost = Math.floor(player.gold * DEATH.goldLossFraction);
    player.gold -= lost;
    player.stats.deaths++;
    player.clearCombatState();
    player.moving = false;
    this.celebrateT = 0;
    this.pendingLevelUps = 0;
    this.game.push(new DeathScene(this.game, this, lost));
  }

  // Back to the Village at full HP; level, XP and gear are kept. Entering the Village autosaves.
  respawn() {
    const { player } = this;
    const rp = this.respawnPoint;
    player.hp = player.maxHp;
    player.x = rp.x;
    player.y = rp.y;
    player.facing = 'down';
    player.invulnT = 0;
    player.glowT = 0;
    player.clearCombatState();
    this.fadeT = FADE_IN;
    this.enterRoom(this.world.get(rp.room));
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
    drawText(ctx, BOSS.name, x + 4, y + 2, '#e8d0f0');

    const barY = y + 10;
    const barW = w - 8;
    px(ctx, '#2a0a2a', x + 4, barY, barW, 4);
    const shown = Math.round((barW * this.bossBarHp) / BOSS.hp);
    const real = boss ? Math.round((barW * boss.hp) / BOSS.hp) : 0;
    px(ctx, '#f4f4f0', x + 4, barY, shown, 4); // recent damage, drains away
    const color = boss?.phase === 2 ? '#e83a3a' : '#b03ad8';
    px(ctx, color, x + 4, barY, Math.min(real, shown), 4);
    // Phase-2 threshold marker
    px(ctx, '#ffe040', x + 4 + Math.round(barW * BOSS.phase2At), barY - 1, 1, 6);

    if (fight.bannerT > 0) {
      const fade = Math.min(1, fight.bannerT / 0.4, (BOSS.introTime - fight.bannerT) / 0.4);
      ctx.save();
      ctx.globalAlpha = Math.max(0, fade);
      const text = BOSS.name;
      drawTextShadow(ctx, text, (ROOM_W - textWidth(text, 2)) / 2, HUD_H + ROOM_H / 2 + 6, '#ff5050', 2);
      ctx.restore();
    }
  }

  drawRoomContents(ctx, ox, oy, time) {
    this.room.draw(ctx, ox, oy, time);
    for (const e of this.enemies) e.drawGround?.(ctx, ox, oy);
    for (const p of this.pickups) p.draw(ctx, ox, oy);

    // Y-sort actors so whoever is lower on screen draws in front.
    const actors = [...this.npcs, ...this.enemies, this.player];
    actors.sort((a, b) => a.hitbox.y + a.hitbox.h - (b.hitbox.y + b.hitbox.h));
    for (const a of actors) a.draw(ctx, ox, oy, time);

    for (const p of this.projectiles) p.draw(ctx, ox, oy);
    for (const fx of this.effects) fx.draw(ctx, ox, oy);

    if (this.room.area.dark) this.drawDarkness(ctx, this.room, ox, oy);
    if (this.interactTarget) this.drawInteractPrompt(ctx, this.interactTarget.anchor, ox, oy, time);
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
