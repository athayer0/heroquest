// Shop rules: each shop sells the stock in SHOPS (one gear tier per village, plus supplies).
// Gear auto-equips on purchase; anything at or below your current tier is "owned".
// The Magic tab sells spell tomes (learned once) and mana potions.
import { SWORDS, ARMOR, POTION, MANA_POTION, SPELLS, SHOPS } from '../config.js';
import { SPELL_KEYS } from '../input.js';
import { spellSummary } from './magic.js';
import { playerAttackDamage } from './combat.js';

const TOMES = Object.entries(SPELLS)
  .filter(([, spell]) => spell.price)
  .map(([id, spell]) => ({ kind: 'tome', spell: id, name: `${spell.name} Tome`, price: spell.price }));
const MANA_POTION_ITEM = { kind: 'manaPotion', name: 'Mana Potion', price: MANA_POTION.price };

// The tabs for one shop; tabs with nothing to sell are left out. Gear items carry their `tier`.
export function shopTabs(shopId) {
  const stock = SHOPS[shopId];
  const tabs = [];
  if (stock.swords?.length) {
    tabs.push({ id: 'sword', label: 'SWORDS', tierKey: 'swordTier', items: stock.swords.map((tier) => ({ ...SWORDS[tier], tier })) });
  }
  if (stock.armor?.length) {
    tabs.push({ id: 'armor', label: 'ARMOR', tierKey: 'armorTier', items: stock.armor.map((tier) => ({ ...ARMOR[tier], tier })) });
  }
  if (stock.potions) tabs.push({ id: 'potion', label: 'POTIONS', items: [{ name: 'Potion', price: POTION.price }] });
  const magic = [...(stock.tomes ? TOMES : []), ...(stock.manaPotions ? [MANA_POTION_ITEM] : [])];
  if (magic.length) tabs.push({ id: 'magic', label: 'MAGIC', items: magic });
  return tabs;
}

// 'equipped' | 'owned' | 'known' | 'buy' | 'full'
export function itemState(player, tab, index) {
  const item = tab.items[index];
  if (tab.id === 'potion') return player.potions >= POTION.max ? 'full' : 'buy';
  if (tab.id === 'magic') {
    if (item.kind === 'tome') return player.knowsSpell(item.spell) ? 'known' : 'buy';
    return player.manaPotions >= MANA_POTION.max ? 'full' : 'buy';
  }
  const tier = player[tab.tierKey];
  if (item.tier === tier) return 'equipped';
  if (item.tier < tier) return 'owned';
  return 'buy';
}

// Returns { ok, message }.
export function buy(player, tab, index) {
  const item = tab.items[index];
  const state = itemState(player, tab, index);
  if (state === 'equipped' || state === 'owned') return { ok: false, message: 'YOU ALREADY HAVE THAT.' };
  if (state === 'known') return { ok: false, message: 'YOU ALREADY KNOW THAT SPELL.' };
  if (state === 'full') return { ok: false, message: `YOU CAN ONLY CARRY ${tab.id === 'magic' ? MANA_POTION.max : POTION.max}.` };
  if (player.gold < item.price) return { ok: false, message: 'NOT ENOUGH GOLD.' };

  player.gold -= item.price;
  if (tab.id === 'potion') {
    player.potions++;
    return { ok: true, message: `BOUGHT A POTION! (${player.potions}/${POTION.max})` };
  }
  if (item.kind === 'manaPotion') {
    player.manaPotions++;
    return { ok: true, message: `BOUGHT A MANA POTION! (${player.manaPotions}/${MANA_POTION.max})` };
  }
  if (item.kind === 'tome') {
    player.learnSpell(item.spell);
    // Spells past the last number key can only be reached with the wheel.
    const key = player.spellIndex + 1;
    const where = key <= SPELL_KEYS ? `IT'S ON KEY ${key}.` : 'SCROLL TO SELECT IT.';
    return { ok: true, message: `LEARNED ${SPELLS[item.spell].name.toUpperCase()}! ${where}` };
  }
  player[tab.tierKey] = item.tier;
  return { ok: true, message: `EQUIPPED ${item.name.toUpperCase()}!` };
}

// Stat line shown for the highlighted item, e.g. "DAMAGE 5 > 9".
export function previewText(player, tab, index) {
  const item = tab.items[index];
  if (tab.id === 'sword') {
    return `DAMAGE ${playerAttackDamage(player)} > ${playerAttackDamage(player, item.bonus)}`;
  }
  if (tab.id === 'armor') {
    return `DEFENSE ${player.defense} > ${player.defense - player.armor.defense + item.defense}`;
  }
  if (item.kind === 'tome') return `SPELL: ${spellSummary(item.spell, player)}`;
  if (item.kind === 'manaPotion') return `RESTORES ${MANA_POTION.restore} MP   CARRYING ${player.manaPotions}/${MANA_POTION.max}`;
  return `HEALS ${POTION.heal} HP   CARRYING ${player.potions}/${POTION.max}`;
}
