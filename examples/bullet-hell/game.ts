import {Engine, Query, QueryBuilder} from 'tick-knock';
import {Container} from 'pixi.js';
import {Cooldown} from '../shared/Cooldown';
import {CooldownSystem} from '../shared/CooldownSystem';
import {DESTROYED, DestroySystem} from '../shared/DestroySystem';
import {angleTo, isInside} from '../shared/geometry';
import {Random} from '../shared/random';
import {Score} from '../shared/Score';
import {addViews} from '../shared/render/addViews';
import {View} from '../shared/render/View';
import {AimedPattern, Collider, Invulnerable, Lives, Position, RingPattern, SpiralPattern, Sway, Velocity} from './components';
import {HEIGHT, SCREEN, SCREEN_MARGIN, WIDTH} from './config';
import {Controls} from './Controls';
import {createEnemyBullet, createPlayer} from './entities';
import {
  CollisionSystem,
  EnemyHitSystem,
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
  random?: Random;
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

  public constructor({layer, random = Math.random}: BulletHellGameOptions) {
    this.engine.addQuery(this.players).addQuery(this.enemyBullets);

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
      .iterative([Position, RingPattern, Cooldown], (entity, dt, position, ring, cooldown) => {
        while (cooldown.remaining <= 0) {
          this.fireBullets(position, ring.count, ring.speed, random() * Math.PI, Math.PI * 2);
          cooldown.remaining += cooldown.interval;
        }
      })

      .iterative([Position, SpiralPattern, Cooldown], (entity, dt, position, spiral, cooldown) => {
        while (cooldown.remaining <= 0) {
          this.fireBullets(position, spiral.count, spiral.speed, spiral.angle, Math.PI * 2);
          spiral.angle += spiral.step;
          cooldown.remaining += cooldown.interval;
        }
      })

      .iterative([Position, AimedPattern, Cooldown], (entity, dt, position, aimed, cooldown) => {
        // There is nobody to aim at
        const target = this.players.first?.get(Position);
        if (target === undefined) return;

        const from = angleTo(position, target) - aimed.spread / 2;
        while (cooldown.remaining <= 0) {
          this.fireBullets(position, aimed.count, aimed.speed, from, aimed.spread);
          cooldown.remaining += cooldown.interval;
        }
      })

      // Collisions only report hits, and systems of hit entities decide what a hit does
      .addSystem(new CollisionSystem())
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
