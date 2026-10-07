// Full-screen scenes: title, "You fell..." and the completion screen.
import { SCREEN_W, SCREEN_H, HUD_H, ROOM_W, ROOM_H } from '../constants.js';
import { DEATH } from '../config.js';
import { drawText, drawTextCentered, drawTextShadow, textWidth } from '../gfx/font.js';
import { px } from '../gfx/sprites.js';
import { Room } from '../world/room.js';
import { AREAS } from '../world/areas.js';
import { MEADOW_ROOMS } from '../world/rooms/meadow.js';
import { ALL_ROOMS } from '../world/rooms/index.js';
import { getPlayerSprites, getSwordSprite, heroColors } from '../entities/player.js';
import { npcSprite } from '../entities/npc.js';
import { getHeartIcon } from '../entities/pickup.js';
import { loadGame, clearSave } from '../systems/save.js';
import { formatTime } from '../util.js';
import { drawPanel, dimScreen, PANEL } from './panel.js';

const anyKey = (input) => ['attack', 'interact', 'confirm', 'pause'].some((a) => input.wasPressed(a));
const confirmKey = (input) => ['attack', 'interact', 'confirm'].some((a) => input.wasPressed(a));

// ---------- Title ----------

export class TitleScene {
  constructor(game) {
    this.game = game;
    this.save = loadGame();
    this.selected = this.save ? 1 : 0; // default to Continue when there is a save
    this.confirming = false; // "erase your save?" prompt
    this.confirmChoice = 1; // 0 = yes, 1 = no
    this.t = 0;
    const bgDef = MEADOW_ROOMS[0];
    this.backdrop = new Room(bgDef, AREAS[bgDef.area]);
  }

  // Clickable areas (game pixels).
  itemRect(i) {
    const w = textWidth(i === 0 ? 'START' : 'CONTINUE') + 20;
    return { x: SCREEN_W / 2 - w / 2, y: 123 + i * 16, w, h: 13 };
  }

  confirmRect(i) {
    const cx = SCREEN_W / 2 + (i === 0 ? -30 : 30);
    return { x: cx - 16, y: (SCREEN_H - 64) / 2 + 40, w: 32, h: 13 };
  }

  update(dt) {
    this.t += dt;
    const input = this.game.input;

    if (this.confirming) {
      if (input.wasPressed('left') || input.wasPressed('up')) this.confirmChoice = 0;
      if (input.wasPressed('right') || input.wasPressed('down')) this.confirmChoice = 1;
      let clicked = false;
      for (const i of [0, 1]) {
        if (input.pointerMoved && input.pointerIn(this.confirmRect(i))) this.confirmChoice = i;
        if (input.clickedIn(this.confirmRect(i))) {
          this.confirmChoice = i;
          clicked = true;
        }
      }
      if (input.wasPressed('pause')) this.confirming = false;
      else if (confirmKey(input) || clicked) {
        this.confirming = false;
        if (this.confirmChoice === 0) this.game.startNewGame();
      }
      return;
    }

    if (input.wasPressed('up')) this.selected = 0;
    if (input.wasPressed('down') && this.save) this.selected = 1;
    let clicked = false;
    for (const i of this.save ? [0, 1] : [0]) {
      if (input.pointerMoved && input.pointerIn(this.itemRect(i))) this.selected = i;
      if (input.clickedIn(this.itemRect(i))) {
        this.selected = i;
        clicked = true;
      }
    }
    if (!confirmKey(input) && !clicked) return;

    if (this.selected === 1 && this.save) {
      this.game.continueGame(this.save);
    } else if (this.save) {
      this.confirming = true;
      this.confirmChoice = 1;
    } else {
      this.game.startNewGame();
    }
  }

