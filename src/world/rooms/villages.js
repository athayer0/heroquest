// Frontier villages: safe towns along the road, each selling the next tier of gear (see SHOPS).
// Like the starting Village they autosave, become where you respawn, and are fast-travel stops.

export const FRONTIER_VILLAGE_ROOMS = [
  {
    // Oasis town in the Desert, between Desert West and the Ruins.
    id: 'sunwell',
    area: 'sunwell',
    pos: [41, 4],
    map: [
      '################',
      '#..rrrrrrrr..T.#',
      '#..hhwhhwhh....#',
      '#..h______h..T.#',
      '...hCCCCCCh.....',
      '................',
      '.....~~~~.......',
      '#.T..~~~~..rrr.#',
      '#....S.....hdh.#',
      '#.T.........T..#',
      '################',
    ],
    shop: 'sunwell', // the counter (C) opens it
    savePoint: { x: 7, y: 5 },
    respawn: { x: 7, y: 5 },
    signs: [{ x: 5, y: 8, text: 'SUNWELL\nAn oasis town on the desert road.\nThe bazaar sells chainmail and steel swords.' }],
    npcs: [
      { x: 6, y: 3, look: 'shopkeeper', name: 'Trader', lines: ['Welcome to the bazaar! Talk to me across the counter.'] },
      {
        x: 9, y: 8, look: 'farmer', name: 'Well-keeper',
        lines: [
          "The Sand Pharaoh's tomb lies past the ruins to the east. Folk say he guards one of the seals of the Castle gate.",
          'He sinks into the sand and bursts up right under you. Watch for his shadow, and keep moving!',
        ],
      },
      {
        x: 13, y: 5, look: 'villager2', name: 'Traveller',
        lines: [
          'Lost? Press M to see a map of everywhere you have been.',
          'And once a place is clear of monsters, you can travel straight back to any town from the map.',
        ],
      },
    ],
  },
  {
    // Mountain hamlet in the Frozen Peaks, between the Base and the Slope.
    id: 'frosthold',
    area: 'frosthold',
    pos: [50, 3],
    map: [
      'TTTTTTT..TTTTTTT',
      'T......::......T',
      'Trrrr..::.rrrrrT',
      'Thwdh..::.hhwhhT',
      'T.....S::.h___hT',
      'T......::.hCCChT',
      'T......::......T',
      'T.T....::...T..T',
      'T......::......T',
      'TT.....::.....TT',
      'TTTTTTT..TTTTTTT',
    ],
    shop: 'frosthold',
    savePoint: { x: 5, y: 6 },
    respawn: { x: 5, y: 6 },
    signs: [{ x: 6, y: 4, text: "FROSTHOLD\nA hamlet high in the snow.\nThe forge sells plate armor and the Hero's Blade." }],
    npcs: [
      { x: 12, y: 4, look: 'shopkeeper', name: 'Smith', lines: ['The forge is hot, the steel is good. Talk to me across the counter.'] },
      {
        x: 3, y: 6, look: 'guard', name: 'Lookout',
        lines: [
          "The Frost Wyrm nests up the slope. Its hide turns a blade, but after it breathes it's dazed for a moment. Strike then!",
          'Bring fire, too. The ice spirits hate it.',
        ],
      },
      {
        x: 13, y: 8, look: 'villager', name: 'Innkeeper',
        lines: ["The Castle gate is just past the slope. It won't open without both seals, mind."],
      },
    ],
  },
];
