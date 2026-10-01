import {Container} from 'pixi.js';
import {Autopilot, Demo, MountGame} from '../shared/Demo';
import {CELL, COLUMNS, ROWS, TICK} from './config';
import {SnakeGame} from './game';
import {SnakeAutopilot} from './input/autopilot';
import {bindKeyboard, KEY_CODES} from './input/keyboardControls';

/**
 * Snake in a page. The game logic works in ticks, so the time of frames is accumulated, and the game is advanced by
 * whole ticks.
 */
class SnakeDemo extends Demo<SnakeGame> {
  private accumulated = 0;

  public constructor() {
    super({width: COLUMNS * CELL, height: ROWS * CELL, background: 0x0d1117, keys: KEY_CODES});
  }

  protected get status(): string {
    return `Score: ${this.game.score}`;
  }

  protected setup(): void {
    // Keys turn the snake when they are pressed, so they are bound once, not read every frame
    bindKeyboard(this.keyboard, () => this.game.controls);
  }

  protected createGame(layer: Container): SnakeGame {
    return new SnakeGame({width: COLUMNS, height: ROWS, layer});
  }

  protected createAutopilot(game: SnakeGame): Autopilot {
    return new SnakeAutopilot(game);
  }

  protected advance(dt: number): void {
    for (this.accumulated += dt; this.accumulated >= TICK; this.accumulated -= TICK) {
      this.control();
      this.game.tick();
    }
  }
}

export const mountSnake: MountGame = async (element) => {
  const demo = new SnakeDemo();
  await demo.mount(element);
  return () => demo.destroy();
};
