import {Engine, QueryBuilder} from 'tick-knock';
import {angleTo, clamp, isInside} from '../shared/geometry';
import {Random} from '../shared/random';
import {
  AimedPattern,
  Enemy,
  Gun,
  Health,
  Hit,
  Invulnerable,
  Lives,
  Position,
  Reward,
  RingPattern,
  SpiralPattern,
  Sway,
  Velocity,
} from './components';
import {
  HEIGHT,
  INVULNERABILITY_TIME,
  PLAYER_EDGE,
  PLAYER_FOCUS_SPEED,
  PLAYER_GUN_BARRELS,
  PLAYER_SPEED,
  SCREEN,
  SCREEN_MARGIN,
  WIDTH,
} from './config';
import {Controls} from './Controls';
import {createEnemyBullet, createPlayer, createPlayerBullet, destroy} from './entities';
import {EnemyDestroyed, GameOver, PlayerHit} from './messages';
import {CollisionSystem, SpawnSystem, WaveState} from './systems';
import {ENEMY_BULLET, PLAYER, REMOVED_OFFSCREEN} from './tags';

export interface BulletHellGameOptions {
  random?: Random;
  /**
   * Adds systems of the host, for example rendering. It's called before the first entities are created,
   * so reaction systems of the host receive all entities.
   */
  setup?: (engine: Engine) => void;
}

/**
 * Bullet hell without rendering and input
 */
export interface BulletHellGame {
  readonly engine: Engine;
  readonly controls: Controls;
  readonly score: number;
  readonly wave: number;
  readonly lives: number;
  /**
   * Amount of enemy bullets on the screen
   */
  readonly enemyBullets: number;
  readonly isOver: boolean;

  /**
   * Advances the game
   * @param dt Delta time in seconds
   */
  update(dt: number): void;
}

export const Priority = {
  Input: 0,
  Spawn: 1,
  Movement: 2,
  Firing: 3,
  Collisions: 4,
  Hits: 5,
  Cleanup: 6,
  Render: 100,
} as const;

