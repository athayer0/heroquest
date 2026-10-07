// Hero and NPC pixel art (pure data, no DOM). All frames are 16x16.
//
// Hero frames are built from parts: head (rows 0-7) + torso (rows 8-12) + legs (rows 13-15).
// Each armor tier has its own heads and torsos; legs are shared and recolored per tier
// (p = trousers/greaves, f = shoes/boots/sabatons).

// ---------- Shared legs ----------
const LEGS_FRONT = {
  idle: ['....kppkkppk....', '...kfffkkfffk...', '...kkkk..kkkk...'],
  stepA: ['....kppkkppk....', '....kkkkkfffk...', '........kkkkk...'],
  stepB: ['....kppkkppk....', '...kfffkkkkk....', '...kkkkk........'],
};
const LEGS_SIDE = {
  idle: ['....kppkppk.....', '....kffkfffk....', '....kkkkkkkk....'],
  stride: ['...kppk.kppk....', '..kffk..kfffk...', '..kkkk..kkkkk...'],
};

// ---------- Heads ----------
const HAIR_DOWN = [
  '................',
  '.....kkkkkk.....',
  '....khhhhhhk....',
  '...khhHhhHhhk...',
  '...khsshhsshk...',
  '...kssssssssk...',
  '...kskssssksk...',
  '....kssSSssk....',
];
const HAIR_UP = [
  '................',
  '.....kkkkkk.....',
  '....khhhhhhk....',
  '...khhHhhHhhk...',
  '...khhhhhhhhk...',
  '...khHhhhhHhk...',
  '...khhhhhhhhk...',
  '....kSSSSSSk....',
];
const HAIR_SIDE = [
  '................',
  '....kkkkkk......',
  '...khhhhhhk.....',
  '..khhHhhhhhk....',
  '..khhhhhhssk....',
  '..khhhhsssssk...',
  '...khhssskssk...',
  '....khsssssk....',
];

const COIF_DOWN = [
  '................',
  '.....kkkkkk.....',
  '....kllMMMMk....',
  '...kMMMMMMMMk...',
  '...kmMmMmMmMk...',
  '...kmssssssmk...',
  '...kmskssksmk...',
  '....kmMssMmk....',
];
const COIF_UP = [
  '................',
  '.....kkkkkk.....',
  '....kllMMMMk....',
  '...kMMMMMMMMk...',
  '...kmMmMmMmMk...',
  '...kMmMmMmMmk...',
  '...kmMmMmMmMk...',
  '....kmMmMmMk....',
];
const COIF_SIDE = [
  '................',
  '....kkkkkk......',
  '...kllMMMMk.....',
  '..kMMMMMMMMk....',
  '..kmMmMmMssk....',
  '..kMmMmsssssk...',
  '...kMmssskssk...',
  '....kMmssssk....',
];

const HELM_DOWN = [
  '.......rr.......',
  '.....krrrrk.....',
  '....kllllMMk....',
  '...klllMMMMMk...',
  '...klMMMMMMdk...',
  '...kdkkkkkkdk...',
  '...kMMMkkMMMk...',
  '....kdMMMMdk....',
];
const HELM_UP = [
  '.......rr.......',
  '.....krrrrk.....',
  '....kllrrMMk....',
  '...klllrrMMMk...',
  '...klMMrrMMdk...',
  '...kMMMMMMMdk...',
  '...kMMMMMMMdk...',
  '....kdMMMMdk....',
];
const HELM_SIDE = [
  '..rr............',
  '..krrkkkkk......',
  '...kllllMMk.....',
  '..klllMMMMMk....',
  '..klMMMMMMMk....',
  '..kMMMMkkkkkk...',
  '..kdMMMMMkMk....',
  '...kdMMMMdk.....',
];

