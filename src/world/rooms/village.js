// Village: safe area with the story Elder, tips from villagers, the shop and the respawn point.
// `pos` is the room's place on the world grid; neighbors are linked automatically
// wherever two adjacent rooms have matching open edges.

export const VILLAGE_ROOMS = [
  {
    id: 'village_west',
    area: 'village',
    pos: [0, 8],
    map: [
      'TTTTTTTTTTTTTTTT',
      'T..............T',
      'T.rrrr...rrrr..T',
      'T.rrrr...rrrr..T',
      'T.hdwh...hwdh...',
      'T..:.......:....',
      'T..::::::::::...',
      'T,,....,,......T',
      'T,,.FFFF..,,...T',
      'T......b.......T',
      'TTTTTTTTTTTTTTTT',
    ],
    npcs: [
      {
        x: 12, y: 8, look: 'villager', name: 'Mira',
        lines: ['Press Q to drink a potion. The shop sells them for 15 gold, and you can carry up to 5.'],
      },
      {
        x: 8, y: 5, look: 'kid', name: 'Pip',
        lines: ["Bats are super fast, but they stop to rest sometimes! That's when you whack 'em!"],
      },
      {
        x: 4, y: 7, look: 'farmer', name: 'Old Tom',
        lines: ["Goblins shout before they charge. Step aside, then hit 'em while they're seeing stars."],
      },
    ],
  },
  {
    id: 'village_square',
    area: 'village',
    pos: [1, 8],
    respawn: { x: 7, y: 6 },
    map: [
      'TTTTTTT..TTTTTTT',
      'T,,..S.::....,,T',
      'T.rrrr.::.rrrr.T',
      'T.rrrr.::.rrrr.T',
      '..hwdh.::.hdwh..',
      '......::::......',
      '................',
      'T,,....~~....,,T',
      'T,,....~~....,,T',
      'T..............T',
      'TTTTTTTTTTTTTTTT',
    ],
    signs: [{ x: 5, y: 1, text: 'NORTH: MEADOW\nEAST: MARKET\nWEST: HOUSES' }],
    npcs: [
      {
        x: 10, y: 7, look: 'elder', name: 'Elder',
        lines: [
          "Hero! Thank goodness you're awake.",
          'The Dark Lord has captured the Princess and locked her away in his castle, far to the north.',
          'The road there leads through the Meadow, the Forest and a dark Cave. Each is more dangerous than the last.',
          'Start with the slimes in the Meadow, and heed the signs. They tell you how strong you should be.',
          'Spend your gold at the market to the east. Better swords and armor make all the difference.',
          "And if you fall, don't despair. You'll wake up here in the village. Now go, and bring her home!",
        ],
      },
      {
        x: 10, y: 1, look: 'guard', name: 'Guard',
        lines: ['The Meadow is just north. Slimes are slow, so take them on one at a time.'],
      },
      {
        x: 4, y: 8, look: 'villager', name: 'Rosa',
        lines: ['When you level up, you can choose more max HP or more damage. Both are good choices!'],
      },
    ],
  },
  {
    id: 'village_market',
    area: 'village',
    pos: [2, 8],
    map: [
      'TTTTTTTTTTTTTTTT',
      'T,,..........,,T',
      'T..rrrrrrrrrr..T',
      'T..hhwhhhhwhh..T',
      '...h________h..T',
      '...hCCCCCCCCh..T',
      '...............T',
      'T......::......T',
      'T,,...S::...,,.T',
      'T..............T',
      'TTTTTTTTTTTTTTTT',
    ],
    shop: true, // the counter (C) opens the shop
    signs: [{ x: 6, y: 8, text: 'VILLAGE MARKET\nSwords, armor and potions.\nStep up to the counter!' }],
    npcs: [
      { x: 8, y: 4, look: 'shopkeeper', name: 'Shopkeeper', lines: ['Welcome! Talk to me across the counter.'] },
      {
        x: 3, y: 7, look: 'guard', name: 'Old Knight',
        lines: [
          'Castle knights block anything that hits their shield.',
          'They turn slowly, though. Get around to their side or back and strike!',
          'And if you need supplies on the road, a travelling merchant has set up camp at the far end of the Cave. Look east, just before the path up to the Castle.',
        ],
      },
    ],
  },
];
