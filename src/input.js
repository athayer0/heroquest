// Keyboard input: held state, per-update "pressed" edges, and direction order
// (so facing follows the most recently pressed direction).

const KEYMAP = {
  ArrowUp: 'up', KeyW: 'up',
  ArrowDown: 'down', KeyS: 'down',
  ArrowLeft: 'left', KeyA: 'left',
  ArrowRight: 'right', KeyD: 'right',
  Space: 'attack',
  KeyE: 'interact',
  KeyQ: 'potion',
  Escape: 'pause',
  Enter: 'confirm',
};

const DIRECTIONS = ['up', 'down', 'left', 'right'];

export class Input {
  // canvas (optional): enables mouse input in game-pixel coordinates (for clickable buttons).
  constructor(target = window, canvas = null) {
    this.codes = new Set();
    this.pressed = new Set();
    this.dirStack = [];
    this.pointer = null; // { x, y } in game pixels, once the mouse has moved over the canvas
    this.clicked = false; // a click happened since the last update
    this.pointerMoved = false;

    if (canvas) {
      const toGame = (e) => {
        const rect = canvas.getBoundingClientRect();
        return {
          x: ((e.clientX - rect.left) * canvas.width) / rect.width,
          y: ((e.clientY - rect.top) * canvas.height) / rect.height,
        };
      };
      canvas.addEventListener('mousemove', (e) => {
        this.pointer = toGame(e);
        this.pointerMoved = true;
      });
      canvas.addEventListener('mousedown', (e) => {
        this.pointer = toGame(e);
        this.clicked = true;
      });
    }

    target.addEventListener('keydown', (e) => {
      const action = KEYMAP[e.code];
      if (!action) return;
      e.preventDefault();
      this.codes.add(e.code);
      if (e.repeat) return;
      this.pressed.add(action);
      if (DIRECTIONS.includes(action)) {
        this.dirStack = this.dirStack.filter((d) => d !== action);
        this.dirStack.push(action);
      }
    });

    target.addEventListener('keyup', (e) => {
      const action = KEYMAP[e.code];
      if (!action) return;
      this.codes.delete(e.code);
      if (!this.isDown(action)) this.dirStack = this.dirStack.filter((d) => d !== action);
    });

    target.addEventListener('blur', () => {
      this.codes.clear();
      this.dirStack = [];
    });
  }

  isDown(action) {
    for (const code of this.codes) if (KEYMAP[code] === action) return true;
    return false;
  }

  wasPressed(action) {
    return this.pressed.has(action);
  }

  get lastDir() {
    return this.dirStack[this.dirStack.length - 1] ?? null;
  }

  // True if the pointer is inside the rect { x, y, w, h } (game pixels).
  pointerIn(r) {
    const p = this.pointer;
    return !!p && p.x >= r.x && p.x < r.x + r.w && p.y >= r.y && p.y < r.y + r.h;
  }

  clickedIn(r) {
    return this.clicked && this.pointerIn(r);
  }

  // Called after each fixed update step.
  endFrame() {
    this.pressed.clear();
    this.clicked = false;
    this.pointerMoved = false;
  }
}
