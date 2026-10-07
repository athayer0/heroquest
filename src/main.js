// Entry point: canvas setup, scene stack and the fixed-timestep game loop.
import { SCREEN_W, SCREEN_H, STEP } from './constants.js';
import { Input } from './input.js';
import { PlayScene } from './scenes/play.js';
import { TitleScene, CompleteScene } from './ui/screens.js';

const canvas = document.getElementById('game');
canvas.width = SCREEN_W;
canvas.height = SCREEN_H;
const ctx = canvas.getContext('2d');
ctx.imageSmoothingEnabled = false;

// Scale the canvas by the largest integer factor that fits the window.
function fitToWindow() {
  const fit = Math.min(innerWidth / SCREEN_W, innerHeight / SCREEN_H);
  const scale = fit >= 1 ? Math.floor(fit) : fit;
  canvas.style.width = `${SCREEN_W * scale}px`;
  canvas.style.height = `${SCREEN_H * scale}px`;
}
addEventListener('resize', fitToWindow);
fitToWindow();

// Scenes are a stack: the top scene receives updates, all scenes draw
// bottom-to-top so overlays (pause, dialogue, menus) render over gameplay.
const game = {
  input: new Input(window, canvas),
  scenes: [],
  time: 0,
  play: null, // the current PlayScene, if a game is running
  get top() {
    return this.scenes[this.scenes.length - 1];
  },
  push(scene) {
    this.scenes.push(scene);
    scene.enter?.();
  },
  pop() {
    const scene = this.scenes.pop();
    scene?.exit?.();
    return scene;
  },
  replace(scene) {
    while (this.scenes.length) this.pop();
    this.push(scene);
  },
  startNewGame(slot) {
    this.play = new PlayScene(this, slot);
    this.replace(this.play);
  },
  continueGame(slot, save) {
    this.play = new PlayScene(this, slot, save);
    this.replace(this.play);
  },
  returnToTitle() {
    this.play = null;
    this.replace(new TitleScene(this));
  },
  finishGame(stats) {
    this.play = null;
    this.replace(new CompleteScene(this, stats));
  },
};

game.returnToTitle();

let last = performance.now();
let acc = 0;
function frame(now) {
  acc += Math.min((now - last) / 1000, 0.25);
  last = now;
  while (acc >= STEP) {
    game.time += STEP;
    // Play time only counts during gameplay and its menus, not while paused or on the death screen.
    if (game.play && game.top?.countsPlayTime) game.play.player.stats.playTime += STEP;
    game.top?.update(STEP);
    game.input.endFrame();
    acc -= STEP;
  }
  ctx.fillStyle = '#000';
  ctx.fillRect(0, 0, SCREEN_W, SCREEN_H);
  for (const scene of game.scenes) scene.draw(ctx);
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
