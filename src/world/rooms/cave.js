// Cave: dark, skeletons. Leads up to the castle.

export const CAVE_ROOMS = [
  {
    id: 'cave_entrance',
    area: 'cave',
    pos: [4, 4],
    map: [
      '#######__#######',
      '#____R_____R___#',
      '#_##_______##__#',
      '#_##___R___##__#',
      '_______________#',
      '_______R_______#',
      '_______________#',
      '#__R______R____#',
      '#_##________##_#',
      '#_##___R____##_#',
      '################',
    ],
    enemies: [
      { type: 'skeleton', x: 11, y: 5 },
      { type: 'skeleton', x: 6, y: 2 },
      { type: 'skeleton', x: 14, y: 6 },
    ],
  },
  {
    id: 'cave_lake',
    area: 'cave',
    pos: [4, 3],
    map: [
      '################',
      '#______~~~_____#',
      '#__R__~~~~~__R_#',
      '#______~~~_____#',
      '#__###__________',
      '#__#R#__________',
      '#__###__________',
      '#_________R____#',
      '#_R____________#',
      '#____R___R_____#',
      '#######__#######',
    ],
    enemies: [
      { type: 'skeleton', x: 11, y: 2 },
      { type: 'skeleton', x: 6, y: 8 },
      { type: 'skeleton', x: 12, y: 5 },
    ],
  },
  {
    id: 'cave_exit',
    area: 'cave',
    pos: [5, 3],
    map: [
      '#######__#######',
      '#_____#__#_____#',
      '#_R___#__#___R_#',
      '#_____#__#_____#',
      '________________',
      '____R___________',
      '_____________R__',
      '#__R_______R___#',
      '#______S_______#',
      '#_____R________#',
      '################',
    ],
    signs: [{ x: 7, y: 8, text: 'CASTLE AHEAD (NORTH)\nRecommended Lv 7\nMERCHANT CAMP: EAST' }],
    enemies: [
      { type: 'skeleton', x: 3, y: 2 },
      { type: 'skeleton', x: 11, y: 2 }, // kept away from the camp passage
    ],
  },
  {
    // Travelling merchant's camp: a safe, lit side room with a shop stall,
    // so you can gear up right before the castle.
    id: 'cave_merchant',
    area: 'camp',
    pos: [6, 3],
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
    shop: { title: 'TRAVELLING MERCHANT', greeting: 'HEH. SAME PRICES AS TOWN!' }, // the counter opens it
    savePoint: { x: 7, y: 5 }, // autosaves on entry; Continue starts here (tile coords)
    npcs: [
      { x: 7, y: 2, look: 'merchant', name: 'Merchant', lines: ['Step up to the counter, friend.'] },
    ],
  },
];
