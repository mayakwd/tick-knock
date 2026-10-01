import {Container} from 'pixi.js';
import {Autopilot, Demo, MountGame} from '../shared/Demo';
import {HEIGHT, WIDTH} from './config';
import {AsteroidsGame} from './game';
import {AsteroidsAutopilot} from './input/autopilot';
import {KEY_CODES, readKeyboard} from './input/keyboardControls';

/**
 * Asteroids in a page
 */
class AsteroidsDemo extends Demo<AsteroidsGame> {
  public constructor() {
    super({width: WIDTH, height: HEIGHT, background: 0x05060a, keys: KEY_CODES});
  }

  protected get status(): string {
    return `Score: ${this.game.score}   Wave: ${this.game.wave}`;
  }

  protected createGame(layer: Container): AsteroidsGame {
    return new AsteroidsGame({width: WIDTH, height: HEIGHT, layer});
  }

  protected createAutopilot(game: AsteroidsGame): Autopilot {
    return new AsteroidsAutopilot(game);
  }

  protected readInput(): void {
    readKeyboard(this.keyboard, this.game.controls);
  }

  protected advance(dt: number): void {
    this.control();
    this.game.update(dt);
  }
}

export const mountAsteroids: MountGame = async (element) => {
  const demo = new AsteroidsDemo();
  await demo.mount(element);
  return () => demo.destroy();
};
