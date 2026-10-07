// Turns pixel-array art into offscreen canvases.
// Art is an array of equal-length strings; each char maps to a color via `colors`.
// '.' (or any unmapped char) is transparent.

export function makeCanvas(w, h, paint) {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  const g = c.getContext('2d');
  paint(g);
  return c;
}

export function makeSprite(rows, colors, flipX = false) {
  const h = rows.length;
  const w = rows[0].length;
  for (let i = 0; i < h; i++) {
    if (rows[i].length !== w) console.warn(`Sprite row ${i} has width ${rows[i].length}, expected ${w}:`, rows[i]);
  }
  return makeCanvas(w, h, (g) => {
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const color = colors[rows[y][x]];
        if (!color) continue;
        g.fillStyle = color;
        g.fillRect(flipX ? w - 1 - x : x, y, 1, 1);
      }
    }
  });
}

// Small helper for procedural painting.
export function px(g, color, x, y, w = 1, h = 1) {
  g.fillStyle = color;
  g.fillRect(x, y, w, h);
}

// ---------- Pure art transforms (operate on string-array art) ----------
export function rotateCW(rows) {
  const h = rows.length;
  const w = rows[0].length;
  const out = [];
  for (let y = 0; y < w; y++) {
    let line = '';
    for (let x = 0; x < h; x++) line += rows[h - 1 - x][y];
    out.push(line);
  }
  return out;
}

export function rotateCCW(rows) {
  const h = rows.length;
  const w = rows[0].length;
  const out = [];
  for (let y = 0; y < w; y++) {
    let line = '';
    for (let x = 0; x < h; x++) line += rows[x][w - 1 - y];
    out.push(line);
  }
  return out;
}

export function flipV(rows) {
  return [...rows].reverse();
}

// Same keys as `colors`, every color replaced (used for hit-flash silhouettes).
export function solidColors(colors, color = '#ffffff') {
  return Object.fromEntries(Object.keys(colors).map((k) => [k, color]));
}
