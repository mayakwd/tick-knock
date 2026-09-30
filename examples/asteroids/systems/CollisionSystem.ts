import {Entity, QueryBuilder, System} from 'tick-knock';
import {Size, wrappedDifference} from '../../shared/geometry';
import {Asteroid, Collider, Position} from '../components';
import {AsteroidDestroyed, ShipDestroyed} from '../messages';
import {BULLET, SHIP} from '../tags';

/**
 * Detects collisions of bullets with asteroids, and of the ship with asteroids, and reports them with messages.
 *
 * Entities removed during the update are removed after it, so collided entities lose their colliders immediately:
 * they leave collision queries and can't collide once again in the same update.
 */
export class CollisionSystem extends System {
  private readonly bullets = new QueryBuilder().contains(Position, Collider, BULLET).build();
  private readonly asteroids = new QueryBuilder().contains(Position, Collider, Asteroid).build();
  private readonly ships = new QueryBuilder().contains(Position, Collider, SHIP).build();

  /**
   * @param screen Size of the screen, which wraps around, so objects at opposite edges can collide
   */
  public constructor(private readonly screen: Size) {
    super();
  }

  public onAddedToEngine(): void {
    this.engine.addQuery(this.bullets).addQuery(this.asteroids).addQuery(this.ships);
  }

  public onRemovedFromEngine(): void {
    for (const query of [this.bullets, this.asteroids, this.ships]) this.engine.removeQuery(query);
  }

  public update(): void {
    this.asteroids.forEach((asteroid, asteroidPosition, asteroidCollider) => {
      this.bullets.forEach((bullet, bulletPosition, bulletCollider) => {
        // The asteroid could have been destroyed by another bullet of this update
        if (!this.asteroids.has(asteroid)) return;
        if (!this.collide(asteroidPosition, bulletPosition, asteroidCollider.radius + bulletCollider.radius)) return;
        this.destroy(bullet);
        this.destroy(asteroid);
        this.dispatch(new AsteroidDestroyed(asteroid));
      });
      this.ships.forEach((ship, shipPosition, shipCollider) => {
        if (!this.asteroids.has(asteroid)) return;
        if (!this.collide(asteroidPosition, shipPosition, asteroidCollider.radius + shipCollider.radius)) return;
        this.destroy(ship);
        this.dispatch(new ShipDestroyed());
      });
    });
  }

  /**
   * Returns a value indicating whether the points are closer than the distance. The distance is measured across
   * the edges of the screen, so objects at opposite edges collide.
   */
  private collide(a: Position, b: Position, distance: number): boolean {
    const dx = wrappedDifference(a.x, b.x, this.screen.width);
    const dy = wrappedDifference(a.y, b.y, this.screen.height);
    return dx * dx + dy * dy < distance * distance;
  }

  /**
   * Removes the entity after the update, and removes its collider right away
   */
  private destroy(entity: Entity): void {
    entity.remove(Collider);
    this.engine.removeEntity(entity);
  }
}
