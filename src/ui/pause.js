// Pause menu (Esc): resume, controls, quit to title. Play time doesn't count while paused.
import { SCREEN_W, SCREEN_H } from '../constants.js';
import { drawText, drawTextCentered } from '../gfx/font.js';
import { px } from '../gfx/sprites.js';
import { formatTime } from '../util.js';
import { drawPanel, dimScreen, PANEL } from './panel.js';

const W = 196;
const H = 168;
const OPTIONS = ['RESUME', 'CONTROLS', 'QUIT TO TITLE'];
const CONTROLS = [
  ['ARROWS / WASD', 'MOVE'],
  ['SPACE', 'SWING SWORD'],
  ['E', 'TALK / READ / SHOP'],
  ['Q', 'DRINK POTION'],
  ['ESC', 'PAUSE'],
];

export class PauseScene {
  constructor(game, player) {
    this.game = game;
    this.player = player;
    this.selected = 0;
    this.view = 'menu'; // 'menu' | 'controls' | 'quit'
    this.quitChoice = 1; // 0 = yes, 1 = no
  }

  update() {
    const input = this.game.input;
    const ok = input.wasPressed('attack') || input.wasPressed('interact') || input.wasPressed('confirm');

    if (this.view === 'controls') {
      if (ok || input.wasPressed('pause')) this.view = 'menu';
      return;
    }
    if (this.view === 'quit') {
      if (input.wasPressed('left') || input.wasPressed('up')) this.quitChoice = 0;
      if (input.wasPressed('right') || input.wasPressed('down')) this.quitChoice = 1;
      if (input.wasPressed('pause')) this.view = 'menu';
      else if (ok) {
        if (this.quitChoice === 0) this.game.returnToTitle();
        else this.view = 'menu';
      }
      return;
    }

    if (input.wasPressed('pause')) {
      this.game.pop();
      return;
    }
    if (input.wasPressed('up')) this.selected = (this.selected + OPTIONS.length - 1) % OPTIONS.length;
    if (input.wasPressed('down')) this.selected = (this.selected + 1) % OPTIONS.length;
    if (!ok) return;
    if (this.selected === 0) this.game.pop();
    else if (this.selected === 1) this.view = 'controls';
    else {
      this.view = 'quit';
      this.quitChoice = 1;
    }
  }

  draw(ctx) {
    dimScreen(ctx, SCREEN_W, SCREEN_H, 0.6);
    const x = Math.round((SCREEN_W - W) / 2);
    const y = Math.round((SCREEN_H - H) / 2);
    drawPanel(ctx, x, y, W, H);
    drawTextCentered(ctx, 'PAUSED', SCREEN_W / 2, y + 10, '#ffe040', 2);

    if (this.view === 'controls') this.drawControls(ctx, x, y);
    else if (this.view === 'quit') this.drawQuit(ctx, x, y);
    else this.drawMenu(ctx, x, y);
  }

  drawMenu(ctx, x, y) {
    OPTIONS.forEach((label, i) => {
      const oy = y + 36 + i * 15;
      const selected = i === this.selected;
      if (selected) {
        px(ctx, PANEL.highlight, x + 30, oy - 3, W - 60, 13);
        drawText(ctx, '>', x + 34, oy, '#ffe040');
      }
      drawTextCentered(ctx, label, SCREEN_W / 2, oy, selected ? '#ffffff' : '#a0a0b8');
    });

    // Run stats
    const p = this.player;
    const sy = y + 90;
    px(ctx, PANEL.shadow, x + 10, sy - 6, W - 20, 1);
    const rows = [
      ['PLAY TIME', formatTime(p.stats.playTime)],
      ['ENEMIES DEFEATED', p.stats.kills],
      ['DEATHS', p.stats.deaths],
      ['ATTACK / DEFENSE', `${p.baseDamage + p.swordBonus} / ${p.defense}`],
      ['GEAR', `${p.sword.name.toUpperCase()}`],
      ['', `${p.armor.name.toUpperCase()}`],
    ];
    rows.forEach(([label, value], i) => {
      drawText(ctx, label, x + 12, sy + i * 11, '#8a8aa0');
      const v = String(value);
      drawText(ctx, v, x + W - 12 - v.length * 6 + 1, sy + i * 11, '#f4f4f0');
    });
  }

  drawControls(ctx, x, y) {
    CONTROLS.forEach(([key, action], i) => {
      const oy = y + 40 + i * 16;
      drawText(ctx, key, x + 14, oy, '#ffe040');
      drawText(ctx, action, x + 96, oy, '#f4f4f0');
    });
    drawTextCentered(ctx, 'SPACE: BACK', SCREEN_W / 2, y + H - 16, '#7a7a90');
  }

  drawQuit(ctx, x, y) {
    drawTextCentered(ctx, 'QUIT TO THE TITLE SCREEN?', SCREEN_W / 2, y + 42, '#f4f4f0');
    drawTextCentered(ctx, 'PROGRESS SINCE YOUR LAST', SCREEN_W / 2, y + 60, '#c0a0a0');
    drawTextCentered(ctx, 'SAVE (VILLAGE OR CAMP)', SCREEN_W / 2, y + 71, '#c0a0a0');
    drawTextCentered(ctx, 'WILL BE LOST.', SCREEN_W / 2, y + 82, '#c0a0a0');
    ['YES', 'NO'].forEach((label, i) => {
      const cx = SCREEN_W / 2 + (i === 0 ? -30 : 30);
      const selected = i === this.quitChoice;
      if (selected) px(ctx, PANEL.highlight, cx - 16, y + 104, 32, 13);
      drawTextCentered(ctx, label, cx, y + 107, selected ? '#ffffff' : '#8a8aa0');
    });
  }
}
