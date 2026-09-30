import {Entity, IterativeSystem} from 'tick-knock';
import {DESTROYED} from '../../shared/ecs/tags';
import {ColliderTree} from '../ColliderTree';
import {Collider, Enemy, Hit, Position} from '../components';
import {PLAYER_BULLET} from '../tags';

/**
 * A bullet of the player hits the first enemy it touches, and is destroyed. The system only reports the hit: the enemy
 * gets a `Hit`, and the system of enemy hits decides what it does.
 */
export class PlayerBulletCollisionSystem extends IterativeSystem.of(Position, Collider, PLAYER_BULLET) {
  public constructor(private readonly colliders: ColliderTree) {
    super();
  }

  protected updateEntity(bullet: Entity, dt: number, position: Position, {radius}: Collider): void {
    const enemy = this.colliders.find(position, radius, isEnemy);
    if (enemy === undefined) return;

    bullet.add(DESTROYED);
    enemy.append(new Hit());
  }
}

function isEnemy(entity: Entity): boolean {
  return entity.has(Enemy);
}
