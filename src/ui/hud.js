// Top HUD bar:
//   HP bar, level + XP bar, area name and attack/defense on the left;
//   equipped sword and armor slots in the middle; gold and potions on the right.
import { SCREEN_W, HUD_H } from '../constants.js';
import { COLORS } from '../gfx/palette.js';
import { drawText, textWidth } from '../gfx/font.js';
import { px } from '../gfx/sprites.js';
import { xpToNext, isMaxLevel } from '../systems/leveling.js';
import { getHeroSprites, getSwordSprite } from '../entities/player.js';
import { getCoinIcon } from '../entities/pickup.js';
import { getPotionIcon } from './shop.js';

const BAR_X = 22;
const BAR_W = 76;
const BAR_H = 7;
const SLOT = 20;
const SLOTS_X = 150;
const SLOTS_Y = 5;

function bar(ctx, y, fraction, fg, bg, shine) {
  px(ctx, '#000', BAR_X - 1, y - 1, BAR_W + 2, BAR_H + 2);
  px(ctx, bg, BAR_X, y, BAR_W, BAR_H);
  const w = Math.round(BAR_W * Math.max(0, Math.min(1, fraction)));
  px(ctx, fg, BAR_X, y, w, BAR_H);
  if (w > 0) px(ctx, shine, BAR_X, y, w, 1);
}

function slot(ctx, x, y) {
  px(ctx, '#3a3a5a', x, y, SLOT, SLOT);
  px(ctx, '#14142a', x + 1, y + 1, SLOT - 2, SLOT - 2);
}

export function drawHud(ctx, { player, room }) {
  px(ctx, COLORS.black, 0, 0, SCREEN_W, HUD_H);
  px(ctx, '#2a2a40', 0, HUD_H - 1, SCREEN_W, 1);

  // HP (label turns red when low)
  const low = player.hp / player.maxHp <= 0.25;
  drawText(ctx, 'HP', 6, 5, low ? '#ff6060' : COLORS.hudDim);
  bar(ctx, 5, player.hp / player.maxHp, COLORS.hpRed, COLORS.hpBack, '#ff8a8a');
  drawText(ctx, `${player.hp}/${player.maxHp}`, BAR_X + BAR_W + 4, 5, COLORS.hudText);

  // Level + XP
  drawText(ctx, `L${player.level}`, 6, 17, '#a0e0ff');
  if (isMaxLevel(player)) {
    bar(ctx, 17, 1, '#5ab0e8', '#1a3a5a', '#a8dcff');
    drawText(ctx, 'MAX', BAR_X + BAR_W + 4, 17, COLORS.hudText);
  } else {
    const need = xpToNext(player.level);
    bar(ctx, 17, player.xp / need, '#5ab0e8', '#1a3a5a', '#a8dcff');
    drawText(ctx, `${player.xp}/${need}`, BAR_X + BAR_W + 4, 17, COLORS.hudText);
  }

  // Area + stats
  drawText(ctx, room.area.name.toUpperCase(), 6, 29, '#c8c8a0');
  drawText(ctx, `ATK ${player.baseDamage + player.swordBonus} DEF ${player.defense}`, 64, 29, COLORS.hudDim);

  // Equipment slots (sword art is 7x16, hero art 16x16)
  slot(ctx, SLOTS_X, SLOTS_Y);
  ctx.drawImage(getSwordSprite(player.sword.id), SLOTS_X + 6, SLOTS_Y + 2);
  slot(ctx, SLOTS_X + SLOT + 3, SLOTS_Y);
  ctx.drawImage(getHeroSprites(player.armor.id).down[0], SLOTS_X + SLOT + 5, SLOTS_Y + 2);

  // Gold + potions, right-aligned
  const gold = `${player.gold}`;
  const gx = SCREEN_W - 6 - textWidth(gold);
  ctx.drawImage(getCoinIcon(), gx - 11, 7);
  drawText(ctx, gold, gx, 8, '#ffe070');

  const pots = `x${player.potions}`;
  const pxPos = SCREEN_W - 6 - textWidth(pots);
  ctx.drawImage(getPotionIcon(), pxPos - 10, 21);
  drawText(ctx, pots, pxPos, 22, player.potions ? COLORS.hudText : COLORS.hudDim);
}
