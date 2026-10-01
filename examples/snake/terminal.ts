/**
 * Snake in the terminal.
 *
 * Usage:
 *   pnpm snake          - play with arrows or WASD, Q to quit
 *   pnpm snake --demo   - watch the autopilot play
 */
import * as readline from 'node:readline';
import {Direction} from './Controls';
import {Container} from 'pixi.js';
import {SnakeGame} from './game';
import {SnakeAutopilot} from './input/autopilot';
import {renderSnakeGame} from './render/text';

const KEYS: Record<string, Direction> = {
  up: 'up', down: 'down', left: 'left', right: 'right',
  w: 'up', s: 'down', a: 'left', d: 'right',
};

// Views are created, but never displayed: the terminal shows the grid as text
const game = new SnakeGame({width: 30, height: 15, layer: new Container()});
const demo = process.argv.includes('--demo') || !process.stdin.isTTY;
const autopilot = demo ? new SnakeAutopilot(game) : undefined;

function draw(): void {
  const status = game.isOver ? `Game over! Score: ${game.score}. Press Q to quit.` : `Score: ${game.score}`;
  // Move the cursor to the top left corner and clear the screen
  process.stdout.write(`\x1b[H\x1b[2J${renderSnakeGame(game)}\n${status}\n`);
}

function stop(): void {
  clearInterval(timer);
  if (process.stdin.isTTY) process.stdin.setRawMode(false);
  process.stdin.pause();
}

if (process.stdin.isTTY) {
  readline.emitKeypressEvents(process.stdin);
  process.stdin.setRawMode(true);
  process.stdin.on('keypress', (_, key: readline.Key) => {
    if (key.name === 'q' || (key.ctrl && key.name === 'c')) {
      stop();
      return;
    }
    const direction = key.name !== undefined ? KEYS[key.name] : undefined;
    if (direction !== undefined && autopilot === undefined) game.controls.turn(direction);
  });
}

const timer = setInterval(() => {
  autopilot?.update();
  game.tick();
  draw();
  // Without a terminal there is nobody to press Q, so the demo stops when the game is over
  if (game.isOver && !process.stdin.isTTY) stop();
}, 100);

draw();
