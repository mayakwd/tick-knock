import {AimedPattern, RingPattern, SpiralPattern} from './components';

export type EnemyKind = 'drone' | 'spinner' | 'turret' | 'warden';

/**
 * Pattern of firing of an enemy. Patterns are components, and an enemy fires with the one it has.
 */
export type Pattern = RingPattern | SpiralPattern | AimedPattern;

/**
 * Description of an enemy kind. It's a template: the factory turns it into components of the enemy, and systems work
 * with the components. An enemy fires with its pattern every `fireInterval` seconds.
 */
export interface EnemyDescription {
  readonly health: number;
  readonly radius: number;
  /**
   * Speed of descending in pixels per second
   */
  readonly speed: number;
  readonly reward: number;
  /**
   * Time in seconds between shots
   */
  readonly fireInterval: number;
  /**
   * The pattern doesn't change, so all enemies of the kind share it
   */
  readonly pattern: Pattern;
  readonly sway?: SwayDescription;
}

export interface SwayDescription {
  readonly amplitude: number;
  readonly frequency: number;
}

export const ENEMIES: Record<EnemyKind, EnemyDescription> = {
  drone: {
    health: 3, radius: 12, speed: 70, reward: 100, fireInterval: 1.2,
    pattern: new AimedPattern(3, 170, 0.5),
    sway: {amplitude: 60, frequency: 0.5},
  },
  spinner: {
    health: 12, radius: 16, speed: 35, reward: 300, fireInterval: 0.05,
    pattern: new SpiralPattern(4, 110, 0.35),
    sway: {amplitude: 30, frequency: 0.2},
  },
  turret: {
    health: 25, radius: 22, speed: 20, reward: 500, fireInterval: 0.9,
    pattern: new RingPattern(36, 90),
  },
  // The warden fires wide fans at the player, and sways widely
  warden: {
    health: 40, radius: 26, speed: 15, reward: 1000, fireInterval: 0.6,
    pattern: new AimedPattern(9, 160, 1.2),
    sway: {amplitude: 80, frequency: 0.1},
  },
};

/**
 * The largest radius of an enemy
 */
export const MAX_ENEMY_RADIUS = Math.max(...Object.values(ENEMIES).map(({radius}) => radius));

/**
 * Enemy appearing in a wave
 */
export interface Spawn {
  /**
   * Time in seconds since the start of the wave
   */
  readonly time: number;
  readonly kind: EnemyKind;
  /**
   * Horizontal position relative to the width of the screen, from 0 to 1
   */
  readonly x: number;
}

/**
 * Waves of enemies. When the last wave is over, waves repeat with stronger enemies.
 */
export const WAVES: ReadonlyArray<ReadonlyArray<Spawn>> = [
  [
    {time: 0, kind: 'drone', x: 0.25},
    {time: 0.6, kind: 'drone', x: 0.5},
    {time: 1.2, kind: 'drone', x: 0.75},
    {time: 3, kind: 'drone', x: 0.35},
    {time: 3.4, kind: 'drone', x: 0.65},
  ],
  [
    {time: 0, kind: 'spinner', x: 0.5},
    {time: 2, kind: 'drone', x: 0.2},
    {time: 2.5, kind: 'drone', x: 0.8},
  ],
  [
    {time: 0, kind: 'turret', x: 0.3},
    {time: 0, kind: 'turret', x: 0.7},
    {time: 3, kind: 'drone', x: 0.5},
  ],
  [
    {time: 0, kind: 'spinner', x: 0.25},
    {time: 0, kind: 'spinner', x: 0.75},
    {time: 2, kind: 'turret', x: 0.5},
    {time: 4, kind: 'drone', x: 0.3},
    {time: 4, kind: 'drone', x: 0.7},
  ],
  [
    {time: 0, kind: 'warden', x: 0.5},
    {time: 4, kind: 'drone', x: 0.2},
    {time: 4, kind: 'drone', x: 0.8},
  ],
  [
    {time: 0, kind: 'turret', x: 0.2},
    {time: 0, kind: 'turret', x: 0.8},
    {time: 1, kind: 'spinner', x: 0.5},
    {time: 3, kind: 'warden', x: 0.5},
  ],
];