// ---------- Torsos (rows 8-12) ----------
const TORSO = {
  cloth: {
    down: ['....ktTssTtk....', '...kkttttttkk...', '..kTkttttttkTk..', '..kskbbbbbbksk..', '...kkttTTttkk...'],
    up: ['....kttttttk....', '...kkttttttkk...', '..kTkttttttkTk..', '..kskbbbbbbksk..', '...kkttTTttkk...'],
    right: ['.....kttttk.....', '....kttttttk....', '....ktTTtttk....', '....kbsbbbbk....', '....kttTtttk....'],
  },
  leather: {
    down: ['....kLLssLLk....', '..kkDLLLLLLDkk..', '..kDkLyLLLLkDk..', '..kskbbybbbksk..', '...kkLLDDLLkk...'],
    up: ['....kLLLLLLk....', '..kkDLLLLLLDkk..', '..kDkLLLLLLkDk..', '..kskbbbbbbksk..', '...kkLLDDLLkk...'],
    right: ['.....kLLLLk.....', '....kDLLLLLk....', '....kDDLLLLk....', '....kbsbbybk....', '....kLLDLLLk....'],
  },
  chainmail: {
    down: ['....kmMmMmMk....', '..kkmMmMmMmMkk..', '..kMkmMmMmMkMk..', '..kskbbybbbksk..', '...kkMmMmMmkk...'],
    up: ['....kmMmMmMk....', '..kkmMmMmMmMkk..', '..kMkmMmMmMkMk..', '..kskbbbbbbksk..', '...kkMmMmMmkk...'],
    right: ['.....kmMmMk.....', '....kmMmMmMk....', '....kmMMmMmk....', '....kbsbbybk....', '....kMmMmMmk....'],
  },
  plate: {
    down: ['...kkllMMllkk...', '.klMkcccccckMlk.', '..kMkccyycckMk..', '..kdkbbybbbkdk..', '...kkMccccMkk...'],
    up: ['...kkllMMllkk...', '.klMkcccccckMlk.', '..kMkcccccckMk..', '..kdkcccccckdk..', '...kkcccccckk...'],
    right: ['.....kllMk......', '...kllMcccck....', '...kMMkccyck....', '....kdbbbbbk....', '....kMccccMk....'],
  },
};

const HEADS = {
  cloth: { down: HAIR_DOWN, up: HAIR_UP, right: HAIR_SIDE },
  leather: { down: HAIR_DOWN, up: HAIR_UP, right: HAIR_SIDE },
  chainmail: { down: COIF_DOWN, up: COIF_UP, right: COIF_SIDE },
  plate: { down: HELM_DOWN, up: HELM_UP, right: HELM_SIDE },
};

// Each facing: [idle, walkA, walkB]. Left is the right art mirrored.
function heroFrames(tier) {
  const h = HEADS[tier];
  const t = TORSO[tier];
  return {
    down: [LEGS_FRONT.idle, LEGS_FRONT.stepA, LEGS_FRONT.stepB].map((l) => [...h.down, ...t.down, ...l]),
    up: [LEGS_FRONT.idle, LEGS_FRONT.stepB, LEGS_FRONT.stepA].map((l) => [...h.up, ...t.up, ...l]),
    right: [LEGS_SIDE.idle, LEGS_SIDE.stride, LEGS_SIDE.idle].map((l) => [...h.right, ...t.right, ...l]),
  };
}

export const HERO_ART = {
  cloth: heroFrames('cloth'),
  leather: heroFrames('leather'),
  chainmail: heroFrames('chainmail'),
  plate: heroFrames('plate'),
};

const SKIN = { s: '#f2c08a', S: '#d89a68' };
const HAIR = { h: '#8a4b1e', H: '#5e3012' };
const K = { k: '#1b1b23' };

export const HERO_COLORS = {
  // Peasant: linen tunic, rope belt, brown trousers, worn shoes
  cloth: { ...K, ...SKIN, ...HAIR, t: '#c8a46a', T: '#9a7a48', b: '#7a5a30', p: '#6a4a2a', f: '#4a3020' },
  // Leather jerkin with shoulder pads and bracers, buckled belt, boots
  leather: { ...K, ...SKIN, ...HAIR, L: '#a8642c', D: '#6a3a18', b: '#3a2010', y: '#e0b040', p: '#4a3a2a', f: '#2e1c10' },
  // Chain shirt, mail coif and steel cap
  chainmail: { ...K, ...SKIN, m: '#b8bcc8', M: '#7a7e8c', l: '#e8ecf4', b: '#5a3a1a', y: '#e0b040', p: '#3a3a4a', f: '#2a2018' },
  // Polished plate, great helm with plume, blue tabard and cape
  plate: {
    ...K, l: '#f0f4ff', M: '#a8b0c8', d: '#5a6078', c: '#3a5ab8', y: '#f2c43a', r: '#d83a3a',
    b: '#3a2a1a', p: '#a8b0c8', f: '#5a6078',
  },
};

// ---------- NPCs (front-facing) ----------
// Common keys: k outline, s skin, S skin shade, h hair, H hair shade / beard, c clothes,
// C clothes shade, a accent (sash/belt/trim), A accent shade, w white, p trousers, f feet, r lips.

function withPixels(rows, pixels) {
  const out = rows.map((r) => [...r]);
  for (const [x, y, ch] of pixels) out[y][x] = ch;
  return out.map((r) => r.join(''));
}

