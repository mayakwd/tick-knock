import {Engine, QueryBuilder} from 'tick-knock';
import {Random} from '../shared/random';
import {AimedPattern, Invulnerable, Position, RingPattern, SpiralPattern, Sway, Velocity} from './components';
import {HEIGHT, PLAYER_LIVES, SCREEN_MARGIN, WIDTH} from './config';
import {Controls} from './Controls';
import {createEnemyBullet, createPlayer} from './entities';
import {EnemyDestroyed, GameOver, PlayerHit} from './messages';
import {CollisionSystem, PlayerControlSystem, SpawnSystem, WaveState} from './systems';
import {ENEMY_BULLET, PLAYER} from './tags';

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
  Cleanup: 5,
  Render: 100,
} as const;

export function createBulletHellGame({random = Math.random, setup}: BulletHellGameOptions = {}): BulletHellGame {
  const engine = new Engine();
  const controls: Controls = {left: false, right: false, up: false, down: false, focus: false, fire: false};
  const waves: WaveState = {number: 1};
  let score = 0;
  let lives = PLAYER_LIVES;
  let isOver = false;

  const players = new QueryBuilder().contains(Position, PLAYER).build();
  engine.addQuery(players);

  /**
   * Fires `count` bullets from the position, spread evenly over the arc
   * @param from Direction of the first bullet in radians
   * @param arc Width of the arc in radians, a full circle doesn't repeat the first direction at the end
   */
  const fire = ({x, y}: Position, count: number, speed: number, from: number, arc: number) => {
    const isCircle = arc >= Math.PI * 2;
    const step = count > 1 ? arc / (isCircle ? count : count - 1) : 0;
    for (let i = 0; i < count; i++) {
      engine.addEntity(createEnemyBullet(x, y, from + step * i, speed));
    }
  };

  // #region systems
  engine
    .addSystem(new PlayerControlSystem(controls), {priority: Priority.Input, id: 'player-control'})
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
    // Every pattern is a component with its own system, so an enemy fires with every pattern it has
    .iterative([Position, RingPattern], (entity, dt, position, ring) => {
      if (!isReady(ring, dt)) return;
      fire(position, ring.count, ring.speed, random() * Math.PI, Math.PI * 2);
    }, {priority: Priority.Firing, id: 'ring-pattern'})
    .iterative([Position, SpiralPattern], (entity, dt, position, spiral) => {
      if (!isReady(spiral, dt)) return;
      fire(position, spiral.count, spiral.speed, spiral.angle, Math.PI * 2);
      spiral.angle += spiral.step;
    }, {priority: Priority.Firing, id: 'spiral-pattern'})
    .iterative([Position, AimedPattern], (entity, dt, position, aimed) => {
      const target = players.first?.get(Position);
      if (!isReady(aimed, dt) || target === undefined) return;
      const angle = Math.atan2(target.y - position.y, target.x - position.x);
      fire(position, aimed.count, aimed.speed, angle - aimed.spread / 2, aimed.spread);
    }, {priority: Priority.Firing, id: 'aimed-pattern'})
    .addSystem(new CollisionSystem(), {priority: Priority.Collisions, id: 'collisions'})
    // Invulnerability is over when the component is removed
    .iterative([Invulnerable], (entity, dt, invulnerable) => {
      invulnerable.seconds -= dt;
      if (invulnerable.seconds <= 0) entity.remove(Invulnerable);
    }, {priority: Priority.Cleanup, id: 'invulnerability'})
    // Bullets and enemies are removed when they leave the screen
    .iterative([Position, Velocity], (entity, dt, {x, y}) => {
      if (x < -SCREEN_MARGIN || x > WIDTH + SCREEN_MARGIN || y < -SCREEN_MARGIN || y > HEIGHT + SCREEN_MARGIN) {
        engine.removeEntity(entity);
      }
    }, {priority: Priority.Cleanup, id: 'leaving-screen'});
  // #endregion systems

  engine.subscribe(EnemyDestroyed, ({points}) => {
    score += points;
  });
  // A hit clears the screen from enemy bullets, so the player has a chance to recover
  const enemyBullets = new QueryBuilder().contains(ENEMY_BULLET).build();
  engine.addQuery(enemyBullets);
  engine.subscribe(PlayerHit, ({livesLeft}) => {
    lives = livesLeft;
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
    get lives() {
      return lives;
    },
    get isOver() {
      return isOver;
    },
    update(dt: number) {
      if (!isOver) engine.update(dt);
    },
  };
}

/**
 * Counts down the cooldown of a pattern
 * @returns true if the pattern fires in this update
 */
function isReady(pattern: {cooldown: number; readonly interval: number}, dt: number): boolean {
  pattern.cooldown -= dt;
  if (pattern.cooldown > 0) return false;
  pattern.cooldown += pattern.interval;
  return true;
}
