import {Pattern} from './components';

export type EnemyKind = 'drone' | 'spinner' | 'turret';

/**
 * Description of an enemy kind. Enemies are data: a new kind needs a new description, not a new system.
 */
export interface EnemyDescription {
  readonly health: number;
  readonly radius: number;
  /**
   * Speed of descending in pixels per second
   */
  readonly speed: number;
  readonly reward: number;
  readonly pattern: Pattern;
  readonly interval: number;
  readonly count: number;
  readonly bulletSpeed: number;
  readonly sway: { amplitude: number; frequency: number };
}

export const ENEMIES: Record<EnemyKind, EnemyDescription> = {
  drone: {
    health: 3, radius: 12, speed: 70, reward: 100,
    pattern: 'aimed', interval: 1.2, count: 3, bulletSpeed: 170,
    sway: {amplitude: 60, frequency: 0.5},
  },
  spinner: {
    health: 12, radius: 16, speed: 35, reward: 300,
    pattern: 'spiral', interval: 0.05, count: 4, bulletSpeed: 110,
    sway: {amplitude: 30, frequency: 0.2},
  },
  turret: {
    health: 25, radius: 22, speed: 20, reward: 500,
    pattern: 'ring', interval: 0.9, count: 36, bulletSpeed: 90,
    sway: {amplitude: 0, frequency: 0},
  },
};

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
    {time: 0, kind: 'turret', x: 0.2},
    {time: 0, kind: 'turret', x: 0.8},
    {time: 1, kind: 'spinner', x: 0.5},
    {time: 3, kind: 'spinner', x: 0.3},
    {time: 3, kind: 'spinner', x: 0.7},
  ],
];
