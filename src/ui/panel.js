// Shared retro window frame for menus and dialogue.
import { px } from '../gfx/sprites.js';

export const PANEL = {
  bg: '#14142a',
  border: '#f4f4f0',
  shadow: '#5a5a8a',
  highlight: '#2a2a5a',
};

export function drawPanel(ctx, x, y, w, h) {
  px(ctx, '#000', x - 1, y - 1, w + 2, h + 2);
  px(ctx, PANEL.border, x, y, w, h);
  px(ctx, PANEL.shadow, x + 1, y + 1, w - 2, h - 2);
  px(ctx, PANEL.bg, x + 2, y + 2, w - 4, h - 4);
}

export function dimScreen(ctx, w, h, alpha = 0.55) {
  ctx.fillStyle = `rgba(0,0,0,${alpha})`;
  ctx.fillRect(0, 0, w, h);
}
