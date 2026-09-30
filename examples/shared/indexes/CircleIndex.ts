import {Entity} from 'tick-knock';
import {Collider} from '../components/Collider';
import {Position} from '../components/Position';
import {distance, isWithin, Vector} from '../geometry';
import {QuadTree, Rectangle} from './QuadTree';

/**
 * Entry of a circle index: the entity with its position and collider, so systems that find it don't look them up again
 */
export class CircleEntry {
  public constructor(
    public readonly entity: Entity,
    public readonly position: Position,
    public readonly collider: Collider,
  ) {}
}

/**
 * Circles of entities in a quad tree, so finding entities that touch a circle, or the nearest one, looks only into
 * the area around it instead of checking every entity.
 *
 * The index doesn't change itself: an index system of the game inserts an entity when it appears, moves it every
 * update, and removes it when it's destroyed.
 */
export class CircleIndex {
  private readonly tree: QuadTree<CircleEntry>;
  private readonly entries = new Map<Entity, CircleEntry>();

  /**
   * @param bounds Area where entities are expected to be
   * @param maxRadius The largest collider in the index: a circle touches an entity, when its center is not further
   *  than this radius plus the radius of the circle, so a search knows how far to look
   */
  public constructor(bounds: Rectangle, private readonly maxRadius: number) {
    this.tree = new QuadTree(bounds);
  }

  public get size(): number {
    return this.entries.size;
  }

  public insert(entry: CircleEntry): void {
    this.entries.set(entry.entity, entry);
    this.tree.insert(entry, entry.position);
  }

  /**
   * Moves the entity to its current position
   */
  public move(entity: Entity): void {
    const entry = this.entries.get(entity);
    if (entry !== undefined) this.tree.move(entry, entry.position);
  }

  public remove(entity: Entity): void {
    const entry = this.entries.get(entity);
    if (entry === undefined) return;

    this.entries.delete(entity);
    this.tree.remove(entry);
  }

  /**
   * Finds an entity that touches the circle
   */
  public find(center: Readonly<Vector>, radius: number): CircleEntry | undefined {
    let found: CircleEntry | undefined;
    this.tree.forEachNear(center, radius + this.maxRadius, (entry) => {
      if (found === undefined && touches(entry, center, radius)) found = entry;
    });
    return found;
  }

  /**
   * Calls the callback for every entity that touches the circle. Entities are found first and passed after the search,
   * so the callback can destroy them: they leave the index without breaking the search.
   */
  public forEachTouching(center: Readonly<Vector>, radius: number, callback: (entry: CircleEntry) => void): void {
    const found: CircleEntry[] = [];
    this.tree.forEachNear(center, radius + this.maxRadius, (entry) => {
      if (touches(entry, center, radius)) found.push(entry);
    });
    for (const entry of found) callback(entry);
  }

  /**
   * Finds the entity which edge is the nearest to the point. The search starts around the point and looks twice as far
   * every time nothing is found, so a near entity is found quickly, and a far one doesn't need a scan of everything.
   * @param maxDistance Entities further than this distance from the point are not found
   */
  public nearest(center: Readonly<Vector>, maxDistance: number): CircleEntry | undefined {
    let nearest: CircleEntry | undefined;
    let nearestGap = Infinity;
    for (let radius = Math.min(FIRST_SEARCH_RADIUS, maxDistance); ; radius = Math.min(radius * 2, maxDistance)) {
      this.tree.forEachNear(center, radius + this.maxRadius, (entry) => {
        const gap = distance(center, entry.position) - entry.collider.radius;
        if (gap < nearestGap) {
          nearest = entry;
          nearestGap = gap;
        }
      });

      // Every entity closer than the radius is in the searched area, so a found one within it is the nearest
      if (nearestGap <= radius) return nearest;
      if (radius === maxDistance) return undefined;
    }
  }
}

/**
 * Radius of the first area the search for the nearest entity looks into
 */
const FIRST_SEARCH_RADIUS = 64;

function touches({position, collider}: CircleEntry, center: Readonly<Vector>, radius: number): boolean {
  return isWithin(position, center, collider.radius + radius);
}
