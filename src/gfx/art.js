// Pixel-array art (pure data, no DOM). All sprites are 16x16.

// ---------- Tile overlays (drawn on top of the room's ground tile) ----------
// k outline, L leaf, l leaf light, D leaf dark, t trunk
export const TREE = [
  '.....kkkkkk.....',
  '...kkLLLLLLkk...',
  '..kLLLlLLLLLLk..',
  '.kLLlllLLLLLLLk.',
  '.kLlllLLLLLlLLk.',
  'kLLllLLLLLlllLLk',
  'kLLLLLLLLlllLLLk',
  'kLLLLLLLLLlLLLDk',
  'kLLlLLLLLLLLLLDk',
  '.kLlllLLLLLLLDk.',
  '.kLLlLLLLLLDDDk.',
  '..kDDLLLLDDDDk..',
  '...kkDDDDDDkk...',
  '.....kkttkk.....',
  '......kttk......',
  '.....kkttkk.....',
];

// k outline, r light, R rock, d dark
export const ROCK = [
  '....kkkkkkk.....',
  '..kkrrrrRRRkk...',
  '.krrrRRRRRRRRk..',
  '.krrRRRRRRRRRRk.',
  'krrRRRRRRRRRRRdk',
  'krRRRRRRRRRRRRdk',
  'kRRRRRRRRRRRRddk',
  'kRRRRRRRRRRRRddk',
  'kRRRRRRRRRRRdddk',
  'kRRRRRRRRRRddddk',
  'kdRRRRRRRRdddddk',
  'kddRRRRRRddddddk',
  '.kdddddddddddddk',
  '.kkdddddddddddk.',
  '...kkkkkkkkkkk..',
  '................',
];

// k outline, w wood, d wood dark (lettering), W wood shadow
export const SIGN = [
  '................',
  '................',
  '.kkkkkkkkkkkkkk.',
  '.kwwwwwwwwwwwwk.',
  '.kwddddddddddwk.',
  '.kwwwwwwwwwwwwk.',
  '.kwddddddwwwwwk.',
  '.kwwwwwwwwwwwwk.',
  '.kWWWWWWWWWWWWk.',
  '.kkkkkkkkkkkkkk.',
  '......kddk......',
  '......kwdk......',
  '......kwdk......',
  '......kwdk......',
  '.....kkkkkk.....',
  '................',
];

// ---------- Sword (pointing up; rotated/flipped for other facings) ----------
// k outline, w blade light, W blade shade, c crossguard, g grip
export const SWORD_ART = [
  '...k...',
  '..kwk..',
  '.kwwWk.',
  '.kwwWk.',
  '.kwwWk.',
  '.kwwWk.',
  '.kwwWk.',
  '.kwwWk.',
  '.kwwWk.',
  'kkkkkkk',
  'kccccck',
  'kkkgkkk',
  '..kgk..',
  '..kgk..',
  '..kck..',
  '..kkk..',
];

// ---------- Slime ----------
// k outline, b body, B body dark, w highlight
export const SLIME = [
  '................',
  '................',
  '................',
  '................',
  '......kkkk......',
  '....kkbbbbkk....',
  '...kbwwbbbbbk...',
  '..kbwwbbbbbbbk..',
  '..kbwbbbbbbbbk..',
  '.kbbbkbbbbkbbbk.',
  '.kbbbkbbbbkbbbk.',
  '.kbbbbbbbbbbbbk.',
  '.kBbbbbbbbbbbBk.',
  '.kBBbbbbbbbbBBk.',
  '..kBBBBBBBBBBk..',
  '...kkkkkkkkkk...',
];

// ---------- Pickups ----------
// k outline, y gold, Y gold shade, w shine
export const COIN = [
  [
    '..kkkk..',
    '.kyyyYk.',
    'kyywyyYk',
    'kywyyyYk',
    'kyyyyyYk',
    'kyyyyYYk',
    '.kYYYYk.',
    '..kkkk..',
  ],
  [
    '...kk...',
    '..kyYk..',
    '..kwYk..',
    '..kyYk..',
    '..kyYk..',
    '..kyYk..',
    '..kYYk..',
    '...kk...',
  ],
];

// k outline, r red, w shine
export const HEART = [
  '.kk.kk.',
  'kwrkrrk',
  'krrrrrk',
  'krrrrrk',
  '.krrrk.',
  '..krk..',
  '...k...',
];

