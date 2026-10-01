/**
 * The entity is out of the game. Systems destroy entities by adding the tag, and don't remove them themselves:
 * the entity stays in the engine until the end of the update, so reaction systems can handle its destruction, for
 * example give a reward or split an asteroid. `DestroySystem` removes it after the update.
 *
 * Indexes exclude it with `without(DESTROYED)`, so a destroyed entity can't be found, hit or killed once again.
 */
export const DESTROYED = 'destroyed';

/**
 * The player has defeated the entity: shot, killed or eaten it. It's always added together with `DESTROYED`, and
 * rewards react to it. Entities that are destroyed for other reasons, like leaving the screen, don't get it.
 */
export const KILLED = 'killed';
