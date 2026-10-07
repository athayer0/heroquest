// Retro color palettes. Areas pick a palette by name; tiles are pre-rendered per palette.

export const COLORS = {
  black: '#0e0e14',
  outline: '#1b1b23',
  white: '#f4f4f0',
  hudText: '#f4f4f0',
  hudDim: '#8a8a99',
  hpRed: '#d83a3a',
  hpBack: '#4a1a1a',
};

// Sword colors by tier (w blade, W blade shade, c crossguard, g grip).
export const SWORD_COLORS = {
  wooden: { k: '#1b1b23', w: '#c89858', W: '#8a6030', c: '#6b3d1e', g: '#4a2e14' },
  iron: { k: '#1b1b23', w: '#c8c8d0', W: '#7c7c88', c: '#6b3d1e', g: '#4a2e14' },
  steel: { k: '#1b1b23', w: '#b8e0ff', W: '#5a8cc8', c: '#3a4a6a', g: '#2a2a3a' },
  hero: { k: '#1b1b23', w: '#fff0a0', W: '#e0a830', c: '#c83a3a', g: '#5a2a7a' },
};

// Hero tunic colors by armor tier (g tunic, G tunic shade).
export const ARMOR_COLORS = {
  cloth: { g: '#3fa34d', G: '#2a6e34' },
  leather: { g: '#a8743a', G: '#6e4a22' },
  chainmail: { g: '#aab2c4', G: '#6a7286' },
  plate: { g: '#4a78d8', G: '#e0b040' },
};

const BASE = {
  outline: '#1b1b23',
  grass: '#5bb04a', grassDark: '#3e8a3a', grassLight: '#86d064',
  path: '#d8b878', pathDark: '#b8955a', pathLight: '#ecd29c',
  water: '#3a7bd5', waterLight: '#9cd0ff', waterDark: '#2a5aa8',
  wall: '#8a8a99', wallDark: '#5a5a6a', wallLight: '#b4b4c4',
  floor: '#c9b28a', floorDark: '#a68f68', floorLight: '#dcc8a2',
  leaf: '#2f8a3a', leafLight: '#4fb04a', leafDark: '#1f5e2a', trunk: '#7a4a22',
  rock: '#9a8a78', rockLight: '#c2b4a2', rockDark: '#6a5c4e',
  wood: '#b07c42', woodDark: '#7a5228', woodShadow: '#4a2e14',
  door: '#22140c',
  woodLight: '#d09a5a',
  roof: '#c84a3a', roofDark: '#8a2a22', roofLight: '#e87a5a',
  plaster: '#e8dcc0', plasterDark: '#c0b090', timber: '#7a4a22',
  glass: '#6ab8e8', glassLight: '#c8ecff',
  flowerRed: '#e84a5a', flowerYellow: '#f2d43a', flowerWhite: '#ffffff',
  carpet: '#a82a3a', carpetDark: '#6a1a2a', carpetGold: '#e0b040',
  stone: '#c8c0d0', stoneMid: '#9890a8', stoneDark: '#686078',
  iron: '#5a5a6a', ironDark: '#34343f', gold: '#e0b040',
  fire: '#f28a2a', fireLight: '#ffe060', fireRed: '#c83a1a',
};

export const AREA_PALETTES = {
  overworld: BASE,
  forest: {
    ...BASE,
    grass: '#3f8f3e', grassDark: '#2a6a30', grassLight: '#5aa84a',
    leaf: '#1f6a30', leafLight: '#3a8a3a', leafDark: '#124a20', trunk: '#5a3a1a',
    path: '#b09868', pathDark: '#8a7448', pathLight: '#c8b080',
    wall: '#6a6a72', wallDark: '#44444c', wallLight: '#8a8a94',
    door: '#0e0a08',
  },
  cave: {
    ...BASE,
    floor: '#4a4252', floorDark: '#352f3c', floorLight: '#5c5466',
    wall: '#3a3448', wallDark: '#24202e', wallLight: '#544c66',
    rock: '#5a5266', rockLight: '#766c86', rockDark: '#3a3444',
    water: '#1e3c6e', waterLight: '#4a78b8', waterDark: '#142a50',
    door: '#0a0810',
  },
  castle: {
    ...BASE,
    floor: '#8a7a8e', floorDark: '#6a5c70', floorLight: '#a494a8',
    wall: '#5c4a6e', wallDark: '#3c2e4a', wallLight: '#7c6a90',
    door: '#140a18',
  },
};