const FACE_LONG_HAIR = [
  '................',
  '.....kkkkkk.....',
  '....khhhhhhk....',
  '...khhhhhhhhk...',
  '...khsssssshk...',
  '..khsksssskshk..',
  '..khsssssssshk..',
  '..khhsSrrSshhk..',
];
const DRESS_BODY = [
  '..khhksssskhhk..',
  '..kckcCccCckck..',
  '..kckcccccckck..',
  '..kskaaaaaaksk..',
  '..kcccccccccck..',
  '.kcccccccccccck.',
  '.kCCCCCCCCCCCCk.',
  '...kfk....kfk...',
];
export const WOMAN = [...FACE_LONG_HAIR, ...DRESS_BODY];

export const PRINCESS = [
  '....k..kk..k....',
  '....kykyykyk....',
  '....kyyyyyyk....',
  '...khhhhhhhhk...',
  '...khsssssshk...',
  '..khsksssskshk..',
  '..khsssssssshk..',
  '..khhsSrrSshhk..',
  ...DRESS_BODY,
];

const MAN_HEAD = [
  '................',
  '.....kkkkkk.....',
  '....khhhhhhk....',
  '...khhhhhhhhk...',
  '...khsssssshk...',
  '...kskssssksk...',
  '...kssssssssk...',
];
export const SHOPKEEPER = [
  ...MAN_HEAD,
  '....ksHHHHsk....',
  '....kcccccck....',
  '..kkcccccccckk..',
  '..kckcwwwwckck..',
  '..kskawwwwaksk..',
  '...kkcwwwwckk...',
  ...LEGS_FRONT.idle,
];

export const KID = [
  '................',
  '................',
  '................',
  '................',
  '.....kkkkkk.....',
  '....khhhhhhk....',
  '...khhhhhhhhk...',
  '...khsssssshk...',
  '...kskssssksk...',
  '....kssrrssk....',
  '....kkcccckk....',
  '...kckcccckck...',
  '...kskaaaaksk...',
  '.....kpkkpk.....',
  '....kffkkffk....',
  '....kkkkkkkk....',
];

export const FARMER = [
  '................',
  '......kkkk......',
  '.....kaaaak.....',
  '..kkkaAAAAakkk..',
  '.kaaaaaaaaaaaak.',
  '..kksssssssskk..',
  '...kskssssksk...',
  '...ksHHHHHHsk...',
  '....ksHHHHsk....',
  '..kkcpkkkkpckk..',
  '..kckppppppkck..',
  '..kskppaappksk..',
  '...kkppppppkk...',
  ...LEGS_FRONT.idle,
];

export const GUARD = [
  '................',
  '.....kkkkkk.....',
  '....kllMMMMk....',
  '..kMMMMMMMMMMk..',
  '...kssssssssk...',
  '...kskssssksk...',
  '...kssssssssk...',
  '....kssSSssk....',
  '....kMMMMMMk....',
  '..kkccaaaacckk..',
  '..kMkcaaaackMk..',
  '..kskbbbbbbksk..',
  '...kkcccccckk...',
  ...LEGS_FRONT.idle,
];

// Bald, white side hair, long beard, robe, and a staff in his right hand.
export const ELDER = withPixels([
  '................',
  '.....kkkkkk.....',
  '....kssssssk....',
  '...kwsssssswk...',
  '...kwsssssswk...',
  '...kwksssskwk...',
  '...kwwsssswwk...',
  '...kwwwwwwwwk...',
  '..kckwwwwwwkck..',
  '..kckcwwwwckck..',
  '..kskccwwccksk..',
  '...kccaaaacck...',
  '...kcccccccck...',
  '..kcccccccccck..',
  '..kCCCCCCCCCCk..',
  '...kkkkkkkkkk...',
], [
  [14, 1, 'k'], [13, 2, 'k'], [14, 2, 'G'], [15, 2, 'k'],
  ...[3, 4, 5, 6, 7, 8, 9, 11, 12, 13, 14, 15].map((y) => [14, y, 'g']),
  ...[3, 4, 5, 6, 7, 8, 9, 11, 12, 13, 14, 15].map((y) => [15, y, 'k']),
]);

// Hooded traveller with a big pack on his back.
export const MERCHANT = [
  '................',
  '.....kkkkkk.....',
  '....kcccccck....',
  '...kccCCCCcck...',
  '...kcSssssSck...',
  '...kcskssksck...',
  '...kcssssssck...',
  '...kcsHHHHsck...',
  '.kakcccccccckak.',
  'kaakcccccccckaak',
  'kaAksccccccskAak',
  'kAAkcccbbccckAAk',
  '.kkkcccccccckkk.',
  '...kcccccccck...',
  '...kCCCCCCCCk...',
  '....kfk..kfk....',
];
