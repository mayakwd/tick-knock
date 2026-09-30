import {TowerKind} from '../data/towers';

/**
 * What the tower is: its kind and level. It's immutable: an upgrade gives the tower a new `Tower`, and the tower gets
 * components of the new level. Its cell and characteristics are separate components.
 */
export class Tower {
  public constructor(
    public readonly kind: TowerKind,
    /**
     * Index of the level in the description of the tower kind, starting from 0
     */
    public readonly level: number,
  ) {}
}
