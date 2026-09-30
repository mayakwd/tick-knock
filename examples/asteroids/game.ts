import {Engine, Entity, IterativeSystem, Query, QueryBuilder, System} from 'tick-knock';

export class Position {
  public constructor(public x: number, public y: number) {}
}

export class Velocity {
  public constructor(public x: number = 0, public y: number = 0) {}
}

/**
 * Rotation in radians, 0 points to the right
 */
export class Rotation {
  public constructor(public angle: number = 0) {}
}

/**
 * Circle used to detect collisions
 */
export class Collider {
  public constructor(public readonly radius: number) {}
}

/**
 * Time in seconds after which the entity is removed
 */
export class Lifetime {
  public constructor(public seconds: number) {}
}

export class Ship {
  /**
   * Time in seconds until the ship can fire again
   */
  public cooldown: number = 0;
}

export class Asteroid {
  public constructor(
    /**
     * Size from 3 (large) to 1 (small), a destroyed asteroid splits into two smaller ones
     */
    public readonly size: number,
    /**
     * Relative radii of the outline vertices, so every asteroid has its own shape
     */
    public readonly outline: ReadonlyArray<number>,
  ) {}
}

export const BULLET = 'bullet';

/**
 * Message dispatched when a bullet destroys an asteroid
 */
export class AsteroidDestroyed {
  public constructor(public readonly size: number) {}
}

/**
 * Message dispatched when the ship collides with an asteroid
 */
export class ShipDestroyed {}

/**
 * Controls shared between the input source and the ship control system
 */
export interface Controls {
  left: boolean;
  right: boolean;
  thrust: boolean;
  fire: boolean;
}

export interface AsteroidsGameOptions {
  width: number;
  height: number;
  random?: () => number;
}

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

const SHIP_RADIUS = 12;
const TURN_SPEED = 4;
const THRUST = 250;
const DRAG = 0.6;
const BULLET_SPEED = 450;
const BULLET_LIFETIME = 1;
const FIRE_COOLDOWN = 0.2;
const ASTEROID_RADIUS = [0, 12, 24, 40];
const ASTEROID_POINTS = [0, 20, 50, 100];

/**
 * Rotates and accelerates the ship, and fires bullets according to the controls
 */
class ShipControlSystem extends IterativeSystem.of(Ship, Position, Velocity, Rotation) {
  public constructor(private readonly controls: Controls) {
    super();
  }

  protected updateEntity(entity: Entity, dt: number, ship: Ship, position: Position, velocity: Velocity, rotation: Rotation): void {
    const {left, right, thrust, fire} = this.controls;
    if (left) rotation.angle -= TURN_SPEED * dt;
    if (right) rotation.angle += TURN_SPEED * dt;
    const directionX = Math.cos(rotation.angle);
    const directionY = Math.sin(rotation.angle);
    if (thrust) {
      velocity.x += directionX * THRUST * dt;
      velocity.y += directionY * THRUST * dt;
    }
    velocity.x -= velocity.x * DRAG * dt;
    velocity.y -= velocity.y * DRAG * dt;

    ship.cooldown = Math.max(0, ship.cooldown - dt);
    if (fire && ship.cooldown === 0) {
      ship.cooldown = FIRE_COOLDOWN;
      this.engine.addEntity(new Entity()
        .add(new Position(position.x + directionX * SHIP_RADIUS, position.y + directionY * SHIP_RADIUS))
        .add(new Velocity(velocity.x + directionX * BULLET_SPEED, velocity.y + directionY * BULLET_SPEED))
        .add(new Collider(2))
        .add(new Lifetime(BULLET_LIFETIME))
        .add(BULLET));
    }
  }
}

/**
 * Detects collisions of bullets with asteroids, and of the ship with asteroids
 */
class CollisionSystem extends System {
  private readonly bullets = new QueryBuilder().contains(Position, Collider, BULLET).build();
  private readonly asteroids = new QueryBuilder().contains(Position, Collider, Asteroid).build();
  private readonly ships = new QueryBuilder().contains(Position, Collider, Ship).build();

  public constructor(private readonly split: (asteroid: Entity) => void) {
    super();
  }

  public onAddedToEngine(): void {
    this.engine.addQuery(this.bullets).addQuery(this.asteroids).addQuery(this.ships);
  }