// ---------- Bat ----------
// k outline, b body, B wing, e eye
export const BAT = [
  [
    '................',
    '................',
    '................',
    '.k............k.',
    'kBk..........kBk',
    'kBBk..kkkk..kBBk',
    'kBBBkkbbbbkkBBBk',
    '.kBBBbebbebBBBk.',
    '..kBBbbbbbbBBk..',
    '...kkbbbbbbkk...',
    '.....kbkkbk.....',
    '......k..k......',
    '................',
    '................',
    '................',
    '................',
  ],
  [
    '................',
    '................',
    '................',
    '................',
    '................',
    '......kkkk......',
    '.....kbbbbk.....',
    '....kbebbebk....',
    '.kkkBbbbbbbBkkk.',
    'kBBBBBbbbbBBBBBk',
    'kBBBBkkbbkkBBBBk',
    '.kBBk.kbbk.kBBk.',
    '..kk...kk...kk..',
    '................',
    '................',
    '................',
  ],
];

// ---------- Goblin ----------
// k outline, g skin, G skin dark, e eye, w teeth, t tunic, T tunic dark
const GOBLIN_TOP = [
  '................',
  '..k..........k..',
  '..kgk.kkkk.kgk..',
  '...kgkggggkgk...',
  '....kggggggk....',
  '...kgeggggegk...',
  '...kggggggggk...',
  '...kgwkwwkwgk...',
  '....kGggggGk....',
  '...kkttttttkk...',
  '..kgkttTTttkgk..',
  '..kgkttttttkgk..',
  '...kkTTTTTTkk...',
  '....ktTkkTtk....',
];
export const GOBLIN = [
  [...GOBLIN_TOP, '....kGGk.kGGk...', '....kkkk.kkkk...'],
  [...GOBLIN_TOP, '....kkkk.kGGk...', '.........kkkk...'],
];

// ---------- Skeleton ----------
// k outline, w bone, B bone shade
export const SKELETON = [
  '................',
  '.....kkkkkk.....',
  '....kwwwwwwk....',
  '...kwwwwwwwwk...',
  '...kwkkwwkkwk...',
  '...kwkkwwkkwk...',
  '...kwwwkkwwwk...',
  '....kwkwkwkwk...',
  '.....kkkkkk.....',
  '...kk.kwwk.kk...',
  '..kwBkwBBwkBwk..',
  '..kwk.kwwk.kwk..',
  '..kk..kBBk..kk..',
  '......kwwk......',
  '.....kwkkwk.....',
  '.....kk..kk.....',
];

// Bone projectile (spins between this and its rotation).
export const BONE = [
  '........',
  '.k....k.',
  'kwk..kwk',
  '.kwwwwk.',
  '.kwwwwk.',
  'kwk..kwk',
  '.k....k.',
  '........',
];

// ---------- Knight ----------
// k outline, a armor, A armor dark, l armor light, s shield, S shield dark, y emblem
export const KNIGHT = {
  down: [
    '.....kkkkkk.....',
    '....klaaaaak....',
    '...klaaaaaaAk...',
    '...kakkkkkkAk...',
    '...kaaaaaaaAk...',
    '....kAAAAAAk....',
    '..kkakkkkkkakk..',
    '.kakkssyysskkak.',
    '.kakksyyyyskkak.',
    '.kakkssyysskkak.',
    '.kAkkssyysskkAk.',
    '..kkkSssssSkkk..',
    '...kakSSSSkak...',
    '..ka..kSSk..ak..',
    '..kAAk....kAAk..',
    '..kkkk....kkkk..',
  ],
  up: [
    '.....kkkkkk.....',
    '....kaaaaaak....',
    '...kaaaaaaaAk...',
    '...kaaaaaaaAk...',
    '...kaaaaaaaAk...',
    '....kAAAAAAk....',
    '..kkkkkkkkkkkk..',
    '.kaakaaaaaakaak.',
    '.kaakaaaaaakaak.',
    '.kaakaaaaaakaak.',
    '.kAAkaaaaaakAAk.',
    '..kkkAAAAAAkkk..',
    '....kaakkaak....',
    '....kaak.kaak...',
    '...kAAk..kAAk...',
    '...kkkk..kkkk...',
  ],
  right: [
    '....kkkkkk......',
    '...kaaaaalk.....',
    '..kAaaaaaalk....',
    '..kAaaakkkkk....',
    '..kAaaaaaaak....',
    '...kAAAAAAk.....',
    '...kkaaaakkkk...',
    '..kaaaaaakssk...',
    '..kaaaaaaksyk...',
    '..kaaaaaaksyk...',
    '..kAaaaaakssk...',
    '..kkAAAAAkSSk...',
    '...kaakaakkk....',
    '...kaak.kak.....',
    '..kAAk..kAAk....',
    '..kkkk..kkkk....',
  ],
};