export function createBulletHellGame({random = Math.random, setup}: BulletHellGameOptions = {}): BulletHellGame {
  const engine = new Engine();
  const controls: Controls = {left: false, right: false, up: false, down: false, focus: false, fire: false};
  const waves: WaveState = {number: 1};
  let score = 0;
  let isOver = false;

  const players = new QueryBuilder().contains(Position, Lives, PLAYER).build();
  engine.addQuery(players);

  /**
   * Fires `count` bullets from the position, spread evenly over the arc
   * @param from Direction of the first bullet in radians
   * @param arc Width of the arc in radians, a full circle doesn't repeat the first direction at the end
   */
  const fireBullets = ({x, y}: Position, count: number, speed: number, from: number, arc: number) => {
    const isCircle = arc >= Math.PI * 2;
    const step = count > 1 ? arc / (isCircle ? count : count - 1) : 0;
    for (let i = 0; i < count; i++) {
      engine.addEntity(createEnemyBullet(x, y, from + step * i, speed));
    }
  };

  // #region systems
  engine
    // The player moves and fires according to the controls
    .iterative([Position, Gun, PLAYER], (player, dt, position, gun) => {
      const {left, right, up, down, focus, fire} = controls;
      const dx = Number(right) - Number(left);
      const dy = Number(down) - Number(up);
      // Diagonal movement is not faster than straight one
      const length = Math.hypot(dx, dy) || 1;
      const step = (focus ? PLAYER_FOCUS_SPEED : PLAYER_SPEED) * dt / length;
      position.x = clamp(position.x + dx * step, PLAYER_EDGE, WIDTH - PLAYER_EDGE);
      position.y = clamp(position.y + dy * step, PLAYER_EDGE, HEIGHT - PLAYER_EDGE);

      gun.cooldown.tick(dt);
      if (!fire || !gun.cooldown.isReady) return;
      gun.cooldown.restart();
      for (const barrel of PLAYER_GUN_BARRELS) {
        engine.addEntity(createPlayerBullet(position.x + barrel.x, position.y + barrel.y));
      }
    }, {priority: Priority.Input, id: 'player-control'})
    .addSystem(new SpawnSystem(waves), {priority: Priority.Spawn, id: 'spawn'})
    // Everything that has a velocity moves
    .iterative([Position, Velocity], (entity, dt, position, velocity) => {
      position.x += velocity.x * dt;
      position.y += velocity.y * dt;
    }, {priority: Priority.Movement, id: 'movement'})
    // The swing is added to the position, so it works together with the movement
    .iterative([Position, Sway], (entity, dt, position, sway) => {
      sway.time += dt;
      const offset = Math.sin(sway.time * sway.frequency * Math.PI * 2) * sway.amplitude;
      position.x += offset - sway.offset;
      sway.offset = offset;
    }, {priority: Priority.Movement, id: 'swaying'})
    // Every pattern is a component with its own system, so an enemy fires with every pattern it has.
    // A cooldown can be over several times in one update, then the pattern fires several times.
    .iterative([Position, RingPattern], (entity, dt, position, ring) => {
      ring.cooldown.repeat(dt, () => fireBullets(position, ring.count, ring.speed, random() * Math.PI, Math.PI * 2));
    }, {priority: Priority.Firing, id: 'ring-pattern'})
    .iterative([Position, SpiralPattern], (entity, dt, position, spiral) => {
      spiral.cooldown.repeat(dt, () => {
        fireBullets(position, spiral.count, spiral.speed, spiral.angle, Math.PI * 2);
        spiral.angle += spiral.step;
      });
    }, {priority: Priority.Firing, id: 'spiral-pattern'})
    .iterative([Position, AimedPattern], (entity, dt, position, aimed) => {
      const target = players.first?.get(Position);
      if (target === undefined) return;
      aimed.cooldown.repeat(dt, () => {
        fireBullets(position, aimed.count, aimed.speed, angleTo(position, target) - aimed.spread / 2, aimed.spread);
      });
    }, {priority: Priority.Firing, id: 'aimed-pattern'})
    .addSystem(new CollisionSystem(), {priority: Priority.Collisions, id: 'collisions'})
    // Every hit takes one point of health of an enemy
    .iterative([Hit, Health, Reward, Enemy], (enemy, dt, hit, health, {points}) => {
      health.value -= enemy.lengthOf(Hit);
      enemy.remove(Hit);
      if (health.value > 0) return;
      destroy(engine, enemy);
      engine.dispatch(new EnemyDestroyed(points));
    }, {priority: Priority.Hits, id: 'enemy-hits'})
    // The player loses one life, even if several things have hit it at once, and becomes invulnerable for a while
    .iterative([Hit, Lives, PLAYER], (player, dt, hit, lives) => {
      player.remove(Hit);
      lives.count--;
      engine.dispatch(new PlayerHit());
      if (lives.count > 0) {
        player.add(new Invulnerable(INVULNERABILITY_TIME));
        return;
      }
      destroy(engine, player);
      engine.dispatch(new GameOver());
    }, {priority: Priority.Hits, id: 'player-hits'})
    // Invulnerability is over when the component is removed
    .iterative([Invulnerable], (entity, dt, invulnerable) => {
      invulnerable.seconds -= dt;
      if (invulnerable.seconds <= 0) entity.remove(Invulnerable);
    }, {priority: Priority.Cleanup, id: 'invulnerability'})
    // Bullets and enemies are removed when they leave the screen
    .iterative([Position, REMOVED_OFFSCREEN], (entity, dt, position) => {
      if (!isInside(position, SCREEN, SCREEN_MARGIN)) engine.removeEntity(entity);
    }, {priority: Priority.Cleanup, id: 'leaving-screen'});
  // #endregion systems

  engine.subscribe(EnemyDestroyed, ({points}) => {
    score += points;
  });
  // A hit clears the screen from enemy bullets, so the player has a chance to recover
  const enemyBullets = new QueryBuilder().contains(ENEMY_BULLET).build();
  engine.addQuery(enemyBullets);
  engine.subscribe(PlayerHit, () => {
    enemyBullets.forEach((bullet) => engine.removeEntity(bullet));
  });
  engine.subscribe(GameOver, () => {
    isOver = true;
  });

  setup?.(engine);
  engine.addEntity(createPlayer(WIDTH / 2, HEIGHT - 80));

  return {
    engine,
    controls,
    get score() {
      return score;
    },
    get wave() {
      return waves.number;
    },
    // Lives belong to the player, the game only reads them
    get lives() {
      return players.first?.get(Lives)?.count ?? 0;
    },
    get enemyBullets() {
      return enemyBullets.length;
    },
    get isOver() {
      return isOver;
    },
    update(dt: number) {
      if (!isOver) engine.update(dt);
    },
  };
}
