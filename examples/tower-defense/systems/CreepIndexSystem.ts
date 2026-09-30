import {EntitySnapshot, ReactionSystem, without} from 'tick-knock';
import {Cell} from '../../shared/components/Cell';
import {Position} from '../../shared/components/Position';
import {DESTROYED} from '../../shared/ecs/tags';
import {Health, PathFollower} from '../components';
import {CreepEntry} from '../indexes/CreepEntry';
import {CreepIndex} from '../indexes/CreepIndex';
import {CREEP} from '../tags';

/**
 * Keeps the index of creeps up to date. A creep crossing into another cell gets a new `Cell`, so it leaves the previous
 * cell and enters the next one. A destroyed creep leaves the index right away, so it's not a target anymore, and can't
 * be hit once again.
 */
export class CreepIndexSystem extends ReactionSystem.of(
  Cell, Position, Health, PathFollower, CREEP, without(DESTROYED),
) {
  public constructor(private readonly creeps: CreepIndex) {
    super();
  }

  protected entityAdded = (
    {current}: EntitySnapshot,
    cell: Cell,
    position: Position,
    health: Health,
    follower: PathFollower,
  ): void => {
    this.creeps.add(cell, new CreepEntry(current, position, health, follower));
  };

  protected entityRemoved = ({current}: EntitySnapshot, cell: Cell): void => {
    this.creeps.remove(cell, current);
  };
}
