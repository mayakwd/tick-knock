import {Application, Container, Ticker} from 'pixi.js';
import {Keyboard} from './Keyboard';
import {createApplication, frameTime} from './mount';
import {Hud} from './render/Hud';

export interface DemoGame {
  readonly isOver: boolean;
}

/**
 * The running demo, passed to extensions of games
 */
export interface Demo<G extends DemoGame> {
  readonly app: Application;
  readonly keyboard: Keyboard;
  /**
   * The current game, it's replaced when the game restarts
   */
  readonly game: G;
  /**
   * Returns a value indicating whether the player controls the game: it's focused
   */
  readonly isPlaying: boolean;
}

/**
 * What a game adds to the demo besides the world: a background, pointer input and so on
 */
export interface DemoExtension {
  /**
   * Called every frame after the game has been advanced
   */
  update?(): void;
  destroy?(): void;
}

export interface DemoOptions<G extends DemoGame> {
  width: number;
  height: number;
  background: number;
  /**
   * Codes of keys the game uses, their default action is prevented. R restarts the game.
   */
  keys: ReadonlyArray<string>;
  /**
   * Hint shown at the bottom while the player plays
   */
  hint?: string;
  /**
   * Time in seconds after which the demo restarts when the autopilot has lost
   */
  restartDelay?: number;
  /**
   * Creates the game, which views are added to the layer
   */
  create(layer: Container): G;
  createAutopilot(game: G): () => void;
  /**
   * Advances the game by the time of the frame
   * @param input Reads input of the player while the player plays, or runs the autopilot
   */
  advance(game: G, dt: number, input: () => void): void;
  /**
   * Reads input of the player
   */
  readInput?(keyboard: Keyboard, game: G): void;
  /**
   * Text of the status line
   */
  status(game: G): string;
  /**
   * Adds what the game needs besides the world
   * @param below Layer under the world, for example for a map
   * @param above Layer over the world and under the status, for example for a pointer preview
   */
  extend?(demo: Demo<G>, below: Container, above: Container): DemoExtension | void;
}

/**
 * Starts the game in the element. The autopilot plays until the game gets focus, then the player takes control.
 * When the autopilot loses, the game restarts, when the player loses, R restarts it.
 * @returns A function that stops the game and releases all resources
 */
export async function mountDemo<G extends DemoGame>(element: HTMLElement, options: DemoOptions<G>): Promise<() => void> {
  const {width, height, background, keys, hint = '', restartDelay = 2} = options;
  const app = await createApplication(element, {width, height, background});
  const keyboard = new Keyboard(app.canvas, [...keys, 'KeyR']);
  const below = new Container();
  const world = new Container();
  const above = new Container();
  const hud = new Hud(width, height);
  app.stage.addChild(below, world, above, hud);

  let game!: G;
  let autopilot!: () => void;
  let overTime = 0;
  const start = () => {
    for (const child of world.removeChildren()) child.destroy({children: true});
    game = options.create(world);
    autopilot = options.createAutopilot(game);
    overTime = 0;
  };
  start();
  keyboard.onPress('KeyR', () => {
    if (game.isOver) start();
  });
  // A click on the canvas focuses it, so the player takes control from the autopilot
  const takeControl = () => app.canvas.focus();
  app.canvas.addEventListener('pointerdown', takeControl);

  const demo: Demo<G> = {
    app,
    keyboard,
    get game() {
      return game;
    },
    get isPlaying() {
      return document.activeElement === app.canvas;
    },
  };
  const extension = options.extend?.(demo, below, above) ?? {};

  const update = (ticker: Ticker) => {
    const dt = frameTime(ticker.deltaMS);
    const playing = demo.isPlaying;
    options.advance(game, dt, playing ? () => options.readInput?.(keyboard, game) : autopilot);
    extension.update?.();

    hud.setStatus(options.status(game));
    hud.setHint(playing ? hint : 'Autopilot is playing, click to take control');
    if (game.isOver) {
      overTime += dt;
      if (!playing && overTime > restartDelay) start();
      hud.setMessage(playing ? 'Game over\nPress R to restart' : 'Game over');
    } else {
      hud.setMessage('');
    }
  };
  app.ticker.add(update);

  return () => {
    extension.destroy?.();
    keyboard.destroy();
    app.canvas.removeEventListener('pointerdown', takeControl);
    app.destroy({removeView: true}, {children: true});
  };
}
