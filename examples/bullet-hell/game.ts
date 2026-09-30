import {Engine, Query, QueryBuilder} from 'tick-knock';
import {Container} from 'pixi.js';
import {Cooldown} from '../shared/Cooldown';
import {CooldownSystem} from '../shared/CooldownSystem';
import {DESTROYED, DestroySystem} from '../shared/DestroySystem';
import {angleTo, isInside} from '../shared/geometry';
import {Score} from '../shared/Score';
import {addViews} from '../shared/render/addViews';
import {View} from '../shared/render/View';
import {
  AimedPattern,
  Barrel,
  Collider,
  Invulnerable,
  Lives,
  Position,
  RingPattern,
  SpiralPattern,
  Sway,
  Velocity,
} from './components';
import {HEIGHT, SCREEN, SCREEN_MARGIN, WIDTH} from './config';
import {Controls} from './Controls';
import {createEnemyBullet, createPlayer} from './entities';
import {ColliderTree} from './ColliderTree';
import {
  ColliderTreeSystem,
  EnemyHitSystem,
  PlayerBulletCollisionSystem,
  PlayerCollisionSystem,
  PlayerControlSystem,
  PlayerHitSystem,
  SpawnSystem,
  WaveState,
} from './systems';
import {ENEMY_BULLET, PLAYER, REMOVED_OFFSCREEN} from './tags';

/**
 * Blinks per second of the invulnerable player
 */
const BLINK_RATE = 8;

export interface BulletHellGameOptions {
  /**
   * Layer views of entities are added to
   */
  layer: Container;
}

/**
 * Bullet hell: the engine with all systems. It doesn't read input, so it runs in the browser and in tests as is.
 */
export class BulletHellGame {
  public readonly engine = new Engine();
  public readonly controls = new Controls();
  private readonly waves = new WaveState();
  private readonly players: Query<[Position, Lives]> = new QueryBuilder().contains(Position, Lives, PLAYER).build();
  private readonly enemyBullets = new QueryBuilder().contains(ENEMY_BULLET).build();
  private readonly _score = new Score();