  public onRemovedFromEngine(): void {
    for (const query of [this.bullets, this.asteroids, this.ships]) this.engine.removeQuery(query);
  }

  public update(): void {
    this.asteroids.forEach((asteroid, asteroidPosition, asteroidCollider, {size}) => {
      this.bullets.forEach((bullet, bulletPosition, bulletCollider) => {
        if (!this.asteroids.has(asteroid) || !collides(asteroidPosition, asteroidCollider, bulletPosition, bulletCollider)) return;
        this.engine.removeEntity(bullet);
        this.split(asteroid);
        this.dispatch(new AsteroidDestroyed(size));
      });
      this.ships.forEach((ship, shipPosition, shipCollider) => {
        if (!this.asteroids.has(asteroid) || !collides(asteroidPosition, asteroidCollider, shipPosition, shipCollider)) return;
        this.engine.removeEntity(ship);
        this.dispatch(new ShipDestroyed());
      });
    });
  }
}

function collides(a: Position, aCollider: Collider, b: Position, bCollider: Collider): boolean {
  const distance = aCollider.radius + bCollider.radius;
  return (a.x - b.x) ** 2 + (a.y - b.y) ** 2 < distance * distance;
}

/**
 * Creates an asteroids game without rendering and input
 */
export function createAsteroidsGame({width, height, random = Math.random}: AsteroidsGameOptions): AsteroidsGame {
  const engine = new Engine();
  const controls: Controls = {left: false, right: false, thrust: false, fire: false};
  const asteroids: Query<[Asteroid]> = new QueryBuilder().contains(Asteroid).build();
  engine.addQuery(asteroids);
  let score = 0;
  let wave = 0;
  let isOver = false;

  const spawnAsteroid = (x: number, y: number, size: number) => {
    const angle = random() * Math.PI * 2;
    const speed = 30 + random() * 40 * (4 - size);
    const outline = Array.from({length: 10}, () => 0.75 + random() * 0.25);
    engine.addEntity(new Entity()
      .add(new Position(x, y))
      .add(new Velocity(Math.cos(angle) * speed, Math.sin(angle) * speed))
      .add(new Rotation(random() * Math.PI * 2))
      .add(new Collider(ASTEROID_RADIUS[size]))
      .add(new Asteroid(size, outline)));
  };

  const spawnWave = () => {
    wave++;
    for (let i = 0; i < wave + 2; i++) {
      // Asteroids appear at the edges, away from the ship in the center
      const onVerticalEdge = random() < 0.5;
      spawnAsteroid(onVerticalEdge ? 0 : random() * width, onVerticalEdge ? random() * height : 0, 3);
    }
  };

  const split = (asteroid: Entity) => {
    const {size} = asteroid.get(Asteroid)!;
    const {x, y} = asteroid.get(Position)!;
    engine.removeEntity(asteroid);
    if (size > 1) {
      spawnAsteroid(x, y, size - 1);
      spawnAsteroid(x, y, size - 1);
    }
  };

  engine
    .addSystem(new ShipControlSystem(controls), {id: 'ship-control'})
    .iterative([Position, Velocity], (entity, dt, position, velocity) => {
      position.x = wrap(position.x + velocity.x * dt, width);
      position.y = wrap(position.y + velocity.y * dt, height);
    }, {priority: 1, id: 'movement'})
    .iterative([Rotation, Velocity, Asteroid], (entity, dt, rotation, velocity) => {
      // Asteroids slowly spin in the direction they fly
      rotation.angle += Math.sign(velocity.x) * dt;
    }, {priority: 1, id: 'spin'})
    .iterative([Lifetime], (entity, dt, lifetime) => {
      lifetime.seconds -= dt;
      if (lifetime.seconds <= 0) engine.removeEntity(entity);
    }, {priority: 2, id: 'lifetime'})
    .addSystem(new CollisionSystem(split), {priority: 3, id: 'collisions'})
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

  engine.addEntity(new Entity()
    .add(new Position(width / 2, height / 2))
    .add(new Velocity())
    .add(new Rotation(-Math.PI / 2))
    .add(new Collider(SHIP_RADIUS))
    .add(new Ship()));
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

function wrap(value: number, size: number): number {
  return ((value % size) + size) % size;
}
