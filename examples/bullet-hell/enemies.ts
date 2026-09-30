export type EnemyKind = 'drone' | 'spinner' | 'turret' | 'warden';

/**
 * Description of an enemy kind. It's a template: the factory turns it into components of the enemy, and systems work
 * with the components. An enemy fires with every pattern it has, so kinds of enemies are combinations of patterns.
 */
export interface EnemyDescription {
  readonly health: number;
  readonly radius: number;
  /**
   * Speed of descending in pixels per second
   */
  readonly speed: number;
  readonly reward: number;
  readonly sway?: { amplitude: number; frequency: number };
  readonly ring?: { interval: number; count: number; speed: number };
  readonly spiral?: { interval: number; count: number; speed: number; step: number };
  readonly aimed?: { interval: number; count: number; speed: number; spread: number };
}

export const ENEMIES: Record<EnemyKind, EnemyDescription> = {
  drone: {
    health: 3, radius: 12, speed: 70, reward: 100,
    sway: {amplitude: 60, frequency: 0.5},
    aimed: {interval: 1.2, count: 3, speed: 170, spread: 0.5},
  },
  spinner: {
    health: 12, radius: 16, speed: 35, reward: 300,
    sway: {amplitude: 30, frequency: 0.2},
    spiral: {interval: 0.05, count: 4, speed: 110, step: 0.35},
  },
  turret: {
    health: 25, radius: 22, speed: 20, reward: 500,
    ring: {interval: 0.9, count: 36, speed: 90},
  },
  // The warden combines two patterns: a slow spiral and fans aimed at the player
  warden: {
    health: 40, radius: 26, speed: 15, reward: 1000,
    sway: {amplitude: 80, frequency: 0.1},
    spiral: {interval: 0.12, count: 3, speed: 100, step: 0.25},
    aimed: {interval: 1.5, count: 5, speed: 180, spread: 0.7},
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
