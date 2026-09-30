import {Application, Container, Ticker} from 'pixi.js';
import {Keyboard} from './Keyboard';
import {Hud} from './render/Hud';

/**
 * Starts a game inside the element and returns a function that stops it and releases all resources.
 * Every example exports such a function, so it can be started on its own page and embedded into the documentation.
 */
export type MountGame = (element: HTMLElement) => Promise<() => void>;

/**
 * Plays the game instead of the player
 */
export interface Autopilot {
  /**
   * Sets controls of the game for the next update
   */
  update(): void;
}

export interface DemoGame {
  readonly isOver: boolean;
}

export interface DemoSettings {
  readonly width: number;
  readonly height: number;
  readonly background: number;
  /**
   * Codes of keys the game uses, their default action is prevented. R restarts the game.
   */
  readonly keys: ReadonlyArray<string>;
  /**
   * Hint shown at the bottom while the player plays
   */
  readonly hint?: string;
  /**
   * Time in seconds after which the demo restarts when the autopilot has lost
   */
  readonly restartDelay?: number;
}

/**
 * The longest time of a frame in seconds, so the game doesn't jump after the tab was in background
 */
const MAX_FRAME_TIME = 0.05;

/**
 * A game in a page. The autopilot plays until the game gets focus, then the player takes control. When the autopilot
 * loses, the game restarts, when the player loses, R restarts it.
 *
 * Every example extends it, and describes how its game is created, controlled and shown.
 */
export abstract class Demo<G extends DemoGame> {
  protected readonly app = new Application();
  /**
   * Layers of the stage from the bottom to the top: the background, views of entities, overlays and the status
   */
  protected readonly background = new Container();
  protected readonly world = new Container();
  protected readonly overlay = new Container();
  protected keyboard!: Keyboard;
  protected game!: G;
  private hud!: Hud;
  private autopilot!: Autopilot;
  private overTime = 0;

  protected constructor(private readonly settings: DemoSettings) {}

  /**
   * Returns a value indicating whether the player controls the game: it's focused
   */
  protected get isPlaying(): boolean {
    return document.activeElement === this.app.canvas;
  }

  /**
   * Text of the status line
   */
  protected abstract get status(): string;

  /**
   * Creates the pixi.js application in the element and starts the game
   */
  public async mount(element: HTMLElement): Promise<void> {
    const {width, height, background, keys} = this.settings;
    await this.app.init({
      width,
      height,
      background,
      antialias: true,
      resolution: window.devicePixelRatio,
      autoDensity: true,
    });
    const {canvas} = this.app;

    // The canvas shrinks on narrow pages, and keeps its proportions
    canvas.style.maxWidth = '100%';
    canvas.style.height = 'auto';
    canvas.style.outline = 'none';
    element.appendChild(canvas);

    this.keyboard = new Keyboard(canvas, [...keys, 'KeyR']);
    this.keyboard.onPress('KeyR', () => {
      if (this.game.isOver) this.restart();
    });
    // A click on the canvas focuses it, so the player takes control from the autopilot
    canvas.addEventListener('pointerdown', this.takeControl);

    this.hud = new Hud(width, height);
    this.app.stage.addChild(this.background, this.world, this.overlay, this.hud);

    this.setup();
    this.restart();
    this.app.ticker.add(this.onTick);
  }

  public destroy(): void {
    this.keyboard.destroy();
    this.app.canvas.removeEventListener('pointerdown', this.takeControl);
    this.app.destroy({removeView: true}, {children: true});
  }

  /**
   * Creates the game, which views are added to the layer
   */
  protected abstract createGame(layer: Container): G;

  protected abstract createAutopilot(game: G): Autopilot;

  /**
   * Advances the game by the time of the frame
   */
  protected abstract advance(dt: number): void;

  /**
   * Adds what the game needs besides the world, called once when the demo is mounted
   */
  protected setup(): void {
  }

  /**
   * Reads input of the player
   */
  protected readInput(): void {
  }

  /**
   * Sets controls of the game: the player controls it while it's focused, and the autopilot otherwise
   */
  protected control(): void {
    if (this.isPlaying) {
      this.readInput();
    } else {
      this.autopilot.update();
    }
  }

  protected restart(): void {
    for (const child of this.world.removeChildren()) child.destroy({children: true});
    this.game = this.createGame(this.world);
    this.autopilot = this.createAutopilot(this.game);
    this.overTime = 0;
  }

  private readonly takeControl = () => {
    this.app.canvas.focus();
  };

  private readonly onTick = (ticker: Ticker) => {
    const dt = Math.min(ticker.deltaMS / 1000, MAX_FRAME_TIME);
    this.advance(dt);

    const playing = this.isPlaying;
    this.hud.setStatus(this.status);
    this.hud.setHint(playing ? this.settings.hint ?? '' : 'Autopilot is playing, click to take control');
    if (!this.game.isOver) {
      this.hud.setMessage('');
      return;
    }

    // The demo restarts by itself after the autopilot has lost
    this.overTime += dt;
    if (!playing && this.overTime > (this.settings.restartDelay ?? 2)) this.restart();
    this.hud.setMessage(playing ? 'Game over\nPress R to restart' : 'Game over');
  };
}
