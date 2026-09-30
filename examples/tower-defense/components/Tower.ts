import {Cell} from '../map';
import {TowerKind} from '../towers';

export class Tower {
  /**
   * Time in seconds until the tower can fire again
   */
  public cooldown: number = 0;

  public constructor(public readonly kind: TowerKind, public readonly cell: Cell) {}
}
