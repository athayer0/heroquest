// Debug test room (reach it with T when the URL has ?debug): every terrain tile, two slimes for
// trying burn and chill on, and a chest that should stay open after saving and reloading.
// It isn't linked to any other room.

export const DEBUG_ROOMS = [
  {
    id: 'debug_test',
    area: 'test',
    map: [
      '################',
      '#______________#',
      '#_%%%%___==____#',
      '#_%%%%___==__^_#',
      '#_%%%%_______^_#',
      '#____________^_#',
      '#_*****___^^___#',
      '#_*****___^^___#',
      '#_*****________#',
      '#______________#',
      '################',
    ],
    savePoint: { x: 7, y: 4 },
    chests: [{ id: 'debug_chest', x: 12, y: 1, contents: { gold: 25 } }],
    enemies: [
      { type: 'slime', x: 13, y: 8 },
      { type: 'slime', x: 7, y: 1 },
    ],
  },
];
