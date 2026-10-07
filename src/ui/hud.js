// Top HUD bar:
//   HP, MP and level + XP bars, then the area name and attack/defense on the left;
//   equipped sword, armor and spell slots in the middle; gold, potions and mana potions on the right.
import { SCREEN_W, HUD_H } from '../constants.js';
import { COLORS } from '../gfx/palette.js';
import { drawText, drawTextCentered, textWidth } from '../gfx/font.js';
import { px } from '../gfx/sprites.js';
import { getSpellIcon, getManaPotionIcon } from '../gfx/icons.js';
import { xpToNext, isMaxLevel } from '../systems/leveling.js';
import { playerAttackDamage } from '../systems/combat.js';
import { spellCost } from '../systems/magic.js';
import { getHeroSprites, getSwordSprite } from '../entities/player.js';
import { getCoinIcon } from '../entities/pickup.js';
import { getPotionIcon } from './shop.js';

const BAR_X = 22;
const BAR_W = 64;
const BAR_H = 5;
const ROW_HP = 4;
const ROW_MP = 13;
const ROW_XP = 22;
const ROW_INFO = 31;
const SLOT = 20;
const SLOTS_X = 136;
const SLOTS_Y = 4;
const RIGHT = SCREEN_W - 6;

function bar(ctx, y, fraction, fg, bg, shine, border = '#000') {
  px(ctx, border, BAR_X - 1, y - 1, BAR_W + 2, BAR_H + 2);
  px(ctx, bg, BAR_X, y, BAR_W, BAR_H);
  const w = Math.round(BAR_W * Math.max(0, Math.min(1, fraction)));
  px(ctx, fg, BAR_X, y, w, BAR_H);
  if (w > 0) px(ctx, shine, BAR_X, y, w, 1);
}

// Label left of the bar and value right of it, both vertically centered on the 5px bar.
function barText(ctx, y, label, labelColor, value) {
  drawText(ctx, label, 6, y - 1, labelColor);
  drawText(ctx, value, BAR_X + BAR_W + 4, y - 1, COLORS.hudText);
}

function slot(ctx, x, y) {
  px(ctx, '#3a3a5a', x, y, SLOT, SLOT);
  px(ctx, '#14142a', x + 1, y + 1, SLOT - 2, SLOT - 2);
}

// Right-aligned "icon count" row.
function counter(ctx, icon, text, y, color) {
  const tx = RIGHT - textWidth(text);
  ctx.drawImage(icon, tx - icon.width - 3, y + 3 - Math.floor(icon.height / 2));
  drawText(ctx, text, tx, y, color);
}

export function drawHud(ctx, { player, room }) {
  px(ctx, COLORS.black, 0, 0, SCREEN_W, HUD_H);
  px(ctx, '#2a2a40', 0, HUD_H - 1, SCREEN_W, 1);

  // HP (label turns red when low)
  const low = player.hp / player.maxHp <= 0.25;
  bar(ctx, ROW_HP, player.hp / player.maxHp, COLORS.hpRed, COLORS.hpBack, '#ff8a8a');
  barText(ctx, ROW_HP, 'HP', low ? '#ff6060' : COLORS.hudDim, `${player.hp}/${player.maxHp}`);

  // MP (flashes when a cast is short on mana)
  const mana = Math.floor(player.mana);
  const flash = player.manaFlashT > 0 && Math.floor(player.manaFlashT * 16) % 2 === 0;
  bar(ctx, ROW_MP, player.mana / player.maxMana, '#3a7ae8', flash ? '#a02a2a' : '#14204a', '#8ab8ff', flash ? '#ff6060' : '#000');
  barText(ctx, ROW_MP, 'MP', flash ? '#ff6060' : COLORS.hudDim, `${mana}/${player.maxMana}`);

  // Level + XP
  if (isMaxLevel(player)) {
    bar(ctx, ROW_XP, 1, '#5ab0e8', '#1a3a5a', '#a8dcff');
    barText(ctx, ROW_XP, `L${player.level}`, '#a0e0ff', 'MAX');
  } else {
    const need = xpToNext(player.level);
    bar(ctx, ROW_XP, player.xp / need, '#5ab0e8', '#1a3a5a', '#a8dcff');
    barText(ctx, ROW_XP, `L${player.level}`, '#a0e0ff', `${Math.floor(player.xp)}/${need}`);
  }

  // Area + stats
  drawText(ctx, room.area.name.toUpperCase(), 6, ROW_INFO, '#c8c8a0');
  drawText(ctx, `ATK ${playerAttackDamage(player)} DEF ${player.defense}`, 64, ROW_INFO, COLORS.hudDim);

  // Equipment slots (sword art is 7x16, hero art 16x16, spell icons 12x12)
  slot(ctx, SLOTS_X, SLOTS_Y);
  ctx.drawImage(getSwordSprite(player.sword.id), SLOTS_X + 6, SLOTS_Y + 2);
  slot(ctx, SLOTS_X + SLOT + 3, SLOTS_Y);
  ctx.drawImage(getHeroSprites(player.armor.id).down[0], SLOTS_X + SLOT + 5, SLOTS_Y + 2);
  const spellX = SLOTS_X + (SLOT + 3) * 2;
  slot(ctx, spellX, SLOTS_Y);
  const spellId = player.spellId;
  if (spellId) {
    const cost = spellCost(player, spellId);
    ctx.drawImage(getSpellIcon(spellId), spellX + 4, SLOTS_Y + 4);
    // Cost under the slot, red when there isn't enough mana.
    drawTextCentered(ctx, `${cost}MP`, spellX + SLOT / 2, SLOTS_Y + SLOT + 3, mana >= cost ? '#8ab8ff' : '#ff6060');
  }

  // Gold, potions and mana potions, right-aligned
  counter(ctx, getCoinIcon(), `${player.gold}`, 4, '#ffe070');
  counter(ctx, getPotionIcon(), `x${player.potions}`, 15, player.potions ? COLORS.hudText : COLORS.hudDim);
  counter(ctx, getManaPotionIcon(), `x${player.manaPotions}`, 26, player.manaPotions ? COLORS.hudText : COLORS.hudDim);
}