  draw(ctx) {
    // Backdrop: a meadow screen, dimmed, with a slow vertical drift.
    px(ctx, '#0e0e14', 0, 0, SCREEN_W, SCREEN_H);
    this.backdrop.draw(ctx, 0, HUD_H / 2, this.t);
    dimScreen(ctx, SCREEN_W, SCREEN_H, 0.5);

    // Title
    const bob = Math.round(Math.sin(this.t * 2) * 2);
    drawTextCentered(ctx, 'HEROQUEST', SCREEN_W / 2 + 2, 30 + bob + 2, '#1b1b23', 3);
    drawTextCentered(ctx, 'HEROQUEST', SCREEN_W / 2, 30 + bob, '#ffe040', 3);
    drawTextCentered(ctx, 'RESCUE THE PRINCESS', SCREEN_W / 2, 60, '#f4f4f0');

    // Hero holding up their sword
    const heroX = SCREEN_W / 2 - 16;
    const heroY = 76;
    ctx.save();
    ctx.translate(heroX, heroY);
    ctx.scale(2, 2);
    ctx.drawImage(getSwordSprite('wooden'), 9, -10);
    ctx.drawImage(getPlayerSprites(heroColors('cloth')).down[0], 0, 0);
    ctx.restore();

    // Menu
    const items = ['START', 'CONTINUE'];
    items.forEach((label, i) => {
      const y = 126 + i * 16;
      const enabled = i === 0 || this.save;
      const selected = i === this.selected;
      const color = !enabled ? '#5a5a6a' : selected ? '#ffffff' : '#b0b0c0';
      if (selected) {
        const w = textWidth(label) + 20;
        px(ctx, PANEL.highlight, SCREEN_W / 2 - w / 2, y - 3, w, 13);
        drawText(ctx, '>', SCREEN_W / 2 - w / 2 + 3, y, '#ffe040');
      }
      drawTextCentered(ctx, label, SCREEN_W / 2, y, color);
    });

    if (this.save) {
      const s = this.save;
      const where = AREAS[ALL_ROOMS.find((r) => r.id === s.location)?.area ?? 'village'].name.toUpperCase();
      drawTextCentered(ctx, `SAVE: LV ${s.level}  ${formatTime(s.stats?.playTime ?? 0)}  ${where}`, SCREEN_W / 2, 162, '#8a8aa0');
    }

    drawTextCentered(ctx, 'ARROWS: CHOOSE   SPACE/ENTER: OK', SCREEN_W / 2, SCREEN_H - 30, '#7a7a90');
    drawTextCentered(ctx, 'MOVE: ARROWS/WASD  SWORD: SPACE  TALK: E', SCREEN_W / 2, SCREEN_H - 18, '#5a5a70');

    if (this.confirming) this.drawConfirm(ctx);
  }

  drawConfirm(ctx) {
    const w = 200;
    const h = 64;
    const x = (SCREEN_W - w) / 2;
    const y = (SCREEN_H - h) / 2;
    dimScreen(ctx, SCREEN_W, SCREEN_H, 0.5);
    drawPanel(ctx, x, y, w, h);
    drawTextCentered(ctx, 'START A NEW GAME?', SCREEN_W / 2, y + 10, '#ffe040');
    drawTextCentered(ctx, 'YOUR SAVE WILL BE ERASED.', SCREEN_W / 2, y + 22, '#c0c0d0');
    ['YES', 'NO'].forEach((label, i) => {
      const cx = SCREEN_W / 2 + (i === 0 ? -30 : 30);
      const selected = i === this.confirmChoice;
      if (selected) px(ctx, PANEL.highlight, cx - 16, y + 40, 32, 13);
      drawTextCentered(ctx, label, cx, y + 43, selected ? '#ffffff' : '#8a8aa0');
    });
  }
}

// ---------- Death ----------

// Overlays the frozen play scene: the hero spins, the screen fades, "You fell..." shows,
// then the play scene respawns the hero in the Village.
export class DeathScene {
  constructor(game, play, goldLost) {
    this.game = game;
    this.play = play;
    this.goldLost = goldLost;
    this.t = 0;
  }

  get textTime() {
    return DEATH.spinTime + DEATH.fadeTime;
  }

  update(dt) {
    this.t += dt;
    if (this.t < DEATH.spinTime) {
      const spin = ['down', 'left', 'up', 'right'];
      this.play.player.facing = spin[Math.floor(this.t * 12) % 4];
      return;
    }
    const skippable = this.t > this.textTime + 0.8 && anyKey(this.game.input);
    if (this.t >= this.textTime + DEATH.screenTime || skippable) {
      this.game.pop();
      this.play.respawn();
    }
  }

  draw(ctx) {
    if (this.t < DEATH.spinTime) {
      ctx.fillStyle = 'rgba(160,20,20,0.25)';
      ctx.fillRect(0, HUD_H, ROOM_W, ROOM_H);
      return;
    }
    const fade = Math.min(1, (this.t - DEATH.spinTime) / DEATH.fadeTime);
    ctx.fillStyle = `rgba(10,4,8,${fade.toFixed(3)})`;
    ctx.fillRect(0, 0, SCREEN_W, SCREEN_H);
    if (this.t < this.textTime - 0.2) return;

    drawTextShadow(ctx, 'YOU FELL...', (SCREEN_W - textWidth('YOU FELL...', 2)) / 2, 78, '#e85a5a', 2);
    if (this.goldLost > 0) drawTextCentered(ctx, `LOST ${this.goldLost} GOLD`, SCREEN_W / 2, 108, '#ffe070');
    drawTextCentered(ctx, 'YOU WAKE UP BACK IN THE VILLAGE', SCREEN_W / 2, 124, '#8a8aa0');
  }
}

