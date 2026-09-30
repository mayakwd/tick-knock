import {Engine, Entity, IterativeSystem, QueryBuilder} from 'tick-knock';

/**
 * Cell of the grid the entity occupies
 */
export class Position {
  public constructor(public x: number, public y: number) {}
}

/**
 * Direction the snake moves in, one cell per tick
 */
export class Heading {
  public constructor(public dx: number, public dy: number) {}
}

/**
 * Length of the snake including the head, stored on the head
 */
export class Body {
  public constructor(public length: number) {}
}

/**
 * Amount of ticks a body segment stays on the grid
 */
export class Lifetime {
  public constructor(public ticks: number) {}
}

export const HEAD = 'head';
export const SEGMENT = 'segment';
export const FOOD = 'food';

/**
 * Message dispatched when the snake eats food
 */
export class FoodEaten {
  public constructor(public readonly length: number) {}
}

/**
 * Message dispatched when the snake hits a wall or itself
 */
export class GameOver {}

export type Direction = 'up' | 'down' | 'left' | 'right';

/**
 * Controls shared between the input source and the game. It's a plain object passed to the steering system,
 * so any input source can change it: keyboard, autopilot or a test.
 */
export interface Controls {
  direction?: Direction;
}

export interface SnakeGameOptions {
  width: number;
  height: number;
  /**
   * Random number generator in [0, 1), a seeded one makes the game deterministic
   */
  random?: () => number;
}

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

const DIRECTIONS: Record<Direction, [number, number]> = {
  up: [0, -1],
  down: [0, 1],
  left: [-1, 0],
  right: [1, 0],
};

/**
 * Turns the snake according to the controls. It's a class-based system, because it depends on the controls object,
 * which is passed in the constructor.
 */
class SteeringSystem extends IterativeSystem.of(Heading, HEAD) {
  public constructor(private readonly controls: Controls) {
    super();
  }

  protected updateEntity(entity: Entity, dt: number, heading: Heading): void {
    const direction = this.controls.direction;
    if (direction === undefined) return;
    this.controls.direction = undefined;
    const [dx, dy] = DIRECTIONS[direction];
    // The snake can't turn back into itself
    if (dx === -heading.dx && dy === -heading.dy) return;
    heading.dx = dx;
    heading.dy = dy;
  }
}

/**
 * Checks what the head of the snake has run into: walls, its own body or food
 */
class CollisionSystem extends IterativeSystem.of(Position, Body, HEAD) {
  private readonly food = new QueryBuilder().contains(Position, FOOD).build();
  private readonly segments = new QueryBuilder().contains(Position, SEGMENT).build();

  public constructor(private readonly width: number, private readonly height: number) {
    super();
  }

  public onAddedToEngine(): void {
    super.onAddedToEngine();
    this.engine.addQuery(this.food).addQuery(this.segments);
  }

  public onRemovedFromEngine(): void {
    super.onRemovedFromEngine();
    this.engine.removeQuery(this.food);
    this.engine.removeQuery(this.segments);
  }

  protected updateEntity(head: Entity, dt: number, position: Position, body: Body): void {
    const {x, y} = position;
    if (x < 0 || y < 0 || x >= this.width || y >= this.height) {
      this.dispatch(new GameOver());
      return;
    }
    this.segments.forEach((segment, segmentPosition) => {
      if (segmentPosition.x === x && segmentPosition.y === y) {
        this.dispatch(new GameOver());
      }
    });
    this.food.forEach((food, foodPosition) => {
      if (foodPosition.x === x && foodPosition.y === y) {
        body.length++;
        this.engine.removeEntity(food);
        this.dispatch(new FoodEaten(body.length));
      }
    });
  }
}

/**
 * Creates a snake game. The game has no rendering and input, so it can be played in a terminal, a browser or a test.
 */
export function createSnakeGame({width, height, random = Math.random}: SnakeGameOptions): SnakeGame {
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
    engine.addEntity(new Entity().add(new Position(x, y)).add(FOOD));
  };

  engine
    .addSystem(new SteeringSystem(controls), {priority: 0, id: 'steering'})
    // The head leaves a segment behind, which lives as many ticks as long the snake is
    .iterative([Position, Heading, Body], (head, dt, position, heading, body) => {
      engine.addEntity(new Entity()
        .add(new Position(position.x, position.y))
        .add(new Lifetime(body.length))
        .add(SEGMENT));
      position.x += heading.dx;
      position.y += heading.dy;
    }, {priority: 1, id: 'movement'})
    .iterative([Lifetime], (segment, dt, lifetime) => {
      if (--lifetime.ticks <= 0) engine.removeEntity(segment);
    }, {priority: 2, id: 'aging'})
    .addSystem(new CollisionSystem(width, height), {priority: 3, id: 'collisions'})
    // Every time food is eaten, a new one appears
    .reactive([Position, FOOD], {removed: spawnFood}, {id: 'food-spawner'});

  engine.subscribe(FoodEaten, () => score++);
  engine.subscribe(GameOver, () => {
    isOver = true;
  });

  engine.addEntity(new Entity()
    .add(new Position(Math.floor(width / 2), Math.floor(height / 2)))
    .add(new Heading(1, 0))
    .add(new Body(3))
    .add(HEAD));
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

/**
 * Renders the game as text: `@` is the head, `o` is the body, `*` is food
 */
export function renderSnakeGame(game: SnakeGame): string {
  const rows = Array.from({length: game.height}, () => Array.from({length: game.width}, () => ' '));
  for (const entity of game.engine.entities) {
    const position = entity.get(Position);
    if (position === undefined || rows[position.y]?.[position.x] === undefined) continue;
    rows[position.y][position.x] = entity.has(HEAD) ? '@' : entity.has(FOOD) ? '*' : 'o';
  }
  const border = `+${'-'.repeat(game.width)}+`;
  return [border, ...rows.map((row) => `|${row.join('')}|`), border].join('\n');
}

/**
 * Creates a random number generator with a seed, so games and tests are reproducible
 */
export function seededRandom(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (state * 1664525 + 1013904223) >>> 0;
    return state / 0x100000000;
  };
}
