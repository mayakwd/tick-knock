import {Cell} from '../map';
import {TowerKind} from '../towers';

/**
 * What the tower is: its kind, cell and level. Characteristics of the tower are separate components.
 */
export class Tower {
  public constructor(
    public readonly kind: TowerKind,
    public readonly cell: Cell,
    /**
     * Index of the level in the description of the tower kind, starting from 0
     */
    public readonly level: number,
  ) {}
}
