import {Engine, Query, QueryBuilder} from 'tick-knock';
import {Container} from 'pixi.js';
import {DESTROYED} from '../shared/ecs/tags';
import {DestroySystem} from '../shared/systems/DestroySystem';
import {Random} from '../shared/random';
import {addViews} from '../shared/render/addViews';
import {Body, Cell, Heading, Lifetime} from './components';
import {CELL, START_LENGTH} from './config';
import {Controls, DIRECTIONS} from './Controls';
import {createHead} from './entities';
import {Grid} from './Grid';
import {CollisionSystem, EatingSystem, MovementSystem, SpawnSystem} from './systems';
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
  private readonly heads: Query<[Body]> = new QueryBuilder().with(Body, HEAD).build();
  private readonly movingHeads = new QueryBuilder().with(Heading, HEAD).build();
  private readonly food = new QueryBuilder().with(Cell, FOOD).build();

  public constructor({width, height, layer, random = Math.random}: SnakeGameOptions) {
    this.grid = new Grid(width, height);
    this.engine.addQuery(this.heads).addQuery(this.movingHeads).addQuery(this.food);

    // The grid follows cells of entities: an entity is added when it gets a cell, and removed when it loses it.
    // A moving head gets a new cell, so it's removed from the previous cell and added to the next one.
    this.engine.reactive([Cell], {
      added: ({current}, cell) => this.grid.add(cell, current),
      removed: ({current}, cell) => this.grid.remove(cell, current),
    });

    // A destroyed entity leaves the grid right away, and is removed from the engine after the update
    this.engine
      .reactive([Cell, DESTROYED], {added: ({current}) => current.remove(Cell)})
      .addSystem(new DestroySystem());

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

      // Then segments, which lifetime is over, are destroyed and free their cells, so the head can move there
      .iterative([Lifetime], (segment, dt, lifetime) => {
        if (--lifetime.ticks <= 0) segment.add(DESTROYED);
      })

      // The head can't move into a wall or the body
      .addSystem(new CollisionSystem(this.grid))

      // The head moves forward, and leaves a segment behind
      .addSystem(new MovementSystem())

      // The head eats food in its new cell
      .addSystem(new EatingSystem(this.grid))

      // New food appears, when there is no food on the grid
      .addSystem(new SpawnSystem(this.grid, random));

    // Views are placed after all game systems have moved entities
    addViews(this.engine, layer, {position: Cell, scale: CELL});

    this.engine.addEntity(createHead(Math.floor(width / 2), Math.floor(height / 2), START_LENGTH));
  }

  /**
   * Every eaten food makes the snake one segment longer, so the score is the length the snake has grown by
   */
  public get score(): number {
    const body = this.heads.first?.get(Body);
    return body === undefined ? 0 : body.length - START_LENGTH;
  }

  /**
   * The game is over when the snake has crashed, and lost its heading, or has filled the whole grid
   */
  public get isOver(): boolean {
    return this.movingHeads.isEmpty || this.isWon;
  }

  public get isWon(): boolean {
    return this.food.isEmpty && this.grid.isFull;
  }

  /**
   * Advances the game by one tick
   */
  public tick(): void {
    if (!this.isOver) this.engine.update(1);
  }
}
