import {Engine} from 'tick-knock';
import {Random} from '../shared/random';
import {Body, Heading, Lifetime, Position} from './components';
import {Controls} from './Controls';
import {createFood, createHead} from './entities';
import {FoodEaten, GameOver} from './messages';
import {aging, CollisionSystem, movement, SteeringSystem} from './systems';
import {FOOD} from './tags';

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
  readonly width: number;
  readonly height: number;
  readonly score: number;
  readonly isOver: boolean;

  /**
   * Advances the game by one tick
   */
  tick(): void;
}

/**
 * Priorities of systems: the snake turns, moves, its tail shortens, and only then collisions are checked
 */
export const Priority = {
  Steering: 0,
  Movement: 1,
  Aging: 2,
  Collisions: 3,
  Render: 100,
} as const;

export function createSnakeGame({width, height, random = Math.random, setup}: SnakeGameOptions): SnakeGame {
  const engine = new Engine();
  const controls: Controls = {};
  let score = 0;
  let isOver = false;

  const isFree = (x: number, y: number) => engine.entities.every((entity) => {
    const position = entity.get(Position);
    return position === undefined || position.x !== x || position.y !== y;
  });

  const spawnFood = () => {
    const free: Array<[number, number]> = [];
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        if (isFree(x, y)) free.push([x, y]);
      }
    }
    if (free.length === 0) return;
    const [x, y] = free[Math.floor(random() * free.length)];
    engine.addEntity(createFood(x, y));
  };

  engine
    .addSystem(new SteeringSystem(controls), {priority: Priority.Steering, id: 'steering'})
    .iterative([Position, Heading, Body], movement(engine), {priority: Priority.Movement, id: 'movement'})
    .iterative([Lifetime], aging(engine), {priority: Priority.Aging, id: 'aging'})
    .addSystem(new CollisionSystem(width, height), {priority: Priority.Collisions, id: 'collisions'})
    // Every time food is eaten, a new one appears
    .reactive([Position, FOOD], {removed: spawnFood}, {id: 'food-spawner'});

  engine.subscribe(FoodEaten, () => score++);
  engine.subscribe(GameOver, () => {
    isOver = true;
  });

  setup?.(engine);
  engine.addEntity(createHead(Math.floor(width / 2), Math.floor(height / 2), 3));
  spawnFood();

  return {
    engine,
    controls,
    width,
    height,
    get score() {
      return score;
    },
    get isOver() {
      return isOver;
    },
    tick() {
      if (!isOver) engine.update(1);
    },
  };
}
