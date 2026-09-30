import {Engine, QueryBuilder} from 'tick-knock';
import {Container} from 'pixi.js';
import {CooldownSystem} from '../shared/CooldownSystem';
import {DESTROYED, DestroySystem} from '../shared/DestroySystem';
import {wrap} from '../shared/geometry';
import {Random} from '../shared/random';
import {Score} from '../shared/Score';
import {addViews} from '../shared/render/addViews';
import {View} from '../shared/render/View';
import {AsteroidTree} from './AsteroidTree';
import {AngularVelocity, Collider, Lifetime, Position, Rotation, Velocity} from './components';
import {Controls} from './Controls';
import {createShip} from './entities';
import {
  AsteroidTreeSystem,
  BulletCollisionSystem,
  ShipCollisionSystem,
  ShipControlSystem,
  SpawnSystem,
  SplitSystem,
  WaveState,
} from './systems';
import {SHIP} from './tags';

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
  private readonly _score = new Score();
  private readonly waves = new WaveState();
  private readonly ships = new QueryBuilder().contains(SHIP).build();

  public constructor({width, height, layer, random = Math.random}: AsteroidsGameOptions) {
    this.width = width;
    this.height = height;
    this.engine.addQuery(this.ships);

    // Asteroids at their positions, collisions look for asteroids near bullets and the ship in it
    const asteroids = new AsteroidTree({width, height});

    // A destroyed entity stops colliding right away, and is removed from the engine after the update
    this.engine
      .reactive([Collider, DESTROYED], {added: ({current}) => current.remove(Collider)})
      .addSystem(new DestroySystem());

    this.engine
      // The next wave starts when the last asteroid is gone
      .addSystem(new SpawnSystem(this.waves, {width, height}, random))

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

      // Bullets are destroyed when their lifetime is over
      .iterative([Lifetime], (entity, dt, lifetime) => {
        lifetime.seconds -= dt;
        if (lifetime.seconds <= 0) entity.add(DESTROYED);
      })

      // Collisions are checked after everything has moved: asteroids are moved in the tree, and bullets and the ship
      // look for asteroids near them
      .addSystem(new AsteroidTreeSystem(asteroids))
      .addSystem(new BulletCollisionSystem(asteroids, this._score))
      .addSystem(new ShipCollisionSystem(asteroids))

      // Destroyed asteroids split into smaller ones
      .addSystem(new SplitSystem(random));

    // Views follow positions and rotations of entities after all game systems
    addViews(this.engine, layer, {position: Position});
    const rotate = ({display}: View, {angle}: Rotation) => {
      display.rotation = angle;
    };
    this.engine
      .reactive([View, Rotation], {added: (snapshot, view, rotation) => rotate(view, rotation)})
      .iterative([View, Rotation], (entity, dt, view, rotation) => rotate(view, rotation));

    this.engine.addEntity(createShip(width / 2, height / 2));
  }

  public get score(): number {
    return this._score.points;
  }

  public get wave(): number {
    return this.waves.number;
  }

  /**
   * The game is over when the ship is destroyed, and removed from the engine
   */
  public get isOver(): boolean {
    return this.ships.isEmpty;
  }

  /**
   * Advances the game
   * @param dt Delta time in seconds
   */
  public update(dt: number): void {
    if (!this.isOver) this.engine.update(dt);
  }
}