// ---------- More tile overlays ----------
// k outline, w wood, W wood shade
export const FENCE = [
  '................',
  '................',
  '................',
  '..kk........kk..',
  '.kwwk......kwwk.',
  'kkwwkkkkkkkkwwkk',
  'kwwwwwwwwwwwwwwk',
  'kWWWWWWWWWWWWWWk',
  'kkwwkkkkkkkkwwkk',
  '.kwwk......kwwk.',
  'kkwwkkkkkkkkwwkk',
  'kwwwwwwwwwwwwwwk',
  'kWWWWWWWWWWWWWWk',
  'kkwwkkkkkkkkwwkk',
  '.kWWk......kWWk.',
  '..kk........kk..',
];

// Same keys as TREE
export const BUSH = [
  '................',
  '................',
  '................',
  '................',
  '.....kkkkkk.....',
  '...kkLLlLLLkk...',
  '..kLLlllLLLLLk..',
  '.kLLllLLLLLlLLk.',
  '.kLLLLLLLLlllLk.',
  'kLLlLLLLLLLlLLDk',
  'kLLLLLLLLLLLLLDk',
  'kDLLLLLLLLLLLDDk',
  '.kDDLLLLLLLDDDk.',
  '..kkDDDDDDDDkk..',
  '....kkkkkkkk....',
  '................',
];

// k outline, s stone light, S stone, d stone dark
export const PILLAR = [
  '..kkkkkkkkkkkk..',
  '..kssssssssssk..',
  '..kSSSSSSSSSSk..',
  '...kkkkkkkkkk...',
  '...ksSSSSSSdk...',
  '...ksSSSSSSdk...',
  '...ksSSSSSSdk...',
  '...ksSSSSSSdk...',
  '...ksSSSSSSdk...',
  '...ksSSSSSSdk...',
  '...ksSSSSSSdk...',
  '...ksSSSSSSdk...',
  '...kkkkkkkkkk...',
  '..kssssssssssk..',
  '..kSSSSSSSSSSk..',
  '..kkkkkkkkkkkk..',
];

// k outline, I iron, i iron dark, r fire red, f fire, F fire light
const BRAZIER_BASE = [
  '..kkkkkkkkkkkk..',
  '..kIIIIIIIIIIk..',
  '...kiiiiiiiik...',
  '....kiiiiiik....',
  '......kIIk......',
  '......kiik......',
  '......kiik......',
  '.....kkIIkk.....',
  '....kiiiiiik....',
];
export const BRAZIER = [
  [
    '................',
    '......r..r......',
    '.....rfr.rr.....',
    '....rfFfrfr.....',
    '....rfFFffr.....',
    '...rfFFFFfrr....',
    '...rffFFFffr....',
    ...BRAZIER_BASE,
  ],
  [
    '................',
    '.......r..r.....',
    '......rr.rfr....',
    '.....rfrfFfr....',
    '.....rffFFfr....',
    '....rrfFFFFfr...',
    '....rffFFFffr...',
    ...BRAZIER_BASE,
  ],
];

// ---------- Items ----------
// k outline, c cork, g glass, r potion, w shine
export const POTION = [
  '..kkk..',
  '..kck..',
  '..kgk..',
  '.kgggk.',
  'kgrrrgk',
  'krrwrrk',
  'krrrrrk',
  '.krrrk.',
  '..kkk..',
];

// ---------- Spells (12x12) ----------
// Firebolt: k outline, r red, o orange, y yellow, w white-hot core
export const SPELL_FIREBOLT = [
  '.....kk.....',
  '....kook....',
  '....korok...',
  '...korrok.k.',
  '..korrrokok.',
  '..korryrrok.',
  '.korryyyrrok',
  '.koryyyyyrok',
  '.koryywwyrok',
  '..koyywwyok.',
  '...kooyyok..',
  '....kkkkk...',
];

