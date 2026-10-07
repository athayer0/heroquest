// Lava Cave (Lv 9): skeletons and fire spirits among lava pools and fire vents.
// Entered from the Desert; leads up into the Frozen Peaks, with the merchant's camp off to the east.

export const CAVE_ROOMS = [
  {
    id: 'cave_entrance',
    area: 'cave',
    pos: [14, 4],
    map: [
      '#######__#######',
      '#____R_____R___#',
      '#_==_______==__#',
      '#_==___R___==__#',
      '_______________#',
      '_____^_R__^____#',
      '_______________#',
      '#__R______R____#',
      '#_==________==_#',
      '#_==___R____==_#',
      '################',
    ],
    enemies: [
      { type: 'skeleton', x: 11, y: 5 },
      { type: 'skeleton', x: 6, y: 2 },
      { type: 'fireSpirit', x: 8, y: 8 },
    ],
  },
  {
    id: 'cave_lake',
    area: 'cave',
    pos: [14, 3],
    map: [
      '################',
      '#______===_____#',
      '#__R__=====__R_#',
      '#______===_____#',
      '#__###__________',
      '#__#R#____^_____',
      '#__###__________',
      '#_________R____#',
      '#_R___^________#',
      '#____R___R_____#',
      '#######__#######',
    ],
    enemies: [
      { type: 'skeleton', x: 11, y: 2 },
      { type: 'skeleton', x: 8, y: 8 },
      { type: 'fireSpirit', x: 12, y: 5 },
    ],
  },
  {
    id: 'cave_exit',
    area: 'cave',
    pos: [15, 3],
    map: [
      '#######__#######',
      '#_____#__#_____#',
      '#_R==_#__#_==R_#',
      '#_____#__#_____#',
      '________________',
      '____R_____^_____',
      '_____________R__',
      '#__R_^_____R___#',
      '#______S_______#',
      '#_____R________#',
      '################',
    ],
    signs: [{ x: 7, y: 8, text: 'FROZEN PEAKS AHEAD (NORTH)\nRecommended Lv 12\nMERCHANT CAMP: EAST' }],
    enemies: [
      { type: 'skeleton', x: 2, y: 1 },
      { type: 'skeleton', x: 14, y: 1 }, // kept away from the camp passage
      { type: 'fireSpirit', x: 8, y: 6 },
    ],
  },
  {
    // Travelling merchant's camp: a safe, lit side room with a shop stall,
    // so you can gear up right before the castle.
    id: 'cave_merchant',
    area: 'camp',
    pos: [16, 3],
    map: [
      '################',
      '#B___######___B#',
      '#____#____#____#',
      '#____#CCCC#____#',
      '_______________#',
      '_______________#',
      '_______________#',
      '#__R________R__#',
      '#B____~~~_____B#',
      '#_____~~~______#',
      '################',
    ],
    shop: 'camp', // the counter opens it: supplies only (see SHOPS)
    savePoint: { x: 7, y: 5 }, // autosaves on entry; Continue starts here (tile coords)
    npcs: [
      { x: 7, y: 2, look: 'merchant', name: 'Merchant', lines: ['Step up to the counter, friend.'] },
    ],
  },
];
