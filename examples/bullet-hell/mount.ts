import {Container} from 'pixi.js';
import {Autopilot, Demo, MountGame} from '../shared/Demo';
import {HEIGHT, WIDTH} from './config';
import {BulletHellGame} from './game';
import {BulletHellAutopilot} from './input/autopilot';
import {KEY_CODES, readKeyboard} from './input/keyboardControls';

/**
 * The bullet hell in a page
 */
class BulletHellDemo extends Demo<BulletHellGame> {
  public constructor() {
    super({width: WIDTH, height: HEIGHT, background: 0x0a0c14, keys: KEY_CODES});
  }

  protected get status(): string {
    const {score, wave, lives, bullets} = this.game;
    return `Score: ${score}   Wave: ${wave}   Lives: ${lives}   Bullets: ${bullets}`;
  }

  protected createGame(layer: Container): BulletHellGame {
    return new BulletHellGame({layer});
  }

  protected createAutopilot(game: BulletHellGame): Autopilot {
    return new BulletHellAutopilot(game);
  }

  protected readInput(): void {
    readKeyboard(this.keyboard, this.game.controls);
  }

  protected advance(dt: number): void {
    this.control();
    this.game.update(dt);
  }
}

export const mountBulletHell: MountGame = async (element) => {
  const demo = new BulletHellDemo();
  await demo.mount(element);
  return () => demo.destroy();
};
