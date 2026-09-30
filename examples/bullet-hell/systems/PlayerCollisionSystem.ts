import {Entity, IterativeSystem} from 'tick-knock';
import {DESTROYED} from '../../shared/DestroySystem';
import {ColliderTree} from '../ColliderTree';
import {Collider, Enemy, Hit, Invulnerable, Position} from '../components';
import {ENEMY_BULLET, PLAYER} from '../tags';

/**
 * Enemies and their bullets hit the player they touch. Enemy bullets are destroyed by the hit, enemies are not.
 * The system only reports hits: the player gets a `Hit` for everything that has hit it, and the system of player hits
 * decides what it does.
 */
export class PlayerCollisionSystem extends IterativeSystem.of(Position, Collider, PLAYER) {
  public constructor(private readonly colliders: ColliderTree) {
    super();
  }

  protected updateEntity(player: Entity, dt: number, position: Position, {radius}: Collider): void {
    // Bullets fly through the invulnerable player
    if (player.has(Invulnerable)) return;

    for (const other of this.colliders.findAll(position, radius, hurtsPlayer)) {
      if (other.has(ENEMY_BULLET)) other.add(DESTROYED);
      player.append(new Hit());
    }
  }
}

function hurtsPlayer(entity: Entity): boolean {
  return entity.has(ENEMY_BULLET) || entity.has(Enemy);
}
