import {Application, Container} from 'pixi.js';
import {Controls} from '../ecs/Controls';
import {Game} from '../ecs/Game';
import {Keyboard} from './Keyboard';

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
  readonly hint: string;
  /**
   * Time in seconds after which the demo restarts when the autopilot has finished
   */
  readonly restartDelay: number;
}

/**
 * The application and input of the demo, and layers of its stage from the bottom to the top. The page gets it once,
 * when the demo is mounted.
 */
export class DemoStage {
  public constructor(
    public readonly app: Application,
    public readonly keyboard: Keyboard,
    /**
     * Layer under the world, for what never changes, like a map
     */
    public readonly background: Container,
    /**
     * Layer of views of entities, the demo clears it on restart
     */
    public readonly world: Container,
    /**
     * Layer above the world, for what the page draws itself, like a preview of a tower
     */
    public readonly overlay: Container,
  ) {}
}

/**
 * Describes a game in a page: how it's created, how the player controls it, and what the status line shows.
 * The page owns the controls and passes them to every new game, so input keeps working after a restart.
 */
export abstract class GamePage<G extends Game, C extends Controls> {
  protected constructor(public readonly settings: DemoSettings, public readonly controls: C) {}

  /**
   * Creates a new game with the controls of the page, on start and on every restart
   * @param world Layer views of entities are added to
   */
  public abstract createGame(world: Container): G;

  /**
   * Text of the status line
   */
  public abstract status(game: G): string;

  /**
   * Called once, when the demo is mounted: binds keys and the pointer, draws static layers
   */
  public setup(stage: DemoStage): void {
  }

  /**
   * Called every frame before the update while the player plays: input becomes intents in the controls
   */
  public readInput(keyboard: Keyboard, game: G): void {
  }

  /**
   * Called every frame after the update: draws what depends on the game besides views of entities, like a preview
   */
  public present(game: G): void {
  }
}
