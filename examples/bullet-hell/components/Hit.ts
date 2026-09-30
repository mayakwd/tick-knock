import {LinkedComponent} from 'tick-knock';

/**
 * A hit the entity has taken in this update. The collision system only reports hits, and systems of the entity
 * decide what a hit does. An entity can be hit several times in one update, so hits are linked components.
 */
export class Hit extends LinkedComponent {}
