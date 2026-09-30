import {Engine} from 'tick-knock';
import {Container} from 'pixi.js';
import {CooldownSystem} from '../shared/CooldownSystem';
import {wrap} from '../shared/geometry';
import {Random} from '../shared/random';
import {addViews} from '../shared/render/addViews';
import {View} from '../shared/render/View';
import {AsteroidTree} from './AsteroidTree';
import {AngularVelocity, Asteroid, Lifetime, Position, Rotation, Velocity} from './components';
import {ASTEROIDS, AsteroidSize} from './config';
import {Controls} from './Controls';
import {createAsteroid, createShip} from './entities';
import {AsteroidDestroyed, ShipDestroyed} from './messages';
import {AsteroidTreeSystem, BulletCollisionSystem, ShipCollisionSystem, ShipControlSystem} from './systems';

export interface AsteroidsGameOptions {
  width: number;
  height: number;
  /**
   * Layer views of entities are added to
   */
  layer: Container;
  random?: Random;
}

/**
 * Asteroids: the engine with all systems. It doesn't read input, so it runs in the browser and in tests as is.
 */
export class AsteroidsGame {
  public readonly engine = new Engine();
  public readonly controls = new Controls();
  public readonly width: number;
  public readonly height: number;
  private readonly random: Random;
  /**
   * Asteroids at their positions, collisions look for asteroids near bullets and the ship in it
   */
  private readonly asteroids: AsteroidTree;
  private _score = 0;
  private _wave = 0;
  private _isOver = false;
  private asteroidsLeft = 0;

  public constructor({width, height, layer, random = Math.random}: AsteroidsGameOptions) {
    this.width = width;
    this.height = height;
    this.random = random;
    this.asteroids = new AsteroidTree({width, height});

    this.engine
      // Cooldowns are counted down, and the ship is controlled, so it moves and fires in the same update
      .addSystem(new CooldownSystem())
      .addSystem(new ShipControlSystem(this.controls))

      // Everything that has a velocity moves, and wraps around the edges of the screen
      .iterative([Position, Velocity], (entity, dt, position, velocity) => {
        position.x = wrap(position.x + velocity.x * dt, width);
        position.y = wrap(position.y + velocity.y * dt, height);
      })

      // Everything that has an angular velocity spins
      .iterative([Rotation, AngularVelocity], (entity, dt, rotation, angularVelocity) => {
        rotation.angle += angularVelocity.value * dt;
      })

      // Bullets disappear when their lifetime is over
      .iterative([Lifetime], (entity, dt, lifetime) => {
        lifetime.seconds -= dt;
        if (lifetime.seconds <= 0) this.engine.removeEntity(entity);
      })

      // Collisions are checked after everything has moved: asteroids are put into the tree, and bullets and the ship
      // look for asteroids near them
      .addSystem(new AsteroidTreeSystem(this.asteroids))
      .addSystem(new BulletCollisionSystem(this.asteroids))
      .addSystem(new ShipCollisionSystem(this.asteroids))

      // The next wave starts when the last asteroid is gone
      .reactive([Asteroid], {
        added: () => this.asteroidsLeft++,
        removed: () => {
          if (--this.asteroidsLeft === 0 && !this._isOver) this.spawnWave();
        },
      });

    // Views follow positions and rotations of entities after all game systems
    addViews(this.engine, layer, {position: Position});
    const rotate = ({display}: View, {angle}: Rotation) => {
      display.rotation = angle;
    };
    this.engine
      .reactive([View, Rotation], {added: (snapshot, view, rotation) => rotate(view, rotation)})
      .iterative([View, Rotation], (entity, dt, view, rotation) => rotate(view, rotation));

    // A destroyed asteroid gives points, and splits into two smaller ones
    this.engine.subscribe(AsteroidDestroyed, ({asteroid}) => {
      const {size} = asteroid.get(Asteroid)!;
      const {x, y} = asteroid.get(Position)!;
      this._score += ASTEROIDS[size].points;
      if (size === 1) return;

      const smaller = (size - 1) as AsteroidSize;
      this.engine.addEntity(createAsteroid(x, y, smaller, random));
      this.engine.addEntity(createAsteroid(x, y, smaller, random));
    });

    this.engine.subscribe(ShipDestroyed, () => {
      this._isOver = true;
    });

    this.engine.addEntity(createShip(width / 2, height / 2));
    this.spawnWave();
  }

  public get score(): number {
    return this._score;
  }

  public get wave(): number {
    return this._wave;
  }

  public get isOver(): boolean {
    return this._isOver;
  }

  /**
   * Advances the game
   * @param dt Delta time in seconds
   */
  public update(dt: number): void {
    this.engine.update(dt);
  }

  /**
   * Adds large asteroids at the edges, away from the ship in the center. Every wave has one asteroid more.
   */
  private spawnWave(): void {
    this._wave++;
    for (let i = 0; i < this._wave + 2; i++) {
      const onVerticalEdge = this.random() < 0.5;
      const x = onVerticalEdge ? 0 : this.random() * this.width;
      const y = onVerticalEdge ? this.random() * this.height : 0;
      this.engine.addEntity(createAsteroid(x, y, 3, this.random));
    }
  }
}