// Heal: k outline, g green, G green shade, w shine
export const SPELL_HEAL = [
  '...kkkkkk...',
  '...kwgggk...',
  '...kggggk...',
  'kkkkggggkkkk',
  'kwggggggggGk',
  'kgggggggggGk',
  'kgggggggggGk',
  'kGGGggggGGGk',
  'kkkkggggkkkk',
  '...kggggk...',
  '...kGGGGk...',
  '...kkkkkk...',
];

// Frost Shard: k outline, b ice blue, w shine
export const SPELL_FROST = [
  '.....kk.....',
  '....kwbk....',
  '.k..kbbk..k.',
  'kbk.kbbk.kbk',
  '.kbkkbbkkbk.',
  '..kbbwwbbk..',
  '..kbbwwbbk..',
  '.kbkkbbkkbk.',
  'kbk.kbbk.kbk',
  '.k..kbbk..k.',
  '....kbbk....',
  '.....kk.....',
];

// Chain Lightning: k outline, y yellow
export const SPELL_LIGHTNING = [
  '......kkkk..',
  '.....kyyyk..',
  '....kyyyk...',
  '...kyyyk....',
  '..kyyyykkk..',
  '.kyyyyyyyk..',
  '..kkkyyyk...',
  '....kyyk....',
  '...kyyk.....',
  '..kyyk......',
  '..kyk.......',
  '..kk........',
];

// Ward: k outline, b blue, B blue shade, w shine, y gold
export const SPELL_WARD = [
  '.kkkkkkkkkk.',
  'kwwbbbbbbbBk',
  'kwbbbyybbbBk',
  'kbbbbyybbbBk',
  'kbbyyyyyybBk',
  'kbbyyyyyybBk',
  'kbbbbyybbbBk',
  '.kbbbyybbBk.',
  '.kbbbbbbbBk.',
  '..kbbbbbBk..',
  '...kbbbBk...',
  '....kkkk....',
];

// Spell tome: k outline, b cover, B cover shade, g gold, y gold shine, w pages
export const TOME = [
  '.kkkkkkkkkk.',
  'kbbbbbbbbbbk',
  'kbbbbggbbbbk',
  'kbbbgyygbbbk',
  'kbbgyyyygbbk',
  'kbbbgyygbbbk',
  'kbbbbggbbbbk',
  'kbbbbbbbbbbk',
  'kBBBBBBBBBBk',
  'kwwwwwwwwwwk',
  'kBBBBBBBBBBk',
  '.kkkkkkkkkk.',
];

// ---------- Desert ----------
// Cactus overlay: k outline, g green, G green dark, l green light
export const CACTUS = [
  '................',
  '.......kk.......',
  '......kglk......',
  '......kglk......',
  '..kk..kglk......',
  '.kglk.kglk..kk..',
  '.kglk.kglk.kglk.',
  '.kglkkkglk.kglk.',
  '..kgGGgglkkkglk.',
  '...kkkgglGGGgk..',
  '......kglkkkk...',
  '......kglk......',
  '......kglk......',
  '......kGGk......',
  '.....kkkkkk.....',
  '................',
];

// Mummy (2 walk frames): k outline, w bandage, W bandage shade, e eye glow
const MUMMY_TOP = [
  '................',
  '.....kkkkkk.....',
  '....kwwWwwwk....',
  '....kWwwwwWk....',
  '....kkekkekk....',
  '....kwwWwwwk....',
  '..kkkWwwwwWkkk..',
  '.kwwkwwWwwwkwwk.',
  '.kWwkwwwWwwkwWk.',
  '..kkkWwwwwWkkk..',
  '....kwwWwwwk....',
  '....kwWwwWwk....',
];
export const MUMMY = [
  [...MUMMY_TOP, '....kwwkkwwk....', '....kWwkkwWk....', '....kkk..kkk....', '................'],
  [...MUMMY_TOP, '....kwwkkwwk....', '.....kWkkwWk....', '.....kk..kkk....', '................'],
];

