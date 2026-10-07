// Dialogue box overlay with a typewriter effect. E / Space / Enter finishes the
// current page, or advances to the next one.
import { SCREEN_W, SCREEN_H } from '../constants.js';
import { drawText, wrapText, LINE_H } from '../gfx/font.js';
import { px } from '../gfx/sprites.js';
import { drawPanel } from './panel.js';

const CHARS_PER_SEC = 45;
const MAX_CHARS = 37; // per line
const LINES_PER_PAGE = 3;
const BOX = { x: 8, w: SCREEN_W - 16, h: 50 };
BOX.y = SCREEN_H - BOX.h - 6;

// Splits a list of messages into pages of up to LINES_PER_PAGE wrapped lines.
function paginate(messages) {
  const pages = [];
  for (const msg of messages) {
    const lines = wrapText(msg, MAX_CHARS);
    for (let i = 0; i < lines.length; i += LINES_PER_PAGE) pages.push(lines.slice(i, i + LINES_PER_PAGE));
  }
  return pages;
}

export class DialogueScene {
  // speaker: optional name tag. messages: array of strings. onDone: called after the last page.
  constructor(game, { speaker, messages, onDone }) {
    this.game = game;
    this.countsPlayTime = true;
    this.speaker = speaker;
    this.pages = paginate(messages);
    this.onDone = onDone;
    this.page = 0;
    this.t = 0;
  }

  get pageLength() {
    return this.pages[this.page].reduce((n, line) => n + line.length, 0);
  }

  get shownChars() {
    return Math.floor(this.t * CHARS_PER_SEC);
  }

  get pageDone() {
    return this.shownChars >= this.pageLength;
  }

  update(dt) {
    this.t += dt;
    const input = this.game.input;
    if (!(input.wasPressed('interact') || input.wasPressed('dodge') || input.wasPressed('confirm'))) return;

    if (!this.pageDone) {
      this.t = this.pageLength / CHARS_PER_SEC; // reveal the rest of the page
    } else if (this.page < this.pages.length - 1) {
      this.page++;
      this.t = 0;
    } else {
      this.game.pop();
      this.onDone?.();
    }
  }

  draw(ctx) {
    drawPanel(ctx, BOX.x, BOX.y, BOX.w, BOX.h);

    if (this.speaker) {
      const w = this.speaker.length * 6 + 9;
      drawPanel(ctx, BOX.x + 6, BOX.y - 10, w, 13);
      drawText(ctx, this.speaker, BOX.x + 11, BOX.y - 7, '#ffe040');
    }

    let remaining = this.shownChars;
    this.pages[this.page].forEach((line, i) => {
      const visible = line.slice(0, Math.max(0, remaining));
      remaining -= line.length;
      drawText(ctx, visible, BOX.x + 9, BOX.y + 9 + i * (LINE_H + 2), '#f4f4f0');
    });

    // Blinking "more" arrow once the page is fully shown.
    if (this.pageDone && Math.floor(this.t * 3) % 2 === 0) {
      const ax = BOX.x + BOX.w - 14;
      const ay = BOX.y + BOX.h - 10;
      px(ctx, '#ffe040', ax, ay, 5, 1);
      px(ctx, '#ffe040', ax + 1, ay + 1, 3, 1);
      px(ctx, '#ffe040', ax + 2, ay + 2, 1, 1);
    }
  }
}
