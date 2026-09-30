export type EnemyKind = 'drone' | 'spinner' | 'turret' | 'warden';

/**
 * Description of an enemy kind. It's a template: the factory turns it into components of the enemy, and systems work
 * with the components. An enemy fires with one pattern, every `fireInterval` seconds.
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
  readonly sway?: { amplitude: number; frequency: number };
  readonly ring?: { count: number; speed: number };
  readonly spiral?: { count: number; speed: number; step: number };
  readonly aimed?: { count: number; speed: number; spread: number };
}

export const ENEMIES: Record<EnemyKind, EnemyDescription> = {
  drone: {
    health: 3, radius: 12, speed: 70, reward: 100, fireInterval: 1.2,
    sway: {amplitude: 60, frequency: 0.5},
    aimed: {count: 3, speed: 170, spread: 0.5},
  },
  spinner: {
    health: 12, radius: 16, speed: 35, reward: 300, fireInterval: 0.05,
    sway: {amplitude: 30, frequency: 0.2},
    spiral: {count: 4, speed: 110, step: 0.35},
  },
  turret: {
    health: 25, radius: 22, speed: 20, reward: 500, fireInterval: 0.9,
    ring: {count: 36, speed: 90},
  },
  // The warden fires wide fans at the player, and sways widely
  warden: {
    health: 40, radius: 26, speed: 15, reward: 1000, fireInterval: 0.6,
    sway: {amplitude: 80, frequency: 0.1},
    aimed: {count: 9, speed: 160, spread: 1.2},
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
