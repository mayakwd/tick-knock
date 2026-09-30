import {Engine, Entity} from 'tick-knock';
import {Random} from '../shared/random';
import {Body, Cell, Heading, Lifetime} from './components';
import {START_LENGTH} from './config';
import {Controls, DIRECTIONS} from './Controls';
import {createFood, createHead, createSegment} from './entities';
import {Grid} from './Grid';
import {FoodEaten, GameOver} from './messages';
import {FOOD, HEAD, SEGMENT} from './tags';

export interface SnakeGameOptions {
  width: number;
  height: number;
  /**
   * Random number generator, a seeded one makes the game deterministic
   */
  random?: Random;
  /**
   * Adds systems of the host, for example rendering. It's called before the first entities are created,
   * so reaction systems of the host receive all entities.
   */
  setup?: (engine: Engine) => void;
}

/**
 * Snake without rendering and input: it runs in a terminal, a browser and tests as is
 */
export interface SnakeGame {
  readonly engine: Engine;
  readonly controls: Controls;
  /**
   * Entities indexed by their cells
   */
  readonly grid: Grid;
  readonly width: number;
  readonly height: number;
  readonly score: number;
  readonly isOver: boolean;
  /**
   * The snake has filled the whole board
   */
  readonly isWon: boolean;

  /**
   * Advances the game by one tick
   */
  tick(): void;
}

/**
 * Priorities of systems: the snake turns, its tail shortens and frees its cell, and then the snake moves
 */
export const Priority = {
  Steering: 0,
  Aging: 1,
  Movement: 2,
  Render: 100,
} as const;

export function createSnakeGame({width, height, random = Math.random, setup}: SnakeGameOptions): SnakeGame {
  const engine = new Engine();
  const controls: Controls = {};
  const grid = new Grid(width, height);
  let score = 0;
  let isOver = false;
  let isWon = false;

  // Food appears in a random free cell. When there are no free cells, the snake has filled the board.
  const spawnFood = () => {
    const free = grid.freeCells();
    if (free.length === 0) {
      engine.dispatch(new GameOver(true));
      return;
    }
    const {x, y} = free[Math.floor(random() * free.length)];
    engine.addEntity(createFood(x, y));
  };

  // An eaten food leaves its cell right away, so new food can't appear under the head
  const eat = (food: Entity, body: Body) => {
    body.length++;
    food.remove(Cell);
    engine.removeEntity(food);
    engine.dispatch(new FoodEaten(body.length));
  };

  // #region grid
  // The grid follows cells of entities: an entity is indexed when it gets a cell, and a moved entity gets a new cell,
  // so it's removed from the previous one and added to the next one
  engine.reactive([Cell], {
    added: ({current}, cell) => grid.set(cell, current),
    removed: ({current}, cell) => grid.delete(cell, current),
  }, {id: 'grid'});
  // #endregion grid

  // #region systems
  engine
    // The snake turns in the direction of the controls, but can't turn back into itself
    .iterative([Heading, HEAD], (head, dt, heading) => {
      const {direction} = controls;
      if (direction === undefined) return;
      controls.direction = undefined;
      const {dx, dy} = DIRECTIONS[direction];
      if (dx === -heading.dx && dy === -heading.dy) return;
      heading.dx = dx;
      heading.dy = dy;
    }, {priority: Priority.Steering, id: 'steering'})
    // Segments disappear when their lifetime is over. The segment is removed after the update, but it loses its cell
    // right away, so the head can move to the cell in the same tick.
    .iterative([Lifetime], (segment, dt, lifetime) => {
      if (--lifetime.ticks > 0) return;
      segment.remove(Cell);
      engine.removeEntity(segment);
    }, {priority: Priority.Aging, id: 'aging'})
    // The head looks into the next cell: a wall or the body ends the game, food makes the snake longer.
    // Then the head moves, and leaves a segment behind, which lives as many ticks as long the body is.
    .iterative([Cell, Heading, Body, HEAD], (head, dt, cell, heading, body) => {
      const next = new Cell(cell.x + heading.dx, cell.y + heading.dy);
      const occupant = grid.at(next);
      if (!grid.isInside(next) || occupant?.has(SEGMENT)) {
        engine.dispatch(new GameOver());
        return;
      }
      head.add(next);
      engine.addEntity(createSegment(cell.x, cell.y, body.length - 1));
      if (occupant?.has(FOOD)) eat(occupant, body);
    }, {priority: Priority.Movement, id: 'movement'})
    // Every time food is eaten, a new one appears
    .reactive([Cell, FOOD], {removed: spawnFood}, {id: 'food-spawner'});
  // #endregion systems

  engine.subscribe(FoodEaten, () => score++);
  engine.subscribe(GameOver, (message) => {
    isOver = true;
    isWon = message.isWon;
  });

  setup?.(engine);
  engine.addEntity(createHead(Math.floor(width / 2), Math.floor(height / 2), START_LENGTH));
  spawnFood();

  return {
    engine,
    controls,
    grid,
    width,
    height,
    get score() {
      return score;
    },
    get isOver() {
      return isOver;
    },
    get isWon() {
      return isWon;
    },
    tick() {
      if (!isOver) engine.update(1);
    },
  };
}
