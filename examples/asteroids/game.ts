import {Engine, Entity, Query, QueryBuilder} from 'tick-knock';
import {Random} from '../shared/random';
import {Asteroid, Collider, Lifetime, Position, Rotation, Velocity} from './components';
import {ASTEROID_POINTS} from './config';
import {Controls} from './Controls';
import {createAsteroid, createShip} from './entities';
import {AsteroidDestroyed, ShipDestroyed} from './messages';
import {CollisionSystem, expiration, movement, ShipControlSystem, spin} from './systems';

export interface AsteroidsGameOptions {
  width: number;
  height: number;
  random?: Random;
  /**
   * Adds systems of the host, for example rendering. It's called before the first entities are created,
   * so reaction systems of the host receive all entities.
   */
  setup?: (engine: Engine) => void;
}

/**
 * Asteroids without rendering and input: it runs in the browser, and in tests as is
 */
export interface AsteroidsGame {
  readonly engine: Engine;
  readonly controls: Controls;
  readonly width: number;
  readonly height: number;
  readonly score: number;
  readonly wave: number;
  readonly isOver: boolean;

  /**
   * Advances the game
   * @param dt Delta time in seconds
   */
  update(dt: number): void;
}

/**
 * Priorities of systems: the ship is controlled first, then everything moves, and collisions are checked
 * after all entities have moved
 */
export const Priority = {
  Control: 0,
  Movement: 1,
  Lifetime: 2,
  Collisions: 3,
  Render: 100,
} as const;

export function createAsteroidsGame({width, height, random = Math.random, setup}: AsteroidsGameOptions): AsteroidsGame {
  const engine = new Engine();
  const controls: Controls = {left: false, right: false, thrust: false, fire: false};
  const asteroids: Query<[Asteroid]> = new QueryBuilder().contains(Asteroid).build();
  engine.addQuery(asteroids);
  let score = 0;
  let wave = 0;
  let isOver = false;

  const spawnWave = () => {
    wave++;
    for (let i = 0; i < wave + 2; i++) {
      // Asteroids appear at the edges, away from the ship in the center
      const onVerticalEdge = random() < 0.5;
      engine.addEntity(createAsteroid(onVerticalEdge ? 0 : random() * width, onVerticalEdge ? random() * height : 0, 3, random));
    }
  };

  const split = (asteroid: Entity) => {
    const {size} = asteroid.get(Asteroid)!;
    const {x, y} = asteroid.get(Position)!;
    // The asteroid is removed after the update, but it leaves collision queries right now
    asteroid.remove(Collider);
    engine.removeEntity(asteroid);
    if (size > 1) {
      engine.addEntity(createAsteroid(x, y, size - 1, random));
      engine.addEntity(createAsteroid(x, y, size - 1, random));
    }
  };

  engine
    .addSystem(new ShipControlSystem(controls), {priority: Priority.Control, id: 'ship-control'})
    .iterative([Position, Velocity], movement(width, height), {priority: Priority.Movement, id: 'movement'})
    .iterative([Rotation, Velocity, Asteroid], spin, {priority: Priority.Movement, id: 'spin'})
    .iterative([Lifetime], expiration(engine), {priority: Priority.Lifetime, id: 'lifetime'})
    .addSystem(new CollisionSystem(split), {priority: Priority.Collisions, id: 'collisions'})
    // A new wave starts when the last asteroid is destroyed
    .reactive([Asteroid], {
      removed: () => {
        if (asteroids.isEmpty && !isOver) spawnWave();
      },
    }, {id: 'waves'});

  engine.subscribe(AsteroidDestroyed, ({size}) => {
    score += ASTEROID_POINTS[size];
  });
  engine.subscribe(ShipDestroyed, () => {
    isOver = true;
  });

  setup?.(engine);
  engine.addEntity(createShip(width / 2, height / 2));
  spawnWave();

  return {
    engine,
    controls,
    width,
    height,
    get score() {
      return score;
    },
    get wave() {
      return wave;
    },
    get isOver() {
      return isOver;
    },
    update(dt: number) {
      engine.update(dt);
    },
  };
}
