// Keyboard and mouse input: held state, per-update "pressed" edges, and direction order
// (so facing follows the most recently pressed direction).

const KEYMAP = {
  ArrowUp: 'up', KeyW: 'up',
  ArrowDown: 'down', KeyS: 'down',
  ArrowLeft: 'left', KeyA: 'left',
  ArrowRight: 'right', KeyD: 'right',
  Space: 'dodge', // also confirms in menus
  KeyE: 'interact',
  KeyQ: 'potion',
  KeyR: 'manaPotion',
  KeyM: 'map',
  Digit1: 'spell1', Digit2: 'spell2', Digit3: 'spell3', Digit4: 'spell4', Digit5: 'spell5',
  Escape: 'pause',
  Enter: 'confirm',
  // Debug keys, only acted on with ?debug in the URL (see PlayScene.debugKeys).
  KeyB: 'debugBurn', KeyC: 'debugChill', KeyT: 'debugTestRoom', KeyK: 'debugThrone', KeyP: 'debugSkills', KeyG: 'debugGold',
};

// How many spells a number key can reach (the Digit* bindings above). Spells past this are
// only selectable with the mouse wheel.
export const SPELL_KEYS = Object.values(KEYMAP).filter((action) => /^spell\d+$/.test(action)).length;

const DIRECTIONS = ['up', 'down', 'left', 'right'];

export class Input {
  // canvas (optional): enables mouse input in game-pixel coordinates (for clickable buttons).
  constructor(target = window, canvas = null) {
    this.codes = new Set();
    this.pressed = new Set();
    this.dirStack = [];
    this.pointer = null; // { x, y } in game pixels, once the mouse has moved over the canvas
    this.clicked = false; // a click happened since the last update
    this.rightClicked = false; // a right-click happened since the last update
    this.mouseHeld = false; // the left button is down
    this.wheel = 0; // mouse-wheel notches since the last update (+ is down)
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
        if (e.button !== 0 && e.button !== 2) return;
        this.pointer = toGame(e);
        if (e.button === 0) {
          this.clicked = true;
          this.mouseHeld = true;
        } else this.rightClicked = true;
      });
      // On the window, so releasing outside the canvas still counts.
      target.addEventListener('mouseup', (e) => {
        if (e.button === 0) this.mouseHeld = false;
      });
      // Right-click casts spells, so keep the browser's menu off the canvas.
      canvas.addEventListener('contextmenu', (e) => e.preventDefault());
      canvas.addEventListener('wheel', (e) => {
        e.preventDefault();
        if (e.deltaY) this.wheel += Math.sign(e.deltaY);
      }, { passive: false });
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
      this.mouseHeld = false;
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
    this.rightClicked = false;
    this.wheel = 0;
    this.pointerMoved = false;
  }
}
