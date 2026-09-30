import {Entity, QueryBuilder, System} from 'tick-knock';
import {Size, wrappedDifference} from '../../shared/geometry';
import {QuadTree} from '../../shared/QuadTree';
import {Collider, Position} from '../components';
import {ASTEROIDS} from '../config';
import {AsteroidDestroyed, ShipDestroyed} from '../messages';
import {BULLET, SHIP} from '../tags';

/**
 * The largest radius of an asteroid: an asteroid touches a collider, when its center is not further than this radius
 * plus the radius of the collider
 */
const MAX_ASTEROID_RADIUS = Math.max(...Object.values(ASTEROIDS).map(({radius}) => radius));

/**
 * Detects collisions of bullets and the ship with asteroids, and reports them with messages. Asteroids near a bullet or
 * the ship are found in the quad tree, so only a few of them are checked.
 *
 * Entities removed during the update are removed after it, so collided entities lose their colliders immediately:
 * they leave collision queries and can't collide once again in the same update.
 */
export class CollisionSystem extends System {
  private readonly bullets = new QueryBuilder().contains(Position, Collider, BULLET).build();
  private readonly ships = new QueryBuilder().contains(Position, Collider, SHIP).build();

  /**
   * @param asteroids Quad tree of asteroids
   * @param screen Size of the screen, which wraps around, so objects at opposite edges can collide
   */
  public constructor(private readonly asteroids: QuadTree<Entity>, private readonly screen: Size) {
    super();
  }

  public onAddedToEngine(): void {
    this.engine.addQuery(this.bullets).addQuery(this.ships);
  }

  public onRemovedFromEngine(): void {
    this.engine.removeQuery(this.bullets);
    this.engine.removeQuery(this.ships);
  }

  public update(): void {
    // A bullet destroys the first asteroid it touches, and disappears
    this.bullets.forEach((bullet, position, collider) => {
      const asteroid = this.findAsteroid(position, collider.radius);
      if (asteroid === undefined) return;

      this.destroy(bullet);
      this.destroy(asteroid);
      this.dispatch(new AsteroidDestroyed(asteroid));
    });

    // An asteroid destroys the ship
    this.ships.forEach((ship, position, collider) => {
      if (this.findAsteroid(position, collider.radius) === undefined) return;

      this.destroy(ship);
      this.dispatch(new ShipDestroyed());
    });
  }

  /**
   * Finds an asteroid, that touches the circle. The screen wraps around, so near the edges asteroids are also looked for
   * at the opposite edges.
   */
  private findAsteroid(position: Position, radius: number): Entity | undefined {
    const {width, height} = this.screen;
    const searchRadius = radius + MAX_ASTEROID_RADIUS;
    const offsetsX = wrapOffsets(position.x, width, searchRadius);
    const offsetsY = wrapOffsets(position.y, height, searchRadius);

    let found: Entity | undefined;
    for (const offsetX of offsetsX) {
      for (const offsetY of offsetsY) {
        const center = {x: position.x + offsetX, y: position.y + offsetY};
        this.asteroids.forEachNear(center, searchRadius, (asteroid) => {
          if (found === undefined && this.touches(asteroid, position, radius)) found = asteroid;
        });
      }
    }
    return found;
  }

  /**
   * Returns a value indicating whether the asteroid touches the circle. An asteroid destroyed earlier in this update has
   * lost its collider, and doesn't touch anything.
   */
  private touches(asteroid: Entity, position: Position, radius: number): boolean {
    const collider = asteroid.get(Collider);
    if (collider === undefined) return false;

    const asteroidPosition = asteroid.get(Position)!;
    const dx = wrappedDifference(position.x, asteroidPosition.x, this.screen.width);
    const dy = wrappedDifference(position.y, asteroidPosition.y, this.screen.height);
    const distance = radius + collider.radius;
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

/**
 * Returns offsets of the coordinate to look at: the coordinate itself, and the opposite edge, when the search area
 * crosses the edge of the screen
 */
function wrapOffsets(value: number, size: number, radius: number): number[] {
  const offsets = [0];
  if (value < radius) offsets.push(size);
  if (value > size - radius) offsets.push(-size);
  return offsets;
}
