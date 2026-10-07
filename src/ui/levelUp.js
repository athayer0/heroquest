// Level-up overlay: pauses the game and offers "+Max HP" or "+Max Mana", then fully restores both.
import { SCREEN_W, SCREEN_H } from '../constants.js';
import { LEVELING } from '../config.js';
import { drawText, drawTextCentered, textWidth } from '../gfx/font.js';
import { px } from '../gfx/sprites.js';
import { LEVEL_CHOICES, applyLevelChoice } from '../systems/leveling.js';
import { drawPanel, dimScreen, PANEL } from './panel.js';

const W = 184;
const H = 116;

export class LevelUpScene {
  constructor(game, player, onDone) {
    this.game = game;
    this.countsPlayTime = true;
    this.player = player;
    this.onDone = onDone;
    this.selected = 0;
    this.t = 0;
  }

  get ready() {
    return this.t >= LEVELING.menuInputDelay;
  }

  update(dt) {
    this.t += dt;
    const input = this.game.input;
    if (input.wasPressed('up') || input.wasPressed('left')) this.selected = 0;
    if (input.wasPressed('down') || input.wasPressed('right')) this.selected = 1;
    if (this.ready && (input.wasPressed('dodge') || input.wasPressed('interact') || input.wasPressed('confirm'))) {
      applyLevelChoice(this.player, LEVEL_CHOICES[this.selected]);
      this.game.pop();
      this.onDone?.();
    }
  }

  draw(ctx) {
    dimScreen(ctx, SCREEN_W, SCREEN_H);
    const x = Math.round((SCREEN_W - W) / 2);
    const y = Math.round((SCREEN_H - H) / 2);
    drawPanel(ctx, x, y, W, H);

    const cx = SCREEN_W / 2;
    drawTextCentered(ctx, 'LEVEL UP!', cx, y + 10, '#ffe040', 2);
    drawTextCentered(ctx, `YOU ARE NOW LEVEL ${this.player.level}`, cx, y + 30, '#f4f4f0');
    drawTextCentered(ctx, '+1 PERK POINT (ESC > SKILLS)', cx, y + 42, '#ffe040');
    drawTextCentered(ctx, 'CHOOSE A BONUS:', cx, y + 54, '#8a8a99');

    LEVEL_CHOICES.forEach((choice, i) => {
      const oy = y + 68 + i * 16;
      const selected = i === this.selected;
      if (selected) px(ctx, PANEL.highlight, x + 8, oy - 3, W - 16, 13);
      const color = selected ? '#ffffff' : '#a0a0b8';
      if (selected) drawText(ctx, '>', x + 12, oy, '#ffe040');
      drawText(ctx, choice.label, x + 22, oy, color);
      const preview = choice.preview(this.player);
      drawText(ctx, preview, x + W - 14 - textWidth(preview), oy, selected ? '#80ff90' : '#6a8a70');
    });

    const hint = this.ready ? 'ARROWS: CHOOSE  SPACE: OK' : '...';
    drawTextCentered(ctx, hint, cx, y + H - 13, '#8a8a99');
  }
}
