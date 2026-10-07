// Spellcasting: mana costs, the cast cooldown, and what each spell does.
import { MANA, SPELLS, SKILLS } from '../config.js';
import { Projectile } from '../entities/projectile.js';
import { FloatText, Puff, LightningArc } from '../entities/effects.js';
import { spellDamage, spellHealAmount } from './combat.js';
import { heroBonus } from './skills.js';
import { dirTo } from '../util.js';

// Each effect returns false if the spell couldn't be cast (no mana is spent).
// ctx: { spawnProjectile, addEffect, addSkillXp, enemies, strike(enemy, damage, from) }
// Firebolt and Frost Shard: a bolt toward the mouse that burns or chills what it hits.
function castBolt(player, spell, target, ctx) {
  const c = player.center;
  const d = dirTo(c.x, c.y, target.x, target.y, { x: 0, y: 1 });
  ctx.spawnProjectile(new Projectile({
    x: c.x + d.x * 6, y: c.y + d.y * 6 - 2,
    vx: d.x * spell.speed, vy: d.y * spell.speed,
    attack: spellDamage(player, spell),
    kind: spell.bolt, size: 6, life: spell.range / spell.speed,
    swordable: false, friendly: true, pierce: heroBonus.boltPierce(player), element: spell.element,
  }));
  if (!player.attacking) player.facing = player.facingFromAngle(Math.atan2(d.y, d.x));
  return true;
}

// Chain Lightning: strikes the enemy nearest the mouse (in range), then jumps to the nearest
// enemies not yet hit. With no enemy near the mouse, nothing is cast.
function castChain(player, spell, target, ctx) {
  const c = player.center;
  const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
  const live = ctx.enemies.filter((e) => e.active);
  const first = live
    .filter((e) => dist(e.center, c) <= spell.range && dist(e.center, target) <= spell.aimRadius)
    .sort((a, b) => dist(a.center, target) - dist(b.center, target))[0];
  if (!first) {
    ctx.addEffect(new FloatText('NO TARGET', c.x, c.y - 18, '#c0c0d0'));
    return false;
  }
  const damage = spellDamage(player, spell);
  const hit = [first];
  for (let i = 0; i < spell.jumps; i++) {
    const last = hit[hit.length - 1].center;
    const next = live
      .filter((e) => !hit.includes(e) && dist(e.center, last) <= spell.jumpRange)
      .sort((a, b) => dist(a.center, last) - dist(b.center, last))[0];
    if (!next) break;
    hit.push(next);
  }
  let from = c;
  for (const enemy of hit) {
    const to = enemy.center;
    ctx.addEffect(new LightningArc(from, to));
    ctx.strike(enemy, damage, from);
    from = to;
  }
  return true;
}

const EFFECTS = {
  firebolt: castBolt,
  frostShard: castBolt,
  chainLightning: castChain,

  heal(player, spell, target, ctx) {
    const c = player.center;
    if (player.hp >= player.maxHp) {
      ctx.addEffect(new FloatText('HP IS FULL', c.x, c.y - 18, '#c0c0d0'));
      return false;
    }
    const healed = player.heal(spellHealAmount(player, spell));
    ctx.addSkillXp('restoration', healed * SKILLS.restoration.xpPerHeal); // overheal doesn't count
    ctx.addEffect(new Puff(c.x, c.y, 0.4, '#80ff90'));
    ctx.addEffect(new FloatText(`+${healed}`, c.x, c.y - 18, '#80ff90'));
    return true;
  },

  // A shield that destroys enemy projectiles that come close (see PlayScene.resolveProjectiles).
  ward(player, spell, target, ctx) {
    const c = player.center;
    player.wardT = spell.time;
    ctx.addEffect(new Puff(c.x, c.y, 0.35, '#a0e0ff'));
    return true;
  },
};

// Mana cost after perks (Efficient makes Destruction spells cheaper).
export function spellCost(player, id) {
  const spell = SPELLS[id];
  const mult = spell.school === 'destruction' ? heroBonus.destructionCostMult(player) : 1;
  return Math.round(spell.cost * mult);
}

// Casts the equipped spell toward `target` (room pixels). Returns true if it was cast.
export function castSpell(player, target, ctx) {
  const id = player.spellId;
  if (!id || player.rolling || player.frozen || player.castCd > 0) return false;
  const spell = SPELLS[id];
  const cost = spellCost(player, id);
  if (player.mana < cost) {
    player.manaFlashT = MANA.emptyFlashTime;
    return false;
  }
  if (!EFFECTS[id](player, spell, target, ctx)) return false;
  player.mana -= cost;
  player.castCd = MANA.castCooldown;
  player.manaRegenDelay = MANA.regenDelay;
  return true;
}

// One-line description for the shop with the hero's skill bonuses, e.g. "HEALS 15 HP  8 MP".
export function spellSummary(id, player) {
  const spell = SPELLS[id];
  let what;
  if (spell.heal) what = `HEALS ${spellHealAmount(player, spell)} HP`;
  else if (id === 'ward') what = `${spell.time}S SHIELD VS SHOTS`;
  else if (id === 'chainLightning') what = `${spellDamage(player, spell)} DMG, JUMPS X${spell.jumps}`;
  else what = `${spellDamage(player, spell)} DMG + ${spell.element === 'ice' ? 'CHILL' : 'BURN'}`;
  return `${what}  ${spellCost(player, id)} MP`;
}
