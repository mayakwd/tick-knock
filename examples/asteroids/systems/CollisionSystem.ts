import {Entity, QueryBuilder, System} from 'tick-knock';
import {Asteroid, Collider, Position, Ship} from '../components';
import {AsteroidDestroyed, ShipDestroyed} from '../messages';
import {BULLET} from '../tags';

/**
 * Detects collisions of bullets with asteroids, and of the ship with asteroids.
 *
 * Entities removed during the update are removed after it, so collided entities lose their colliders immediately:
 * they leave collision queries and can't collide once again in the same update.
 */
export class CollisionSystem extends System {
  private readonly bullets = new QueryBuilder().contains(Position, Collider, BULLET).build();
  private readonly asteroids = new QueryBuilder().contains(Position, Collider, Asteroid).build();
  private readonly ships = new QueryBuilder().contains(Position, Collider, Ship).build();

  /**
   * @param split Splits the destroyed asteroid into smaller ones
   */
  public constructor(private readonly split: (asteroid: Entity) => void) {
    super();
  }

  public onAddedToEngine(): void {
    this.engine.addQuery(this.bullets).addQuery(this.asteroids).addQuery(this.ships);
  }

  public onRemovedFromEngine(): void {
    for (const query of [this.bullets, this.asteroids, this.ships]) this.engine.removeQuery(query);
  }

  public update(): void {
    this.asteroids.forEach((asteroid, asteroidPosition, asteroidCollider, {size}) => {
      this.bullets.forEach((bullet, bulletPosition, bulletCollider) => {
        if (!this.asteroids.has(asteroid) || !collides(asteroidPosition, asteroidCollider, bulletPosition, bulletCollider)) return;
        bullet.remove(Collider);
        this.engine.removeEntity(bullet);
        this.split(asteroid);
        this.dispatch(new AsteroidDestroyed(size));
      });
      this.ships.forEach((ship, shipPosition, shipCollider) => {
        if (!this.asteroids.has(asteroid) || !collides(asteroidPosition, asteroidCollider, shipPosition, shipCollider)) return;
        ship.remove(Collider);
        this.engine.removeEntity(ship);
        this.dispatch(new ShipDestroyed());
      });
    });
  }
}

function collides(a: Position, aCollider: Collider, b: Position, bCollider: Collider): boolean {
  const distance = aCollider.radius + bCollider.radius;
  return (a.x - b.x) ** 2 + (a.y - b.y) ** 2 < distance * distance;
}
