export const PLAYER = 'player';
/**
 * Bullets of the player and of enemies collide with different entities, so they are marked with different tags
 */
export const PLAYER_BULLET = 'player-bullet';
export const ENEMY_BULLET = 'enemy-bullet';
/**
 * Entities with this tag are removed when they leave the screen: bullets and enemies, but not the player
 */
export const REMOVED_OFFSCREEN = 'removed-offscreen';
