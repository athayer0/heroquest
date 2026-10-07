// Pause menu (Esc): resume, skills (and perks), map, controls, quit to title. Play time doesn't count while paused.
import { SCREEN_W, SCREEN_H } from '../constants.js';
import { SKILLS, PERKS, CASTLE_GATE } from '../config.js';
import { drawText, drawTextCentered, textWidth } from '../gfx/font.js';
import { px } from '../gfx/sprites.js';
import { formatTime } from '../util.js';
import { playerAttackDamage } from '../systems/combat.js';
import { SKILL_IDS, skillXpToNext, isSkillMaxed, bonusText, perkState, buyPerk } from '../systems/skills.js';
import { drawPanel, dimScreen, PANEL } from './panel.js';
import { sealCount } from '../entities/bosses/index.js';
import { MapScene } from './map.js';

const W = 216;
const H = 180;
const OPTIONS = ['RESUME', 'SKILLS', 'MAP', 'CONTROLS', 'QUIT TO TITLE'];
const CONTROLS = [
  ['ARROWS / WASD', 'MOVE'],
  ['CLICK', 'SWING SWORD'],
  ['RIGHT CLICK', 'CAST SPELL'],
  ['1-5 / WHEEL', 'SWITCH SPELL'],
  ['SPACE', 'DODGE ROLL'],
  ['E', 'TALK / READ / SHOP'],
  ['Q', 'HEALTH POTION'],
  ['R', 'MANA POTION'],
  ['M', 'MAP / FAST TRAVEL'],
  ['ESC', 'PAUSE'],
];

export class PauseScene {
  constructor(game, player) {
    this.game = game;
    this.player = player;
    this.selected = 0;
    this.view = 'menu'; // 'menu' | 'skills' | 'perks' | 'controls' | 'quit'
    this.quitChoice = 1; // 0 = yes, 1 = no
    this.skillIndex = 0;
    this.perkIndex = 0;
    this.message = null; // { text, color } on the perks page
  }

  get skillId() {
    return SKILL_IDS[this.skillIndex];
  }

  get perkIds() {
    return Object.keys(PERKS[this.skillId]);
  }

