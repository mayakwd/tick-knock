import {Engine, QueryBuilder} from 'tick-knock';
import {Random} from '../shared/random';
import {Invulnerable, Position, Sway, Velocity} from './components';
import {HEIGHT, PLAYER_LIVES, WIDTH} from './config';
import {Controls} from './Controls';
import {createPlayer} from './entities';
import {EnemyDestroyed, GameOver, PlayerHit} from './messages';
import {
  CollisionSystem,
  EmitterSystem,
  invulnerability,
  leavingScreen,
  movement,
  PlayerControlSystem,
  SpawnSystem,
  swaying,
  WaveState,
} from './systems';
import {ENEMY_BULLET} from './tags';

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
  Emitters: 3,
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

  engine
    .addSystem(new PlayerControlSystem(controls), {priority: Priority.Input, id: 'player-control'})
    .addSystem(new SpawnSystem(waves), {priority: Priority.Spawn, id: 'spawn'})
    .iterative([Position, Velocity], movement, {priority: Priority.Movement, id: 'movement'})
    .iterative([Position, Sway], swaying, {priority: Priority.Movement, id: 'swaying'})
    .addSystem(new EmitterSystem(random), {priority: Priority.Emitters, id: 'emitters'})
    .addSystem(new CollisionSystem(), {priority: Priority.Collisions, id: 'collisions'})
    .iterative([Invulnerable], invulnerability, {priority: Priority.Cleanup, id: 'invulnerability'})
    .iterative([Position, Velocity], leavingScreen(engine), {priority: Priority.Cleanup, id: 'leaving-screen'});

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
