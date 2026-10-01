import {Entity} from 'tick-knock';
import {isWithin} from '../shared/geometry';
import {QuadTree} from '../shared/indexes/QuadTree';
import {Collider, Position} from './components';
import {ENEMY_BULLET_RADIUS, HEIGHT, PLAYER_BULLET_RADIUS, PLAYER_RADIUS, SCREEN_MARGIN, WIDTH} from './config';
import {MAX_ENEMY_RADIUS} from './enemies';

/**
 * The largest radius of a collider: an entity touches a circle, when its center is not further than this radius plus
 * the radius of the circle
 */
const MAX_COLLIDER_RADIUS = Math.max(MAX_ENEMY_RADIUS, ENEMY_BULLET_RADIUS, PLAYER_BULLET_RADIUS, PLAYER_RADIUS);

/**
 * Entities with colliders at their positions: the player, enemies and all bullets. Entities are removed when they
 * leave the screen further than the margin, so the tree covers the screen with the margin.
 */
export class ColliderTree {
  private readonly tree = new QuadTree<Entity>({
    x: -SCREEN_MARGIN,
    y: -SCREEN_MARGIN,
    width: WIDTH + SCREEN_MARGIN * 2,
    height: HEIGHT + SCREEN_MARGIN * 2,
  });

  public add(entity: Entity, position: Position): void {
    this.tree.insert(entity, position);
  }

  public move(entity: Entity, position: Position): void {
    this.tree.move(entity, position);
  }

  public remove(entity: Entity): void {
    this.tree.remove(entity);
  }

  /**
   * Finds entities, that touch the circle and match the predicate. Entities are collected first, and returned after
   * the search, so the caller can destroy them, and they leave the tree without breaking the search.
   */
  public findAll(position: Position, radius: number, predicate: (entity: Entity) => boolean): Entity[] {
    const found: Entity[] = [];
    this.tree.forEachNear(position, radius + MAX_COLLIDER_RADIUS, (entity) => {
      if (predicate(entity) && this.touches(entity, position, radius)) found.push(entity);
    });
    return found;
  }

  /**
   * Finds the first entity, that touches the circle and matches the predicate
   */
  public find(position: Position, radius: number, predicate: (entity: Entity) => boolean): Entity | undefined {
    let found: Entity | undefined;
    this.tree.forEachNear(position, radius + MAX_COLLIDER_RADIUS, (entity) => {
      if (found === undefined && predicate(entity) && this.touches(entity, position, radius)) found = entity;
    });
    return found;
  }

  private touches(entity: Entity, position: Position, radius: number): boolean {
    return isWithin(entity.get(Position)!, position, entity.get(Collider)!.radius + radius);
  }
}