  update() {
    const input = this.game.input;
    const ok = input.wasPressed('dodge') || input.wasPressed('interact') || input.wasPressed('confirm');

    if (this.view === 'controls') {
      if (ok || input.wasPressed('pause')) this.view = 'menu';
      return;
    }
    if (this.view === 'skills') {
      if (input.wasPressed('pause')) this.view = 'menu';
      else if (input.wasPressed('up')) this.skillIndex = (this.skillIndex + SKILL_IDS.length - 1) % SKILL_IDS.length;
      else if (input.wasPressed('down')) this.skillIndex = (this.skillIndex + 1) % SKILL_IDS.length;
      else if (ok) {
        this.view = 'perks';
        // Start on the first perk you can learn, if any.
        const i = this.perkIds.findIndex((id) => perkState(this.player, id) === 'available');
        this.perkIndex = Math.max(0, i);
        this.message = null;
      }
      return;
    }
    if (this.view === 'perks') {
      const n = this.perkIds.length;
      if (input.wasPressed('pause')) this.view = 'skills';
      else if (input.wasPressed('up')) this.perkIndex = (this.perkIndex + n - 1) % n;
      else if (input.wasPressed('down')) this.perkIndex = (this.perkIndex + 1) % n;
      else if (ok) this.learnSelected();
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
    else if (this.selected === 1) this.view = 'skills';
    else if (this.selected === 2) this.game.push(new MapScene(this.game, this.game.play));
    else if (this.selected === 3) this.view = 'controls';
    else {
      this.view = 'quit';
      this.quitChoice = 1;
    }
  }

  learnSelected() {
    const id = this.perkIds[this.perkIndex];
    const perk = PERKS[this.skillId][id];
    const state = perkState(this.player, id);
    if (buyPerk(this.player, id)) this.message = { text: `LEARNED ${perk.name.toUpperCase()}!`, color: '#80ff90' };
    else if (state === 'owned') this.message = { text: 'ALREADY LEARNED.', color: '#c0c0d0' };
    else if (state === 'locked') {
      this.message = { text: `NEEDS ${SKILLS[this.skillId].name.toUpperCase()} LV ${perk.skillLevel}.`, color: '#ff8080' };
    } else this.message = { text: 'NO PERK POINTS. LEVEL UP!', color: '#ff8080' };
  }

  draw(ctx) {
    dimScreen(ctx, SCREEN_W, SCREEN_H, 0.6);
    const x = Math.round((SCREEN_W - W) / 2);
    const y = Math.round((SCREEN_H - H) / 2);
    drawPanel(ctx, x, y, W, H);
    drawTextCentered(ctx, 'PAUSED', SCREEN_W / 2, y + 10, '#ffe040', 2);

    if (this.view === 'controls') this.drawControls(ctx, x, y);
    else if (this.view === 'skills') this.drawSkills(ctx, x, y);
    else if (this.view === 'perks') this.drawPerks(ctx, x, y);
    else if (this.view === 'quit') this.drawQuit(ctx, x, y);
    else this.drawMenu(ctx, x, y);
  }

  drawMenu(ctx, x, y) {
    OPTIONS.forEach((label, i) => {
      const oy = y + 32 + i * 12;
      const selected = i === this.selected;
      if (selected) {
        px(ctx, PANEL.highlight, x + 30, oy - 3, W - 60, 13);
        drawText(ctx, '>', x + 34, oy, '#ffe040');
      }
      drawTextCentered(ctx, label, SCREEN_W / 2, oy, selected ? '#ffffff' : '#a0a0b8');
    });

    // Run stats
    const p = this.player;
    const sy = y + 100;
    px(ctx, PANEL.shadow, x + 10, sy - 6, W - 20, 1);
    const rows = [
      ['PLAY TIME', formatTime(p.stats.playTime)],
      ['ENEMIES DEFEATED', p.stats.kills],
      ['DEATHS', p.stats.deaths],
      ['ATTACK / DEFENSE', `${playerAttackDamage(p)} / ${p.defense}`],
      ['CASTLE SEALS', `${sealCount(p)} / ${CASTLE_GATE.sealsRequired}`],
      ['GEAR', `${p.sword.name.toUpperCase()}`],
      ['', `${p.armor.name.toUpperCase()}`],
    ];
    rows.forEach(([label, value], i) => {
      drawText(ctx, label, x + 12, sy + i * 11, '#8a8aa0');
      const v = String(value);
      drawText(ctx, v, x + W - 12 - v.length * 6 + 1, sy + i * 11, '#f4f4f0');
    });
  }

  // Each skill: name and level, an XP bar toward the next level, and its passive bonus.
  // A "!" marks skills with a perk you could learn right now.
  drawSkills(ctx, x, y) {
    const p = this.player;
    SKILL_IDS.forEach((id, i) => {
      const skill = p.skills[id];
      const oy = y + 32 + i * 24;
      const selected = i === this.skillIndex;
      if (selected) px(ctx, PANEL.highlight, x + 6, oy - 3, W - 12, 22);
      const name = SKILLS[id].name.toUpperCase();
      drawText(ctx, name, x + 12, oy, selected ? '#ffffff' : '#c0c0d0');
      if (Object.keys(PERKS[id]).some((perkId) => perkState(p, perkId) === 'available')) {
        drawText(ctx, '!', x + 12 + textWidth(name) + 4, oy, '#ffe040');
      }
      const lv = `LV ${skill.level}`;
      drawText(ctx, lv, x + W - 12 - textWidth(lv), oy, '#ffe040');
      const barW = 60;
      const fill = isSkillMaxed(skill) ? 1 : skill.xp / skillXpToNext(skill.level);
      px(ctx, '#000', x + 11, oy + 10, barW + 2, 6);
      px(ctx, '#1a3a5a', x + 12, oy + 11, barW, 4);
      px(ctx, '#5ab0e8', x + 12, oy + 11, Math.round(barW * Math.min(1, fill)), 4);
      const bonus = bonusText(p, id);
      drawText(ctx, bonus, x + W - 12 - textWidth(bonus), oy + 10, '#a0e0ff');
    });
    this.drawPoints(ctx, y + H - 30);
    drawTextCentered(ctx, 'SPACE: PERKS   ESC: BACK', SCREEN_W / 2, y + H - 16, '#7a7a90');
  }

  drawPoints(ctx, py) {
    const n = this.player.perkPoints;
    drawTextCentered(ctx, `PERK POINTS: ${n}`, SCREEN_W / 2, py, n > 0 ? '#ffe040' : '#8a8aa0');
  }

  // One skill's four perks: owned, ready to learn, or locked until the skill reaches a level.
  drawPerks(ctx, x, y) {
    const p = this.player;
    const skillId = this.skillId;
    const header = `${SKILLS[skillId].name.toUpperCase()} LV ${p.skills[skillId].level}`;
    drawTextCentered(ctx, header, SCREEN_W / 2, y + 30, '#a0e0ff');
    this.perkIds.forEach((id, i) => {
      const perk = PERKS[skillId][id];
      const state = perkState(p, id);
      const oy = y + 44 + i * 24;
      const selected = i === this.perkIndex;
      if (selected) {
        px(ctx, PANEL.highlight, x + 6, oy - 3, W - 12, 22);
        drawText(ctx, '>', x + 10, oy, '#ffe040');
      }
      const nameColor = state === 'owned' ? '#80ff90' : state === 'locked' ? '#6a6a80' : '#ffffff';
      drawText(ctx, perk.name.toUpperCase(), x + 18, oy, nameColor);
      const [label, color] = {
        owned: ['OWNED', '#80ff90'],
        available: ['LEARN', '#ffe040'],
        nopoints: ['NO POINTS', '#8a8aa0'],
        locked: [`NEED LV ${perk.skillLevel}`, '#c06060'],
      }[state];
      drawText(ctx, label, x + W - 12 - textWidth(label), oy, color);
      drawText(ctx, perk.desc, x + 18, oy + 10, state === 'locked' ? '#5a5a70' : '#8a8aa0');
    });
    if (this.message) drawTextCentered(ctx, this.message.text, SCREEN_W / 2, y + H - 42, this.message.color);
    this.drawPoints(ctx, y + H - 30);
    drawTextCentered(ctx, 'SPACE: LEARN   ESC: BACK', SCREEN_W / 2, y + H - 16, '#7a7a90');
  }

  drawControls(ctx, x, y) {
    CONTROLS.forEach(([key, action], i) => {
      const oy = y + 36 + i * 13;
      drawText(ctx, key, x + 12, oy, '#ffe040');
      drawText(ctx, action, x + 98, oy, '#f4f4f0');
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
