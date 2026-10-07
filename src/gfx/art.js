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

