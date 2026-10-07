// Map screen (M, or MAP in the pause menu): every room you've visited, laid out by how the
// rooms connect, with towns, the camp, bosses and the Castle gate marked. Also the fast-travel
// picker: choose a town you've visited and go there, if the room you're in has no enemies left.
import { SCREEN_W, SCREEN_H, EDGE_VEC } from '../constants.js';
import { drawText, drawTextCentered, textWidth } from '../gfx/font.js';
import { px } from '../gfx/sprites.js';
import { drawPanel, dimScreen, PANEL } from './panel.js';

const PANEL_RECT = { x: 6, y: 6, w: SCREEN_W - 12, h: SCREEN_H - 12 };
const MAP_RECT = { x: 14, y: 28, w: SCREEN_W - 28, h: 132 };

// Grid spot for every room reachable from `startId`, found by walking the room links (each link
// is one step in its direction). The world's `pos` grid can't be used: the route's segments sit
// in separate parts of it so new areas can slot in.
const layoutCache = new WeakMap();
export function mapLayout(world, startId) {
  if (layoutCache.has(world)) return layoutCache.get(world);
  const spots = new Map([[startId, { x: 0, y: 0 }]]);
  const taken = new Set(['0,0']);
  const queue = [startId];
  while (queue.length) {
    const id = queue.shift();
    const at = spots.get(id);
    for (const [dir, nextId] of Object.entries(world.get(id).neighbors)) {
      if (spots.has(nextId)) continue;
      const v = EDGE_VEC[dir];
      const spot = { x: at.x + v.x, y: at.y + v.y };
      const key = `${spot.x},${spot.y}`;
      if (taken.has(key)) {
        console.warn(`Map: ${nextId} overlaps another room at ${key}`);
        continue;
      }
      spots.set(nextId, spot);
      taken.add(key);
      queue.push(nextId);
    }
  }
  const xs = [...spots.values()].map((s) => s.x);
  const ys = [...spots.values()].map((s) => s.y);
  const layout = { spots, minX: Math.min(...xs), minY: Math.min(...ys), cols: Math.max(...xs) - Math.min(...xs) + 1, rows: Math.max(...ys) - Math.min(...ys) + 1 };
  layoutCache.set(world, layout);
  return layout;
}

export class MapScene {
  constructor(game, play) {
    this.game = game;
    this.play = play;
    this.t = 0;
    this.destinations = play.travelDestinations();
    this.choice = 0;
  }

  update(dt) {
    this.t += dt;
    const input = this.game.input;
    if (input.wasPressed('map') || input.wasPressed('pause')) {
      this.game.pop();
      return;
    }
    const n = this.destinations.length;
    if (n && (input.wasPressed('left') || input.wasPressed('up'))) this.choice = (this.choice + n - 1) % n;
    if (n && (input.wasPressed('right') || input.wasPressed('down'))) this.choice = (this.choice + 1) % n;
    const ok = input.wasPressed('dodge') || input.wasPressed('interact') || input.wasPressed('confirm');
    if (ok && n && this.play.canFastTravel().ok) {
      const dest = this.destinations[this.choice];
      while (this.game.top !== this.play) this.game.pop(); // close the map (and the pause menu)
      this.play.travelTo(dest.roomId);
    }
  }

  draw(ctx) {
    dimScreen(ctx, SCREEN_W, SCREEN_H, 0.6);
    const { x, y, w, h } = PANEL_RECT;
    drawPanel(ctx, x, y, w, h);
    drawText(ctx, 'MAP', x + 8, y + 7, '#ffe040');
    const here = this.play.room.area.name.toUpperCase();
    drawText(ctx, here, x + w - 8 - textWidth(here), y + 7, '#c8c8a0');
    this.drawMap(ctx);
    this.drawTravel(ctx);
  }

