// Shop rules: gear auto-equips on purchase; anything at or below your current tier is "owned".
import { SWORDS, ARMOR, POTION } from '../config.js';

export const SHOP_TABS = [
  { id: 'sword', label: 'SWORDS', items: SWORDS, tierKey: 'swordTier' },
  { id: 'armor', label: 'ARMOR', items: ARMOR, tierKey: 'armorTier' },
  { id: 'potion', label: 'POTIONS', items: [{ name: 'Potion', price: POTION.price }] },
];

// 'equipped' | 'owned' | 'buy' | 'full'
export function itemState(player, tab, index) {
  if (tab.id === 'potion') return player.potions >= POTION.max ? 'full' : 'buy';
  const tier = player[tab.tierKey];
  if (index === tier) return 'equipped';
  if (index < tier) return 'owned';
  return 'buy';
}

// Returns { ok, message }.
export function buy(player, tab, index) {
  const item = tab.items[index];
  const state = itemState(player, tab, index);
  if (state === 'equipped' || state === 'owned') return { ok: false, message: 'YOU ALREADY HAVE THAT.' };
  if (state === 'full') return { ok: false, message: `YOU CAN ONLY CARRY ${POTION.max}.` };
  if (player.gold < item.price) return { ok: false, message: 'NOT ENOUGH GOLD.' };

  player.gold -= item.price;
  if (tab.id === 'potion') {
    player.potions++;
    return { ok: true, message: `BOUGHT A POTION! (${player.potions}/${POTION.max})` };
  }
  player[tab.tierKey] = index;
  return { ok: true, message: `EQUIPPED ${item.name.toUpperCase()}!` };
}

// Stat line shown for the highlighted item, e.g. "DAMAGE 5 > 9".
export function previewText(player, tab, index) {
  const item = tab.items[index];
  if (tab.id === 'sword') {
    const now = player.baseDamage + player.swordBonus;
    return `DAMAGE ${now} > ${player.baseDamage + item.bonus}`;
  }
  if (tab.id === 'armor') {
    return `DEFENSE ${player.defense} > ${player.defense - player.armor.defense + item.defense}`;
  }
  return `HEALS ${POTION.heal} HP   CARRYING ${player.potions}/${POTION.max}`;
}
