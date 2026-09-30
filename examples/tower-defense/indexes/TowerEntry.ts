import {Entity} from 'tick-knock';
import {Tower} from '../components';

/**
 * A tower in the index of towers. An upgrade replaces the `Tower`, and the entry is replaced with it.
 */
export class TowerEntry {
  public constructor(public readonly entity: Entity, public readonly tower: Tower) {}
}
