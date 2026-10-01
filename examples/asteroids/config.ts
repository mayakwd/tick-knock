export const WIDTH = 800;
export const HEIGHT = 600;

export const SHIP_RADIUS = 12;
/**
 * Turn speed of the ship in radians per second
 */
export const TURN_SPEED = 4;
/**
 * Acceleration of the ship in pixels per second squared
 */
export const THRUST = 250;
/**
 * Share of the speed the ship loses every second
 */
export const DRAG = 0.6;
export const FIRE_INTERVAL = 0.2;

export const BULLET_SPEED = 450;
export const BULLET_LIFETIME = 1;
export const BULLET_RADIUS = 2;

export type AsteroidSize = 1 | 2 | 3;

/**
 * Asteroids by their size: a destroyed asteroid splits into two asteroids of the smaller size
 */
export const ASTEROIDS: Readonly<Record<AsteroidSize, { readonly radius: number; readonly points: number }>> = {
  1: {radius: 12, points: 20},
  2: {radius: 24, points: 50},
  3: {radius: 40, points: 100},
};
/**
 * Speed of asteroids in pixels per second: the minimal one, and the random part, which grows for smaller asteroids
 */
export const ASTEROID_SPEED = {min: 30, random: 40};
/**
 * Asteroids spin in the direction they fly, up to this speed in radians per second
 */
export const ASTEROID_SPIN = 1;
/**
 * Amount of vertices of the outline of an asteroid
 */
export const ASTEROID_VERTICES = 10;
