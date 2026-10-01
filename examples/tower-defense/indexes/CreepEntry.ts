import {Entity} from 'tick-knock';
import {Position} from '../../shared/components/Position';
import {DESTROYED} from '../../shared/ecs/tags';
import {Health, PathFollower} from '../components';

/**
 * A creep in the index of creeps with the components systems need, so systems that find creeps don't look them up
 * again. Towers and projectiles keep entries of their targets.
 */
export class CreepEntry {
  public constructor(
    public readonly entity: Entity,
    public readonly position: Position,
    public readonly health: Health,
    public readonly follower: PathFollower,
  ) {}

  /**
   * A creep stays a valid target until it's destroyed: killed or escaped
   */
  public get isAlive(): boolean {
    return !this.entity.has(DESTROYED);
  }
}
