import {Vector} from './geometry';

export interface Rectangle {
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
}

interface Item<T> {
  readonly value: T;
  readonly x: number;
  readonly y: number;
}

/**
 * Items at points of an area. When a node gets more items than its capacity, it splits into four quarters, so dense
 * places are divided finer, and finding items near a point looks only into nodes around it.
 *
 * Positions of moving things change every frame, so the tree is cleared and filled again every update.
 */
export class QuadTree<T> {
  private readonly items: Array<Item<T>> = [];
  private children?: Array<QuadTree<T>>;

  /**
   * @param bounds Area of the node, items outside of it are not added
   * @param capacity Amount of items after which the node splits
   * @param depth Depth of the node, nodes of the maximal depth don't split
   */
  public constructor(
    private readonly bounds: Rectangle,
    private readonly capacity: number = 8,
    private readonly depth: number = 0,
  ) {}

  public clear(): void {
    this.items.length = 0;
    this.children = undefined;
  }

  public insert(value: T, {x, y}: Readonly<Vector>): void {
    if (!this.contains(x, y)) return;

    if (this.children !== undefined) {
      for (const child of this.children) child.insert(value, {x, y});
      return;
    }

    this.items.push({value, x, y});
    if (this.items.length > this.capacity && this.depth < MAX_DEPTH) this.split();
  }

  /**
   * Calls the callback for items in the square around the center. Items are near the center, but not necessarily within
   * the radius, so the callback checks the exact distance, if it needs it.
   */
  public forEachNear(center: Readonly<Vector>, radius: number, callback: (value: T) => void): void {
    if (!this.touches(center, radius)) return;

    for (const {value, x, y} of this.items) {
      if (Math.abs(x - center.x) <= radius && Math.abs(y - center.y) <= radius) callback(value);
    }

    if (this.children !== undefined) {
      for (const child of this.children) child.forEachNear(center, radius, callback);
    }
  }

  /**
   * Divides the node into four quarters, and moves its items to them
   */
  private split(): void {
    const {x, y, width, height} = this.bounds;
    const halfWidth = width / 2;
    const halfHeight = height / 2;
    const depth = this.depth + 1;
    this.children = [
      new QuadTree({x, y, width: halfWidth, height: halfHeight}, this.capacity, depth),
      new QuadTree({x: x + halfWidth, y, width: halfWidth, height: halfHeight}, this.capacity, depth),
      new QuadTree({x, y: y + halfHeight, width: halfWidth, height: halfHeight}, this.capacity, depth),
      new QuadTree({x: x + halfWidth, y: y + halfHeight, width: halfWidth, height: halfHeight}, this.capacity, depth),
    ];

    for (const {value, x: itemX, y: itemY} of this.items.splice(0)) {
      for (const child of this.children) child.insert(value, {x: itemX, y: itemY});
    }
  }

  /**
   * Returns a value indicating whether the point is in the node. The left and top edges belong to the node, the right
   * and bottom ones belong to its neighbours, so a point is in one node only.
   */
  private contains(x: number, y: number): boolean {
    const {bounds} = this;
    return x >= bounds.x && x < bounds.x + bounds.width && y >= bounds.y && y < bounds.y + bounds.height;
  }

  /**
   * Returns a value indicating whether the square around the center touches the node
   */
  private touches({x, y}: Readonly<Vector>, radius: number): boolean {
    const {bounds} = this;
    return x + radius >= bounds.x && x - radius < bounds.x + bounds.width
      && y + radius >= bounds.y && y - radius < bounds.y + bounds.height;
  }
}

/**
 * Nodes of this depth don't split, so many items at one point don't make the tree endless
 */
const MAX_DEPTH = 8;
