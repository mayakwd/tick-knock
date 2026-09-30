import {EntitySnapshot, ReactionSystem, without} from 'tick-knock';
import {Cell} from '../../shared/components/Cell';
import {GridIndex} from '../../shared/indexes/GridIndex';
import {DESTROYED} from '../../shared/ecs/tags';
import {Tower} from '../components';
import {TowerEntry} from '../indexes/TowerEntry';

/**
 * Keeps the index of towers up to date, so the tower in a cell is found with a lookup. An upgrade replaces the `Tower`,
 * so the entry is replaced too.
 */
export class TowerIndexSystem extends ReactionSystem.of(Cell, Tower, without(DESTROYED)) {
  public constructor(private readonly towers: GridIndex<TowerEntry>) {
    super();
  }

  protected entityAdded = ({current}: EntitySnapshot, cell: Cell, tower: Tower): void => {
    this.towers.add(cell, new TowerEntry(current, tower));
  };

  protected entityRemoved = ({current}: EntitySnapshot, cell: Cell): void => {
    this.towers.remove(cell, current);
  };
}
