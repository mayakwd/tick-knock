import {Size} from '../shared/geometry';

export const WIDTH = 480;
export const HEIGHT = 640;
export const SCREEN: Size = {width: WIDTH, height: HEIGHT};

export const PLAYER_SPEED = 260;
export const PLAYER_FOCUS_SPEED = 110;
export const PLAYER_RADIUS = 3;
/**
 * The player can't come closer to the edges of the screen than this distance in pixels
 */
export const PLAYER_EDGE = 12;
export const PLAYER_LIVES = 3;
export const PLAYER_BULLET_SPEED = 700;
export const PLAYER_BULLET_RADIUS = 3;
export const PLAYER_FIRE_INTERVAL = 0.08;
/**
 * Barrels of the gun relative to the center of the player, every barrel fires a bullet
 */
export const PLAYER_GUN_BARRELS: ReadonlyArray<{ readonly x: number; readonly y: number }> = [
  {x: -6, y: -10},
  {x: 6, y: -10},
];
export const INVULNERABILITY_TIME = 2;

export const ENEMY_BULLET_RADIUS = 4;
/**
 * Entities are removed when they leave the screen further than this margin. Enemies appear above the screen closer
 * than the margin, their radius is smaller.
 */
export const SCREEN_MARGIN = 40;
