import {Engine} from 'tick-knock';
import {wrap} from '../shared/geometry';
import {Random} from '../shared/random';
import {AngularVelocity, Asteroid, Gun, Lifetime, Position, Rotation, Velocity} from './components';
import {ASTEROIDS, AsteroidSize, DRAG, THRUST, TURN_SPEED} from './config';
import {Controls} from './Controls';
import {createAsteroid, createBullet, createShip} from './entities';
import {AsteroidDestroyed, ShipDestroyed} from './messages';
import {CollisionSystem} from './systems';
import {SHIP} from './tags';

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
  let score = 0;
  let wave = 0;
  let isOver = false;
  let asteroidsLeft = 0;

  const spawnWave = () => {
    wave++;
    for (let i = 0; i < wave + 2; i++) {
      // Asteroids appear at the edges, away from the ship in the center
      const onVerticalEdge = random() < 0.5;
      engine.addEntity(createAsteroid(onVerticalEdge ? 0 : random() * width, onVerticalEdge ? random() * height : 0, 3, random));
    }
  };

  // #region systems
  engine
    // The ship turns, accelerates and fires according to the controls
    .iterative([Position, Velocity, Rotation, Gun, SHIP], (ship, dt, position, velocity, rotation, gun) => {
      const {left, right, thrust, fire} = controls;
      if (left) rotation.angle -= TURN_SPEED * dt;
      if (right) rotation.angle += TURN_SPEED * dt;
      if (thrust) {
        velocity.x += Math.cos(rotation.angle) * THRUST * dt;
        velocity.y += Math.sin(rotation.angle) * THRUST * dt;
      }
      // The ship loses the same share of the speed every second, whatever the frame rate is
      const drag = Math.exp(-DRAG * dt);
      velocity.x *= drag;
      velocity.y *= drag;

      gun.cooldown.tick(dt);
      if (fire && gun.cooldown.isReady) {
        gun.cooldown.restart();
        engine.addEntity(createBullet(position, velocity, rotation.angle));
      }
    }, {priority: Priority.Control, id: 'ship-control'})
    // Everything that has a velocity moves, and wraps around the edges of the screen
    .iterative([Position, Velocity], (entity, dt, position, velocity) => {
      position.x = wrap(position.x + velocity.x * dt, width);
      position.y = wrap(position.y + velocity.y * dt, height);
    }, {priority: Priority.Movement, id: 'movement'})
    // Everything that has an angular velocity spins
    .iterative([Rotation, AngularVelocity], (entity, dt, rotation, angularVelocity) => {
      rotation.angle += angularVelocity.value * dt;
    }, {priority: Priority.Movement, id: 'spin'})
    // Bullets disappear when their lifetime is over
    .iterative([Lifetime], (entity, dt, lifetime) => {
      lifetime.seconds -= dt;
      if (lifetime.seconds <= 0) engine.removeEntity(entity);
    }, {priority: Priority.Lifetime, id: 'lifetime'})
    .addSystem(new CollisionSystem({width, height}), {priority: Priority.Collisions, id: 'collisions'})
    // The next wave starts when the last asteroid is gone
    .reactive([Asteroid], {
      added: () => {
        asteroidsLeft++;
      },
      removed: () => {
        if (--asteroidsLeft === 0 && !isOver) spawnWave();
      },
    }, {id: 'waves'});
  // #endregion systems

  // #region messages
  // A destroyed asteroid gives points, and splits into two smaller ones
  engine.subscribe(AsteroidDestroyed, ({asteroid}) => {
    const {size} = asteroid.get(Asteroid)!;
    const {x, y} = asteroid.get(Position)!;
    score += ASTEROIDS[size].points;
    if (size === 1) return;
    const smaller = (size - 1) as AsteroidSize;
    engine.addEntity(createAsteroid(x, y, smaller, random));
    engine.addEntity(createAsteroid(x, y, smaller, random));
  });
  engine.subscribe(ShipDestroyed, () => {
    isOver = true;
  });
  // #endregion messages

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