// Vulture (wings up, wings down): k outline, D wing, b body, B body dark, p head, e eye, w ruff, y feet
export const VULTURE = [
  [
    '................',
    '................',
    '.k............k.',
    'kDk..........kDk',
    'kDDk...kk...kDDk',
    'kDDDk.kppk.kDDDk',
    '.kDDDkpeepkDDDk.',
    '..kDDkwwwwkDDk..',
    '...kkDbbbbDkk...',
    '....kbbbbbbk....',
    '....kbBbbBbk....',
    '.....kbbbbk.....',
    '......kyyk......',
    '......k..k......',
    '................',
    '................',
  ],
  [
    '................',
    '................',
    '................',
    '................',
    '.......kk.......',
    '......kppk......',
    '.....kpeepk.....',
    '..kkkkwwwwkkkk..',
    '.kDDDDbbbbDDDDk.',
    'kDDDDbbbbbbDDDDk',
    'kDDkkbBbbBbkkDDk',
    '.kk..kbbbbk..kk.',
    '......kyyk......',
    '......k..k......',
    '................',
    '................',
  ],
];

// ---------- Spirits (fire and ice share the art; colors differ) ----------
// k outline, r outer flame, o flame, y core, e eye
const SPIRIT_BODY = [
  '..krrroooooork..',
  '..kroyyyyyyork..',
  '.kroyyeyyeyyork.',
  '.kroyyeyyeyyork.',
  '.kroyyyyyyyyork.',
  '..kroyyyyyyork..',
  '...krooooook....',
  '....kkrrrkk.....',
  '......kkk.......',
];
export const SPIRIT = [
  [
    '................',
    '.......kk.......',
    '......kyrk......',
    '.....kyork..k...',
    '..k..korrk.krk..',
    '.krk.krorrkkrk..',
    '.krrkkroorrrrk..',
    ...SPIRIT_BODY,
  ],
  [
    '................',
    '........kk......',
    '.......kyrk.....',
    '..k...kyork.....',
    '.krk..korrk..k..',
    '.krk.krorrk.krk.',
    '..krkkroorrkkrk.',
    ...SPIRIT_BODY,
  ],
];

// ---------- Frozen Peaks ----------
// Wolf, facing right (2 run frames): k outline, g fur, G fur dark, e eye, w teeth
const WOLF_TOP = [
  '................',
  '................',
  '...........k.k..',
  '..........kgkgk.',
  '..........kgggk.',
  '.k.......kggegkk',
  'kgk......kggggwk',
  'kgk.kkkkkkgggkk.',
  '.kgkggggggggggk.',
  '..kgggggggggggk.',
  '..kGgggggggggGk.',
  '..kGGgGGGGgGGk..',
];
export const WOLF = [
  [...WOLF_TOP, '...kGk.kk.kGk...', '...kGk....kGk...', '...kk.....kk....', '................'],
  [...WOLF_TOP, '..kGk....kGk....', '.kGk......kGk...', '.kk........kk...', '................'],
];

// The Frost Wyrm, seen from above with its head pointing down (32x32, left half mirrored;
// it's drawn rotated toward where it faces). k outline, b scales, B scales dark, l spine and
// belly, h horn, e eye
const FROST_WYRM_HALF = [
  '................',
  '...............k',
  '..............kb',
  '..............kb',
  '.............kbl',
  '.............kbl',
  '............kbbl',
  '............kbbl',
  '...........kbbbl',
  '..........kbbBbl',
  '.........kbbBBbl',
  '...kk...kbbBBbbl',
  '..kbbk.kbbBBbbbl',
  '..kbBbkbbBBbbbbl',
  '...kkbbbBBbbbbbl',
  '.....kbbBbbbbbbl',
  '.....kbbBbbbbbbl',
  '...kkbbbBBbbbbbl',
  '..kbBbkbbBBbbbbl',
  '..kbbk.kbbBBbbbl',
  '...kk...kbbBBbbl',
  '.........kbbbbbb',
  '......kk..kbbbbb',
  '......khk.kbbbbb',
  '.......khkbbbbbb',
  '........kbbbbbbb',
  '.......kbbekbbbb',
  '.......kbbkkbbbb',
  '........kbbbbbll',
  '.........kbbblll',
  '..........kbbbll',
  '...........kkkkk',
];
export const FROST_WYRM = FROST_WYRM_HALF.map((row) => row + [...row].reverse().join(''));

