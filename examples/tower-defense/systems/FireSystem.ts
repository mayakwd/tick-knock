import {Entity, IterativeSystem} from 'tick-knock';
import {Cooldown} from '../../shared/components/Cooldown';
import {Position} from '../../shared/components/Position';
import {Payload, Target, Tower, Weapon} from '../components';
import {createProjectile} from '../entities';

/**
 * A tower with a target fires every time its cooldown is over. A tower without a target is not in the query, so its
 * cooldown stays ready, and it fires as soon as it gets a target.
 */
export class FireSystem extends IterativeSystem.of(Position, Tower, Weapon, Target, Payload, Cooldown) {
  protected updateEntity(
    tower: Entity,
    dt: number,
    position: Position,
    {kind}: Tower,
    {projectileSpeed}: Weapon,
    {creep}: Target,
    payload: Payload,
    cooldown: Cooldown,
  ): void {
    // Several shots in one update if the interval is shorter than the update
    while (cooldown.remaining <= 0) {
      this.engine.addEntity(createProjectile(position, creep, kind, projectileSpeed, payload));
      cooldown.remaining += cooldown.interval;
    }
  }
}
