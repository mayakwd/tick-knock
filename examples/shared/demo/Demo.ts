import {Application, Container, Ticker} from 'pixi.js';
import {Controls} from '../ecs/Controls';
import {Game} from '../ecs/Game';
import {GameOver} from '../ecs/GameOver';
import {Outcome} from '../ecs/GameState';
import {Hud} from '../render/Hud';
import {DemoStage, GamePage} from './GamePage';
import {Keyboard} from './Keyboard';

/**
 * The longest time of a frame in seconds, so the game doesn't jump after the tab was in background
 */
const MAX_FRAME_TIME = 0.05;
const RESTART_KEY = 'KeyR';

/**
 * A game in a page. The autopilot plays until the game gets focus, then the player takes control. When the autopilot
 * finishes, the game restarts by itself, when the player finishes, R restarts it.
 *
 * The demo drives the game and shows it, and the page describes the game:
 *
 * ```ts
 * const demo = await Demo.mount(element, new TowerDefensePage());
 * // ...
 * demo.destroy();
 * ```
 */
export class Demo<G extends Game> {
  private readonly keyboard: Keyboard;
  private readonly hud: Hud;
  private readonly world = new Container();
  private game: G;
  /**
   * How the game has ended, undefined while it goes on
   */
  private outcome: Outcome | undefined = undefined;
  /**
   * Time in seconds since the game has ended
   */
  private overTime = 0;

  private constructor(private readonly app: Application, private readonly page: GamePage<G, Controls>) {
    const {canvas, stage} = app;
    const {width, height, keys} = page.settings;

    this.keyboard = new Keyboard(canvas, [...keys, RESTART_KEY]);
    this.keyboard.onPress(RESTART_KEY, this.onRestartPressed);
    // A click on the canvas focuses it, so the player takes control from the autopilot
    canvas.addEventListener('pointerdown', this.takeControl);

    // Layers from the bottom to the top: the background, views of entities, overlays of the page and the status
    const background = new Container();
    const overlay = new Container();
    this.hud = new Hud(width, height);
    stage.addChild(background, this.world, overlay, this.hud);
    page.setup(new DemoStage(app, this.keyboard, background, this.world, overlay));

    this.game = this.createGame();
    app.ticker.add(this.onTick);
  }

  /**
   * Creates the pixi.js application in the element and starts the game of the page
   */
  public static async mount<G extends Game>(element: HTMLElement, page: GamePage<G, Controls>): Promise<Demo<G>> {
    const {width, height, background} = page.settings;
    const app = new Application();
    await app.init({
      width,
      height,
      background,
      antialias: true,
      resolution: window.devicePixelRatio,
      autoDensity: true,
    });

    // The canvas shrinks on narrow pages, and keeps its proportions
    const {canvas} = app;
    canvas.style.maxWidth = '100%';
    canvas.style.height = 'auto';
    canvas.style.outline = 'none';
    element.appendChild(canvas);

    return new Demo(app, page);
  }

  /**
   * Stops the game and releases all resources, the canvas is removed from the page
   */
  public destroy(): void {
    this.keyboard.destroy();
    this.app.canvas.removeEventListener('pointerdown', this.takeControl);
    this.app.destroy({removeView: true}, {children: true});
  }

  /**
   * Returns a value indicating whether the player controls the game: it's focused
   */
  private get isPlaying(): boolean {
    return document.activeElement === this.app.canvas;
  }

  /**
   * Creates a new game in the cleared world
   */
  private createGame(): G {
    for (const child of this.world.removeChildren()) child.destroy({children: true});
    this.outcome = undefined;
    this.overTime = 0;

    // The game tells when it's over, and the demo shows it
    const game = this.page.createGame(this.world);
    game.engine.subscribe(GameOver, ({outcome}) => {
      this.outcome = outcome;
    });
    return game;
  }

  private readonly takeControl = (): void => {
    this.app.canvas.focus();
  };

  private readonly onRestartPressed = (): void => {
    if (this.outcome !== undefined) this.game = this.createGame();
  };

  private readonly onTick = (ticker: Ticker): void => {
    const dt = Math.min(ticker.deltaMS / 1000, MAX_FRAME_TIME);

    // The player controls the game while it's focused, and the autopilot otherwise
    const playing = this.isPlaying;
    this.page.controls.pilot = playing ? 'player' : 'autopilot';
    if (playing) this.page.readInput(this.keyboard, this.game);

    this.game.update(dt);
    this.page.present(this.game);

    this.hud.setStatus(this.page.status(this.game));
    this.hud.setHint(playing ? this.page.settings.hint : 'Autopilot is playing, click to take control');
    if (this.outcome === undefined) {
      this.hud.setMessage('');
      return;
    }

    // The demo restarts by itself after the autopilot has finished
    this.overTime += dt;
    if (!playing && this.overTime > this.page.settings.restartDelay) {
      this.game = this.createGame();
      return;
    }

    const title = this.outcome === 'won' ? 'You win!' : 'Game over';
    this.hud.setMessage(playing ? `${title}\nPress R to restart` : title);
  };
}