// ---------- Castle ----------
// Gargoyle (2 frames; also drawn in stone as the throne room's statues):
// k outline, g stone, G stone dark, D wing, e eye, w fang
const GARGOYLE_TOP = [
  '................',
  '....k......k....',
  '...kgk....kgk...',
  '.k.kgkkkkkkgk.k.',
  'kDkkggggggggkkDk',
  'kDDkgeggggegkDDk',
  'kDDDkggggggkDDDk',
  'kDDDkgwkkwgkDDDk',
  '.kDDkkggggkkDDk.',
  '..kDkggGGggkDk..',
  '...kkgGggGgkk...',
  '....kggggggk....',
];
export const GARGOYLE = [
  [...GARGOYLE_TOP, '....kgGkkGgk....', '...kggk..kggk...', '...kkk....kkk...', '................'],
  [...GARGOYLE_TOP, '....kgGkkGgk....', '....kggk.kggk...', '....kkk..kkk....', '................'],
];

// Cursed bandage projectile (spins between this and its rotation): k outline, w linen
export const BANDAGE = [
  '........',
  '.kk.....',
  'kwwkk...',
  '.kwwwkk.',
  '..kkwwwk',
  '....kkk.',
  '........',
  '........',
];

// ---------- The Sand Pharaoh (32x32, drawn as a left half and mirrored) ----------
// k outline, g gold, G gold dark, b blue stripe, s skin, e eye glow, w linen, W linen shade, r red sash
const PHARAOH_HALF = [
  '................',
  '..........kkkkkk',
  '........kkgggggg',
  '.......kgbgbgbgb',
  '......kgbgbgbgbg',
  '.....kgbgbgbgkkk',
  '.....kbgbgbgksss',
  '....kgbgbgbkssss',
  '....kbgbgbgksekk',
  '....kgbgbgbkssss',
  '....kbgbgbgkssss',
  '...kgbgbgbgkksss',
  '...kbgbgbgbkgkss',
  '...kgbgbgbkkgGkk',
  '...kbgbgbkkwkgGk',
  '...kkkkkkwwwkgGk',
  '....kkwwwwwwwwww',
  '...kgggggggggggg',
  '..kgGbGbGbGbGbGb',
  '..kggggggggggggg',
  '.kwwkkwwwwwwwwww',
  '.kwwwkgggggggggg',
  '.kwWwkgGGGGGGGGG',
  '.kwWwkkwwwwwwwww',
  '..kkkkwwwWwwwwww',
  '.....kwwwWwwwrrr',
  '.....kwwwWwwwwww',
  '.....kwwWwwwwwww',
  '.....kwwWwwwwwww',
  '....kwwwWwwwwwww',
  '....kWWWWWWWWWWW',
  '....kkkkkkkkkkkk',
];
export const PHARAOH = PHARAOH_HALF.map((row) => row + [...row].reverse().join(''));

// ---------- The Dark Lord (32x32, drawn as a left half and mirrored) ----------
// k outline, a armor dark, A armor, l armor light, g gold, c cape, C cape dark,
// h horn, H horn shade, e eye, E eye glow
const DARK_LORD_HALF = [
  '................',
  '.kk.............',
  '.khk............',
  '.khHk...........',
  '..khHk..........',
  '..khHHk..kkkkkkk',
  '...khHHkkaAAAAAA',
  '....khHkaAAAllll',
  '.....kkkaAAllAAA',
  '.......kaAAAAAAA',
  '.......kaAkkkkkk',
  '.......kaAkeEEkk',
  '.......kaAkkkkkk',
  '.......kaAAAAAAA',
  '........kaAAAAAg',
  '..kkkkk..kkggggg',
  '.kAlllAkkkAaaaaa',
  'kAllAAAAkaAAaaaa',
  'kAAAAAAkkaAlAAaa',
  'kaaaaaakcaAlAAaa',
  '.kkkkkkccaAAAAaa',
  '..kaAkcccaAAlAaa',
  '..kaAkcCCkgggggg',
  '..kaAkcCCkaAAAaa',
  '..kgggkCckaAAAaa',
  '..kgggkCckaAAAAa',
  '...kkkcCCkkaAAAk',
  '...kcCCCCkaaAAk.',
  '..kcCCCCCkaaAAk.',
  '..kcCCCCCkaaaak.',
  '.kcCCCCCCkkkkkk.',
  '.kkkkkkkk.......',
];
export const DARK_LORD = DARK_LORD_HALF.map((row) => row + [...row].reverse().join(''));

