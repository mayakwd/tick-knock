import {Engine} from 'tick-knock';
import {Container} from 'pixi.js';
import {Random} from '../shared/random';
import {addViews} from '../shared/render/addViews';
import {Cell, Heading, Lifetime} from './components';
import {CELL, START_LENGTH} from './config';
import {Controls, DIRECTIONS} from './Controls';
import {createFood, createHead} from './entities';
import {Grid} from './Grid';
import {FoodEaten, GameOver} from './messages';
import {CollisionSystem, EatingSystem, MovementSystem} from './systems';
import {FOOD, HEAD} from './tags';

export interface SnakeGameOptions {
  /**
   * Size of the grid in cells
   */
  width: number;
  height: number;
  /**
   * Layer views of entities are added to
   */
  layer: Container;
  /**
   * Random number generator, a seeded one makes the game deterministic
   */
  random?: Random;
}

/**
 * Snake: the engine with all systems. It doesn't read input and doesn't know where it's displayed, so it runs in
 * a browser, a terminal and tests as is.
 */
export class SnakeGame {
  public readonly engine = new Engine();
  public readonly controls = new Controls();
  /**
   * Entities indexed by their cells
   */
  public readonly grid: Grid;
  private readonly random: Random;
  private _score = 0;
  private _isOver = false;
  private _isWon = false;

  public constructor({width, height, layer, random = Math.random}: SnakeGameOptions) {
    this.grid = new Grid(width, height);
    this.random = random;

    // #region grid
    // The grid follows cells of entities: an entity is added when it gets a cell, and removed when it loses it.
    // A moving head gets a new cell, so it's removed from the previous cell and added to the next one.
    this.engine.reactive([Cell], {
      added: ({current}, cell) => this.grid.add(cell, current),
      removed: ({current}, cell) => this.grid.remove(cell, current),
    });
    // #endregion grid

    // #region systems
    this.engine
      // First, the head turns in the direction of the controls
      .iterative([Heading, HEAD], (head, dt, heading) => {
        // The player hasn't turned
        const direction = this.controls.takeDirection();
        if (direction === undefined) return;

        // The snake can't turn back into itself
        const {dx, dy} = DIRECTIONS[direction];
        if (dx === -heading.dx && dy === -heading.dy) return;

        heading.dx = dx;
        heading.dy = dy;
      })

      // Then segments, which lifetime is over, free their cells, so the head can move there
      .iterative([Lifetime], (segment, dt, lifetime) => {
        // The segment still occupies its cell
        if (--lifetime.ticks > 0) return;

        // The segment is removed after the update, but it loses its cell right away
        segment.remove(Cell);
        this.engine.removeEntity(segment);
      })

      // The head can't move into a wall or the body
      .addSystem(new CollisionSystem(this.grid))

      // The head moves forward, and leaves a segment behind
      .addSystem(new MovementSystem())

      // The head eats food in its new cell
      .addSystem(new EatingSystem(this.grid))

      // Every time food is eaten, a new one appears
      .reactive([Cell, FOOD], {removed: () => this.spawnFood()});
    // #endregion systems

    // Views are placed after all game systems have moved entities
    addViews(this.engine, layer, {position: Cell, scale: CELL});

    // #region messages
    this.engine.subscribe(FoodEaten, () => this._score++);
    this.engine.subscribe(GameOver, ({isWon}) => {
      this._isOver = true;
      this._isWon = isWon;
    });
    // #endregion messages

    this.engine.addEntity(createHead(Math.floor(width / 2), Math.floor(height / 2), START_LENGTH));
    this.spawnFood();
  }

  public get score(): number {
    return this._score;
  }

  public get isOver(): boolean {
    return this._isOver;
  }

  /**
   * The snake has filled the whole grid
   */
  public get isWon(): boolean {
    return this._isWon;
  }

  /**
   * Advances the game by one tick
   */
  public tick(): void {
    if (!this._isOver) this.engine.update(1);
  }

  /**
   * Adds food to a random free cell. When there are no free cells, the snake has filled the grid.
   */
  private spawnFood(): void {
    const free = this.grid.freeCells();
    if (free.length === 0) {
      this.engine.dispatch(new GameOver(true));
      return;
    }

    const {x, y} = free[Math.floor(this.random() * free.length)];
    this.engine.addEntity(createFood(x, y));
  }
}