  drawMap(ctx) {
    const { world, player, room } = this.play;
    const layout = mapLayout(world, this.play.startRoomId);
    const cw = Math.min(16, Math.floor(MAP_RECT.w / layout.cols));
    const ch = Math.min(Math.round(cw * 0.75), Math.floor(MAP_RECT.h / layout.rows));
    const ox = MAP_RECT.x + Math.floor((MAP_RECT.w - cw * layout.cols) / 2);
    const oy = MAP_RECT.y + Math.floor((MAP_RECT.h - ch * layout.rows) / 2);
    const boxOf = (id) => {
      const s = layout.spots.get(id);
      return { x: ox + (s.x - layout.minX) * cw, y: oy + (s.y - layout.minY) * ch, w: cw - 2, h: ch - 2 };
    };
    const visited = player.visitedRooms;

    // Unvisited rooms next to visited ones: a faint outline, so unexplored exits show.
    for (const id of layout.spots.keys()) {
      if (visited.has(id)) continue;
      const near = Object.values(world.get(id).neighbors).some((n) => visited.has(n));
      if (!near) continue;
      const b = boxOf(id);
      ctx.strokeStyle = '#4a4a6a';
      ctx.lineWidth = 1;
      ctx.strokeRect(b.x + 0.5, b.y + 0.5, b.w - 1, b.h - 1);
    }

    for (const id of visited) {
      if (!layout.spots.has(id)) continue; // e.g. the debug test room
      const r = world.get(id);
      const b = boxOf(id);
      // Links to visited neighbors (east and south, so each is drawn once).
      for (const dir of ['e', 's']) {
        const n = r.neighbors[dir];
        if (!n || !visited.has(n)) continue;
        if (dir === 'e') px(ctx, '#8a8aa0', b.x + b.w, b.y + Math.floor(b.h / 2) - 1, 2, 2);
        else px(ctx, '#8a8aa0', b.x + Math.floor(b.w / 2) - 1, b.y + b.h, 2, 2);
      }
      px(ctx, r.area.mapColor ?? '#888888', b.x, b.y, b.w, b.h);
      this.drawMarker(ctx, r, b);
    }

    // You are here.
    if (layout.spots.has(room.id) && Math.floor(this.t * 3) % 2 === 0) {
      const b = boxOf(room.id);
      ctx.strokeStyle = '#ff4040';
      ctx.lineWidth = 1;
      ctx.strokeRect(b.x - 0.5, b.y - 0.5, b.w + 1, b.h + 1);
    }

    // Legend
    const ly = MAP_RECT.y + MAP_RECT.h + 3;
    const legend = [['#ffe040', 'TOWN'], ['#e05a1a', 'CAMP'], ['#e02a2a', 'BOSS'], ['#404050', 'GATE']];
    let lx = MAP_RECT.x;
    for (const [color, label] of legend) {
      px(ctx, '#000', lx, ly, 6, 6);
      px(ctx, color, lx + 1, ly + 1, 4, 4);
      drawText(ctx, label, lx + 9, ly, '#8a8aa0');
      lx += 9 + textWidth(label) + 10;
    }
  }

  // Small icons: a town, the camp, a boss (crossed out once beaten), the Castle gate.
  drawMarker(ctx, room, b) {
    const cx = b.x + Math.floor(b.w / 2);
    const cy = b.y + Math.floor(b.h / 2);
    const dot = (color) => {
      px(ctx, '#000', cx - 2, cy - 2, 5, 5);
      px(ctx, color, cx - 1, cy - 1, 3, 3);
    };
    if (room.area.village && room.area.hub === room.id) dot('#ffe040');
    else if (room.def.savePoint && room.area.name === 'Camp') dot('#e05a1a');
    else if (room.def.boss) {
      if (this.play.bossBeaten(room.def.boss)) {
        ctx.fillStyle = '#2a2a3a';
        for (let i = -2; i <= 2; i++) {
          ctx.fillRect(cx + i, cy + i, 1, 1);
          ctx.fillRect(cx + i, cy - i, 1, 1);
        }
      } else dot('#e02a2a');
    } else if (room.def.sealGate) dot('#404050');
  }

  drawTravel(ctx) {
    const { x, w } = PANEL_RECT;
    const y = SCREEN_H - 46;
    px(ctx, PANEL.shadow, x + 8, y - 4, w - 16, 1);
    const n = this.destinations.length;
    if (!n) {
      drawTextCentered(ctx, 'VISIT ANOTHER TOWN TO TRAVEL THERE', SCREEN_W / 2, y + 2, '#8a8aa0');
    } else {
      const name = this.destinations[this.choice].name.toUpperCase();
      const label = n > 1 ? `< ${name} >` : name;
      drawText(ctx, 'FAST TRAVEL:', x + 10, y + 2, '#a0e0ff');
      drawText(ctx, label, x + 10 + textWidth('FAST TRAVEL: '), y + 2, '#ffffff');
      const check = this.play.canFastTravel();
      if (!check.ok) drawTextCentered(ctx, check.reason, SCREEN_W / 2, y + 13, '#ff8080');
    }
    const hint = n ? 'ARROWS: TOWN  SPACE: GO  M: CLOSE' : 'M: CLOSE';
    drawTextCentered(ctx, hint, SCREEN_W / 2, y + 26, '#7a7a90');
  }
}
