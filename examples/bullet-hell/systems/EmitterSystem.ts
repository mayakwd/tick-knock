import {Entity, IterativeSystem, QueryBuilder} from 'tick-knock';
import {Random} from '../../shared/random';
import {Emitter, Enemy, Position} from '../components';
import {createEnemyBullet} from '../entities';
import {PLAYER} from '../tags';

/**
 * Fans of aimed bullets are this wide in radians
 */
const AIMED_SPREAD = 0.5;
/**
 * Speed of the spiral rotation in radians per shot
 */
const SPIRAL_STEP = 0.35;

/**
 * Fires bullets of enemies. The system reads the pattern from the emitter, so all kinds of enemies are handled
 * by one system. Aimed patterns need the position of the player, so the system has an additional query.
 */
export class EmitterSystem extends IterativeSystem.of(Position, Emitter, Enemy) {
  private readonly player = new QueryBuilder().contains(Position, PLAYER).build();

  public constructor(private readonly random: Random) {
    super();
  }

  public onAddedToEngine(): void {
    super.onAddedToEngine();
    this.engine.addQuery(this.player);
  }

  public onRemovedFromEngine(): void {
    super.onRemovedFromEngine();
    this.engine.removeQuery(this.player);
  }

  protected updateEntity(entity: Entity, dt: number, position: Position, emitter: Emitter): void {
    emitter.cooldown -= dt;
    if (emitter.cooldown > 0) return;
    emitter.cooldown += emitter.interval;

    const {x, y} = position;
    switch (emitter.pattern) {
      case 'ring':
        this.fan(x, y, emitter, this.random() * Math.PI, Math.PI * 2, false);
        break;
      case 'spiral':
        emitter.angle += SPIRAL_STEP;
        this.fan(x, y, emitter, emitter.angle, Math.PI * 2, false);
        break;
      case 'aimed': {
        const target = this.player.first?.get(Position);
        const angle = target !== undefined ? Math.atan2(target.y - y, target.x - x) : Math.PI / 2;
        this.fan(x, y, emitter, angle - AIMED_SPREAD / 2, AIMED_SPREAD, true);
        break;
      }
    }
  }

  /**
   * Fires bullets of the emitter evenly in the arc
   * @param inclusive Whether both edges of the arc get a bullet, a full circle doesn't need it
   */
  private fan(x: number, y: number, {count, speed}: Emitter, start: number, arc: number, inclusive: boolean): void {
    const step = arc / (inclusive && count > 1 ? count - 1 : count);
    for (let i = 0; i < count; i++) {
      this.engine.addEntity(createEnemyBullet(x, y, start + step * i, speed));
    }
  }
}
