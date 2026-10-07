// Shop menu: tabs for whatever this shop sells (swords, armor, potions, magic), with a stat preview before buying.
import { SCREEN_W, SCREEN_H } from '../constants.js';
import { drawText, drawTextCentered, textWidth } from '../gfx/font.js';
import { makeSprite, px } from '../gfx/sprites.js';
import { POTION as POTION_ART } from '../gfx/art.js';
import { getHeroSprites, getSwordSprite } from '../entities/player.js';
import { SPELLS, SHOPS } from '../config.js';
import { getTomeIcon, getManaPotionIcon } from '../gfx/icons.js';
import { shopTabs, itemState, buy, previewText } from '../systems/shop.js';
import { drawPanel, dimScreen, PANEL } from './panel.js';

const W = 228;
const H = 180;
const ROW_H = 19;
const STATE_LABEL = { equipped: 'EQUIPPED', owned: 'OWNED', known: 'KNOWN', full: 'FULL' };

let potionIcon = null;
export function getPotionIcon() {
  return (potionIcon ??= makeSprite(POTION_ART, {
    k: '#1b1b23', c: '#a0703a', g: '#c8ecff', r: '#e83a4a', w: '#ffffff',
  }));
}

export class ShopScene {
  // shopId: a key of SHOPS (its title, greeting and stock).
  constructor(game, player, shopId) {
    const shop = SHOPS[shopId];
    this.game = game;
    this.countsPlayTime = true;
    this.player = player;
    this.tabs = shopTabs(shopId);
    this.tab = 0;
    this.selected = this.defaultSelection();
    this.title = shop.title;
    this.message = shop.greeting;
    this.messageColor = '#c0c0d0';
  }

  get currentTab() {
    return this.tabs[this.tab];
  }

  // Start on the first item you could actually buy.
  defaultSelection() {
    const tab = this.tabs[this.tab];
    const i = tab.items.findIndex((_, idx) => itemState(this.player, tab, idx) === 'buy');
    return i < 0 ? 0 : i;
  }

  update() {
    const input = this.game.input;
    const tab = this.currentTab;
    if (input.wasPressed('pause')) {
      this.game.pop();
      return;
    }
    if (input.wasPressed('left') || input.wasPressed('right')) {
      const step = input.wasPressed('left') ? -1 : 1;
      this.tab = (this.tab + step + this.tabs.length) % this.tabs.length;
      this.selected = this.defaultSelection();
    }
    if (input.wasPressed('up')) this.selected = (this.selected - 1 + tab.items.length) % tab.items.length;
    if (input.wasPressed('down')) this.selected = (this.selected + 1) % tab.items.length;

    if (input.wasPressed('dodge') || input.wasPressed('interact') || input.wasPressed('confirm')) {
      const result = buy(this.player, this.currentTab, this.selected);
      this.message = result.message;
      this.messageColor = result.ok ? '#80ff90' : '#ff8080';
    }
  }

  draw(ctx) {
    dimScreen(ctx, SCREEN_W, SCREEN_H);
    const x = Math.round((SCREEN_W - W) / 2);
    const y = Math.round((SCREEN_H - H) / 2);
    drawPanel(ctx, x, y, W, H);

    drawText(ctx, this.title, x + 10, y + 9, '#ffe040');
    const gold = `${this.player.gold} G`;
    drawText(ctx, gold, x + W - 10 - textWidth(gold), y + 9, '#ffe070');

    // Tabs
    let tx = x + 10;
    this.tabs.forEach((tab, i) => {
      const w = textWidth(tab.label) + 8;
      const active = i === this.tab;
      px(ctx, active ? PANEL.highlight : PANEL.bg, tx, y + 21, w, 12);
      if (active) px(ctx, '#ffe040', tx, y + 32, w, 1);
      drawText(ctx, tab.label, tx + 4, y + 24, active ? '#ffffff' : '#7a7a90');
      tx += w + 4;
    });

    // Items
    const tab = this.currentTab;
    tab.items.forEach((item, i) => {
      const ry = y + 40 + i * ROW_H;
      const selected = i === this.selected;
      if (selected) px(ctx, PANEL.highlight, x + 6, ry - 1, W - 12, ROW_H - 1);
      this.drawIcon(ctx, tab, item, x + 10, ry);
      const state = itemState(this.player, tab, i);
      const nameColor = state === 'buy' ? '#ffffff' : '#8a8aa0';
      if (selected) drawText(ctx, '>', x + 30, ry + 5, '#ffe040');
      drawText(ctx, item.name, x + 38, ry + 5, nameColor);
      const right = STATE_LABEL[state] ?? `${item.price} G`;
      const color = state === 'buy' ? (this.player.gold >= item.price ? '#ffe070' : '#a06050') : '#6a9a70';
      drawText(ctx, right, x + W - 12 - textWidth(right), ry + 5, color);
    });

    // Preview + message
    const py = y + 120;
    px(ctx, PANEL.shadow, x + 8, py - 4, W - 16, 1);
    drawTextCentered(ctx, previewText(this.player, tab, this.selected), SCREEN_W / 2, py + 2, '#a0e0ff');
    drawTextCentered(ctx, this.message, SCREEN_W / 2, py + 16, this.messageColor);

    drawTextCentered(ctx, 'ARROWS: SELECT   SPACE: BUY', SCREEN_W / 2, y + H - 24, '#7a7a90');
    drawTextCentered(ctx, 'ESC: LEAVE', SCREEN_W / 2, y + H - 13, '#7a7a90');
  }

  drawIcon(ctx, tab, item, x, y) {
    if (tab.id === 'sword') {
      ctx.drawImage(getSwordSprite(item.id), x + 4, y);
    } else if (tab.id === 'armor') {
      ctx.drawImage(getHeroSprites(item.id).down[0], x, y);
    } else if (item.kind === 'tome') {
      ctx.drawImage(getTomeIcon(SPELLS[item.spell].school), x + 2, y + 2);
    } else if (item.kind === 'manaPotion') {
      ctx.drawImage(getManaPotionIcon(), x + 4, y + 3);
    } else {
      ctx.drawImage(getPotionIcon(), x + 4, y + 3);
    }
  }
}