// ---------- Completion ----------

const CONFETTI_COLORS = ['#ffe040', '#f08ab8', '#80d0ff', '#80ff90', '#ffffff', '#ff8060'];

// stats: { level, playTime, kills, deaths, goldCollected, swordId, armorId }
export class CompleteScene {
  constructor(game, stats) {
    this.game = game;
    this.stats = stats;
    this.t = 0;
    this.hover = false;
    this.confetti = Array.from({ length: 48 }, () => this.newConfetti(Math.random() * SCREEN_H));
  }

  newConfetti(y = -4) {
    return {
      x: Math.random() * SCREEN_W,
      y,
      vy: 14 + Math.random() * 22,
      sway: Math.random() * Math.PI * 2,
      color: CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
    };
  }

  get button() {
    return { x: SCREEN_W / 2 - 50, y: 174, w: 100, h: 18 };
  }

  update(dt) {
    this.t += dt;
    for (const c of this.confetti) {
      c.y += c.vy * dt;
      c.sway += dt * 3;
      if (c.y > SCREEN_H + 4) Object.assign(c, this.newConfetti());
    }
    const input = this.game.input;
    this.hover = input.pointerIn(this.button);
    if (this.t < 1) return; // don't skip past the screen by accident
    if (confirmKey(input) || input.clickedIn(this.button)) {
      clearSave();
      this.game.returnToTitle();
    }
  }

  draw(ctx) {
    px(ctx, '#10102a', 0, 0, SCREEN_W, SCREEN_H);
    for (const c of this.confetti) {
      px(ctx, c.color, Math.round(c.x + Math.sin(c.sway) * 3), Math.round(c.y), 2, Math.sin(c.sway * 2) > 0 ? 2 : 1);
    }

    const cx = SCREEN_W / 2;
    const title = 'CONGRATULATIONS!';
    drawTextShadow(ctx, title, (SCREEN_W - textWidth(title, 2)) / 2, 12, '#ffe040', 2);
    drawTextCentered(ctx, 'YOU SAVED THE PRINCESS!', cx, 34, '#f4f4f0');

    // Hero and princess, with a heart between them
    const bob = Math.floor(this.t * 2) % 2;
    ctx.save();
    ctx.translate(cx - 44, 46);
    ctx.scale(2, 2);
    ctx.drawImage(getPlayerSprites(heroColors(this.stats.armorId)).down[0], 0, bob);
    ctx.drawImage(npcSprite('princess'), 28, 1 - bob);
    ctx.restore();
    const heart = getHeartIcon();
    ctx.save();
    ctx.translate(cx - 7, 58 - Math.round(Math.sin(this.t * 4) * 2));
    ctx.scale(2, 2);
    ctx.drawImage(heart, 0, 0);
    ctx.restore();

    // Stats
    const s = this.stats;
    const panel = { x: 44, y: 88, w: SCREEN_W - 88, h: 76 };
    drawPanel(ctx, panel.x, panel.y, panel.w, panel.h);
    const rows = [
      ['FINAL LEVEL', s.level],
      ['PLAY TIME', formatTime(s.playTime)],
      ['ENEMIES DEFEATED', s.kills],
      ['DEATHS', s.deaths],
      ['GOLD COLLECTED', s.goldCollected],
    ];
    rows.forEach(([label, value], i) => {
      const y = panel.y + 9 + i * 13;
      drawText(ctx, label, panel.x + 10, y, '#a0a0c0');
      const v = String(value);
      drawText(ctx, v, panel.x + panel.w - 10 - textWidth(v), y, '#ffe070');
    });

    // Play Again button
    const b = this.button;
    const active = this.hover || Math.floor(this.t * 2) % 2 === 0;
    px(ctx, '#000', b.x - 1, b.y - 1, b.w + 2, b.h + 2);
    px(ctx, active ? '#ffe040' : '#c0a030', b.x, b.y, b.w, b.h);
    px(ctx, active ? '#3a2a5a' : '#2a1a4a', b.x + 2, b.y + 2, b.w - 4, b.h - 4);
    drawTextCentered(ctx, 'PLAY AGAIN', cx, b.y + 6, active ? '#ffffff' : '#d0d0e0');
    drawTextCentered(ctx, 'SPACE / ENTER / CLICK', cx, b.y + b.h + 8, '#6a6a8a');
  }
}
