import {EnemyKind} from '../enemies';

/**
 * Marks the entity as an enemy and keeps its kind, so rendering can draw every kind differently
 */
export class Enemy {
  public constructor(public readonly kind: EnemyKind) {}
}
