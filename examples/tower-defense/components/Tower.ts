import {TowerKind} from '../towers';

/**
 * What the tower is: its kind and level. Its cell and characteristics are separate components.
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
