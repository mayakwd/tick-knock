import {Entity} from 'tick-knock';
import {Size, wrappedDifference} from '../shared/geometry';
import {QuadTree} from '../shared/QuadTree';
import {Collider, Position} from './components';
import {ASTEROIDS} from './config';

/**
 * The largest radius of an asteroid: an asteroid touches a collider, when its center is not further than this radius
 * plus the radius of the collider
 */
const MAX_ASTEROID_RADIUS = Math.max(...Object.values(ASTEROIDS).map(({radius}) => radius));

/**
 * Asteroids at their positions. The screen wraps around, so near the edges asteroids are also looked for at the
 * opposite edges.
 */
export class AsteroidTree {
  private readonly tree: QuadTree<Entity>;

  public constructor(private readonly screen: Size) {
    this.tree = new QuadTree({x: 0, y: 0, width: screen.width, height: screen.height});
  }

  public clear(): void {
    this.tree.clear();
  }

  public add(asteroid: Entity, position: Position): void {
    this.tree.insert(asteroid, position);
  }

  /**
   * Finds an asteroid, that touches the circle. An asteroid destroyed earlier in this update has lost its collider, and
   * doesn't touch anything.
   */
  public find(position: Position, radius: number): Entity | undefined {
    const {width, height} = this.screen;
    const searchRadius = radius + MAX_ASTEROID_RADIUS;

    let found: Entity | undefined;
    for (const offsetX of wrapOffsets(position.x, width, searchRadius)) {
      for (const offsetY of wrapOffsets(position.y, height, searchRadius)) {
        const center = {x: position.x + offsetX, y: position.y + offsetY};
        this.tree.forEachNear(center, searchRadius, (asteroid) => {
          if (found === undefined && this.touches(asteroid, position, radius)) found = asteroid;
        });
      }
    }
    return found;
  }

  private touches(asteroid: Entity, position: Position, radius: number): boolean {
    const collider = asteroid.get(Collider);
    if (collider === undefined) return false;

    const asteroidPosition = asteroid.get(Position)!;
    const dx = wrappedDifference(position.x, asteroidPosition.x, this.screen.width);
    const dy = wrappedDifference(position.y, asteroidPosition.y, this.screen.height);
    const distance = radius + collider.radius;
    return dx * dx + dy * dy < distance * distance;
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
