import {Engine, Query, QueryBuilder} from 'tick-knock';
import {Container} from 'pixi.js';
import {angleTo, isInside} from '../shared/geometry';
import {Random} from '../shared/random';
import {addViews} from '../shared/render/addViews';
import {View} from '../shared/render/View';
import {AimedPattern, Invulnerable, Lives, Position, RingPattern, SpiralPattern, Sway, Velocity} from './components';
import {HEIGHT, SCREEN, SCREEN_MARGIN, WIDTH} from './config';
import {Controls} from './Controls';
import {createEnemyBullet, createPlayer} from './entities';
import {EnemyDestroyed, GameOver, PlayerHit} from './messages';
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
  private _score = 0;
  private _isOver = false;

  public constructor({layer, random = Math.random}: BulletHellGameOptions) {
    this.engine.addQuery(this.players).addQuery(this.enemyBullets);

    // #region systems
    this.engine
      // The player moves and fires first, and new enemies appear
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

      // Every pattern is a component with its own system, so an enemy fires with every pattern it has.
      // A cooldown can be over several times in one update, then the pattern fires several times.
      .iterative([Position, RingPattern], (entity, dt, position, ring) => {
        ring.cooldown.repeat(dt, () => {
          this.fireBullets(position, ring.count, ring.speed, random() * Math.PI, Math.PI * 2);
        });
      })

      .iterative([Position, SpiralPattern], (entity, dt, position, spiral) => {
        spiral.cooldown.repeat(dt, () => {
          this.fireBullets(position, spiral.count, spiral.speed, spiral.angle, Math.PI * 2);
          spiral.angle += spiral.step;
        });
      })

      .iterative([Position, AimedPattern], (entity, dt, position, aimed) => {
        // There is nobody to aim at
        const target = this.players.first?.get(Position);
        if (target === undefined) return;

        aimed.cooldown.repeat(dt, () => {
          const from = angleTo(position, target) - aimed.spread / 2;
          this.fireBullets(position, aimed.count, aimed.speed, from, aimed.spread);
        });
      })

      // Collisions only report hits, and systems of hit entities decide what a hit does
      .addSystem(new CollisionSystem())
      .addSystem(new EnemyHitSystem())
      .addSystem(new PlayerHitSystem())

      // Invulnerability is over when the component is removed
      .iterative([Invulnerable], (entity, dt, invulnerable) => {
        invulnerable.seconds -= dt;
        if (invulnerable.seconds <= 0) entity.remove(Invulnerable);
      })

      // Bullets and enemies are removed when they leave the screen
      .iterative([Position, REMOVED_OFFSCREEN], (entity, dt, position) => {
        if (!isInside(position, SCREEN, SCREEN_MARGIN)) this.engine.removeEntity(entity);
      });
    // #endregion systems

    // #region views
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
    // #endregion views

    // #region messages
    this.engine.subscribe(EnemyDestroyed, ({points}) => {
      this._score += points;
    });

    // A hit clears the screen from enemy bullets, so the player has a chance to recover
    this.engine.subscribe(PlayerHit, () => {
      this.enemyBullets.forEach((bullet) => this.engine.removeEntity(bullet));
    });

    this.engine.subscribe(GameOver, () => {
      this._isOver = true;
    });
    // #endregion messages

    this.engine.addEntity(createPlayer(WIDTH / 2, HEIGHT - 80));
  }

  public get score(): number {
    return this._score;
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

  public get isOver(): boolean {
    return this._isOver;
  }

  /**
   * Advances the game
   * @param dt Delta time in seconds
   */
  public update(dt: number): void {
    if (!this._isOver) this.engine.update(dt);
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