  public constructor({layer}: BulletHellGameOptions) {
    this.engine.addQuery(this.players).addQuery(this.enemyBullets);

    // Entities with colliders at their positions, collisions look for entities near bullets and the player in it
    const colliders = new ColliderTree();

    // A destroyed entity stops colliding right away, and is removed from the engine after the update
    this.engine
      .reactive([Collider, DESTROYED], {added: ({current}) => current.remove(Collider)})
      .addSystem(new DestroySystem());

    this.engine
      // Cooldowns are counted down, the player moves and fires, and new enemies appear
      .addSystem(new CooldownSystem())
      .addSystem(new PlayerControlSystem(this.controls))
      .addSystem(new SpawnSystem(this.waves))

      // Everything that has a velocity moves
      .iterative([Position, Velocity], (entity, dt, position, velocity) => {
        position.x += velocity.x * dt;
        position.y += velocity.y * dt;
      })

      // The swing is added to the position, so it works together with the movement
      .iterative([Position, Sway], (entity, dt, position, sway) => {
        sway.time += dt;
        const offset = Math.sin(sway.time * sway.frequency * Math.PI * 2) * sway.amplitude;
        position.x += offset - sway.offset;
        sway.offset = offset;
      })

      // Every pattern is a component with its own system. An enemy fires, when its cooldown is over. A cooldown can be
      // over several times in one update, then the enemy fires several times.
      .iterative([Position, RingPattern, Barrel, Cooldown], (entity, dt, position, ring, barrel, cooldown) => {
        while (cooldown.remaining <= 0) {
          this.fireBullets(position, ring.count, ring.speed, barrel.angle, Math.PI * 2);
          barrel.angle += Math.PI / ring.count;
          cooldown.remaining += cooldown.interval;
        }
      })

      .iterative([Position, SpiralPattern, Barrel, Cooldown], (entity, dt, position, spiral, barrel, cooldown) => {
        while (cooldown.remaining <= 0) {
          this.fireBullets(position, spiral.count, spiral.speed, barrel.angle, Math.PI * 2);
          barrel.angle += spiral.step;
          cooldown.remaining += cooldown.interval;
        }
      })

      .iterative([Position, AimedPattern, Barrel, Cooldown], (entity, dt, position, aimed, barrel, cooldown) => {
        // There is nobody to aim at
        const target = this.players.first?.get(Position);
        if (target === undefined) return;

        barrel.angle = angleTo(position, target);
        while (cooldown.remaining <= 0) {
          this.fireBullets(position, aimed.count, aimed.speed, barrel.angle - aimed.spread / 2, aimed.spread);
          cooldown.remaining += cooldown.interval;
        }
      })

      // Collisions are checked after everything has moved: entities are moved in the tree of colliders, and bullets of
      // the player and the player look for what they touch. Collisions only report hits, and systems of hit entities
      // decide what a hit does.
      .addSystem(new ColliderTreeSystem(colliders))
      .addSystem(new PlayerBulletCollisionSystem(colliders))
      .addSystem(new PlayerCollisionSystem(colliders))
      .addSystem(new EnemyHitSystem(this._score))
      .addSystem(new PlayerHitSystem())

      // Invulnerability is over when the component is removed
      .iterative([Invulnerable], (entity, dt, invulnerable) => {
        invulnerable.seconds -= dt;
        if (invulnerable.seconds <= 0) entity.remove(Invulnerable);
      })

      // Bullets and enemies are destroyed when they leave the screen
      .iterative([Position, REMOVED_OFFSCREEN], (entity, dt, position) => {
        if (!isInside(position, SCREEN, SCREEN_MARGIN)) entity.add(DESTROYED);
      })

      // A hit player becomes invulnerable, and the screen is cleared from enemy bullets, so the player has a chance
      // to recover
      .reactive([Invulnerable, PLAYER], {
        added: () => this.enemyBullets.forEach((bullet) => bullet.add(DESTROYED)),
      });

    // Views follow positions of entities after all game systems
    addViews(this.engine, layer, {position: Position});

    // The invulnerable player blinks, and becomes solid when the component is removed
    this.engine
      .iterative([View, Invulnerable], (entity, dt, {display}, {seconds}) => {
        display.alpha = Math.floor(seconds * BLINK_RATE) % 2 === 0 ? 1 : 0.3;
      })
      .reactive([View, Invulnerable], {
        removed: (snapshot, {display}) => {
          display.alpha = 1;
        },
      });

    this.engine.addEntity(createPlayer(WIDTH / 2, HEIGHT - 80));
  }

  public get score(): number {
    return this._score.points;
  }

  public get wave(): number {
    return this.waves.number;
  }

  /**
   * Lives belong to the player, the game only reads them
   */
  public get lives(): number {
    return this.players.first?.get(Lives)?.count ?? 0;
  }

  /**
   * Amount of enemy bullets on the screen
   */
  public get bullets(): number {
    return this.enemyBullets.length;
  }

  /**
   * The game is over when the player is destroyed, and removed from the engine
   */
  public get isOver(): boolean {
    return this.players.isEmpty;
  }

  /**
   * Advances the game
   * @param dt Delta time in seconds
   */
  public update(dt: number): void {
    if (!this.isOver) this.engine.update(dt);
  }

  /**
   * Fires bullets from the position, spread evenly over the arc
   * @param from Direction of the first bullet in radians
   * @param arc Width of the arc in radians, a full circle doesn't repeat the first direction at the end
   */
  private fireBullets({x, y}: Position, count: number, speed: number, from: number, arc: number): void {
    const isCircle = arc >= Math.PI * 2;
    const step = count > 1 ? arc / (isCircle ? count : count - 1) : 0;
    for (let i = 0; i < count; i++) {
      this.engine.addEntity(createEnemyBullet(x, y, from + step * i, speed));
    }
  }
}
