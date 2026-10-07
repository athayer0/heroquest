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
  sand: '#d8b868', sandDark: '#a8853a', sandLight: '#f0d8a0',
  lava: '#e0501a', lavaLight: '#ffc040', lavaDark: '#8a2410',
  ice: '#bfe4f4', iceLight: '#f4fcff', iceDark: '#86b8d8',
  vent: '#4a3e44', ventDark: '#221a1e',
  cactus: '#4a9a4a', cactusDark: '#2a6a32', cactusLight: '#7ac868',
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
  // Lava Cave: dark, warm rock and bright lava (the camp shares it; its spring keeps the water colors).
  cave: {
    ...BASE,
    floor: '#3e3030', floorDark: '#2c2222', floorLight: '#523e3a',
    wall: '#33272a', wallDark: '#1c1416', wallLight: '#54403c',
    rock: '#54403a', rockLight: '#7a5c50', rockDark: '#2e2220',
    water: '#1e3c6e', waterLight: '#4a78b8', waterDark: '#142a50',
    lava: '#e8501a', lavaLight: '#ffc040', lavaDark: '#9a2a0c',
    vent: '#3a2c2c', ventDark: '#1a1212',
    door: '#0a0606',
  },
  // Sand for ground, sandstone for walls, stone and ruins; quicksand is a darker, wetter brown.
  desert: {
    ...BASE,
    grass: '#e2c27c', grassDark: '#c8a45c', grassLight: '#f2dca4',
    path: '#c8a060', pathDark: '#a88040', pathLight: '#dcb878',
    wall: '#c89a5a', wallDark: '#9a7038', wallLight: '#e2bc80',
    stone: '#ecd29a', stoneMid: '#c8a464', stoneDark: '#94703c',
    rock: '#b8946a', rockLight: '#d8b88a', rockDark: '#8a6a44',
    floor: '#c8a870', floorDark: '#a8885a', floorLight: '#dcc090',
    sand: '#b08040', sandDark: '#7a5424', sandLight: '#d0a868',
    roof: '#c8844a', roofDark: '#8a5428', roofLight: '#e8a868',
    plaster: '#f0dcb0', plasterDark: '#c8b080', timber: '#9a6a38',
    leaf: '#3a8a3a', leafLight: '#6ab84a', leafDark: '#1f5a2a',
    door: '#2a1a0a',
  },
  // Snow for ground, snow-dusted pines, icy grey-blue rock.
  peaks: {
    ...BASE,
    grass: '#e4ecf4', grassDark: '#c4d2e2', grassLight: '#ffffff',
    path: '#c8d4e2', pathDark: '#a8b8cc', pathLight: '#e0e8f2',
    leaf: '#2a5a50', leafLight: '#e8f4ff', leafDark: '#173a34', trunk: '#5a3a2a',
    wall: '#8a9cb4', wallDark: '#5a6a84', wallLight: '#c0d0e4',
    rock: '#9aa8bc', rockLight: '#d0dcea', rockDark: '#6a7890',
    stone: '#d8e0ea', stoneMid: '#a8b4c4', stoneDark: '#707c90',
    ice: '#a8dcf4', iceLight: '#f4fcff', iceDark: '#6aa8d0',
    roof: '#e8f0f8', roofDark: '#a8b8cc', roofLight: '#ffffff',
    plaster: '#b08858', plasterDark: '#8a6a40', timber: '#5a3a22',
    door: '#1a2030',
  },
  castle: {
    ...BASE,
    floor: '#8a7a8e', floorDark: '#6a5c70', floorLight: '#a494a8',
    wall: '#5c4a6e', wallDark: '#3c2e4a', wallLight: '#7c6a90',
    door: '#140a18',
  },
};
