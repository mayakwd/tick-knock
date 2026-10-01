import {Vector} from '../geometry';

export interface Rectangle {
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
}

/**
 * Items at points of an area. When a node gets more items than its capacity, it splits into four quarters, so dense
 * places are divided finer, and finding items near a point looks only into nodes around it.
 *
 * Every item remembers the node it's in. When an item moves within its node, only its point changes. When it leaves
 * the node, it's removed from it and inserted into the new place, and nodes that became too empty are merged back.
 */
export class QuadTree<T> {
  private readonly root: QuadNode<T>;
  private readonly items = new Map<T, QuadItem<T>>();

  /**
   * @param bounds Area of the tree, points of items are expected to be in it
   * @param capacity Amount of items after which a node splits
   */
  public constructor(bounds: Rectangle, capacity: number = 8) {
    this.root = new QuadNode(bounds, capacity, 0);
  }

  public get size(): number {
    return this.items.size;
  }

  public has(value: T): boolean {
    return this.items.has(value);
  }

  public insert(value: T, {x, y}: Readonly<Vector>): void {
    const item = new QuadItem(value, x, y, this.root);
    this.items.set(value, item);
    this.root.insert(item);
  }

  public move(value: T, {x, y}: Readonly<Vector>): void {
    const item = this.items.get(value);
    if (item === undefined) return;

    item.x = x;
    item.y = y;

    // Most of the time an item stays in its node, and there is nothing else to do
    if (item.node.contains(x, y)) return;

    item.node.remove(item);
    this.root.insert(item);
  }

  public remove(value: T): void {
    const item = this.items.get(value);
    if (item === undefined) return;

    this.items.delete(value);
    item.node.remove(item);
  }

  public clear(): void {
    this.items.clear();
    this.root.clear();
  }

  /**
   * Calls the callback for items in the square around the center. Items are near the center, but not necessarily within
   * the radius, so the callback checks the exact distance, if it needs it.
   */
  public forEachNear(center: Readonly<Vector>, radius: number, callback: (value: T) => void): void {
    this.root.forEachNear(center, radius, callback);
  }
}

class QuadItem<T> {
  public constructor(
    public readonly value: T,
    public x: number,
    public y: number,
    /**
     * The leaf node the item is in. Inserting the item into a node puts it into the leaf of its point.
     */
    public node: QuadNode<T>,
  ) {}
}

class QuadNode<T> {
  /**
   * Items of a leaf node, nodes with children keep their items in children
   */
  private readonly items: Array<QuadItem<T>> = [];
  private children: Quarters<T> | undefined = undefined;
  /**
   * Amount of items in the node and all its children
   */
  private count = 0;
  private readonly middleX: number;
  private readonly middleY: number;

  public constructor(
    private readonly bounds: Rectangle,
    private readonly capacity: number,
    private readonly depth: number,
    private readonly parent?: QuadNode<T>,
  ) {
    this.middleX = bounds.x + bounds.width / 2;
    this.middleY = bounds.y + bounds.height / 2;
  }

  public insert(item: QuadItem<T>): void {
    this.count++;

    if (this.children !== undefined) {
      this.childAt(this.children, item.x, item.y).insert(item);
      return;
    }

    item.node = this;
    this.items.push(item);

    if (this.items.length > this.capacity && this.depth < MAX_DEPTH) this.split();
  }

  /**
   * Removes the item from this leaf node, and merges ancestors that can keep all their items themselves
   */
  public remove(item: QuadItem<T>): void {
    const index = this.items.indexOf(item);
    this.items[index] = this.items[this.items.length - 1];
    this.items.pop();

    let emptiest: QuadNode<T> | undefined;
    for (let node: QuadNode<T> | undefined = this; node !== undefined; node = node.parent) {
      node.count--;
      if (node.children !== undefined && node.count <= node.capacity) emptiest = node;
    }
    emptiest?.merge();
  }

  public clear(): void {
    this.items.length = 0;
    this.children = undefined;
    this.count = 0;
  }

  public forEachNear(center: Readonly<Vector>, radius: number, callback: (value: T) => void): void {
    if (this.count === 0 || !this.touches(center, radius)) return;

    if (this.children !== undefined) {
      for (const child of this.children) child.forEachNear(center, radius, callback);
      return;
    }

    for (const {value, x, y} of this.items) {
      if (Math.abs(x - center.x) <= radius && Math.abs(y - center.y) <= radius) callback(value);
    }
  }

  /**
   * Returns a value indicating whether the point is in the node. The left and top edges belong to the node, the right
   * and bottom ones belong to its neighbours, so a point is in one node only.
   */
  public contains(x: number, y: number): boolean {
    const {bounds} = this;
    return x >= bounds.x && x < bounds.x + bounds.width && y >= bounds.y && y < bounds.y + bounds.height;
  }

  /**
   * Divides the node into four quarters, and moves its items to them
   */
  private split(): void {
    const {x, y, width, height} = this.bounds;
    const halfWidth = width / 2;
    const halfHeight = height / 2;
    const depth = this.depth + 1;
    const children: Quarters<T> = [
      new QuadNode({x, y, width: halfWidth, height: halfHeight}, this.capacity, depth, this),
      new QuadNode({x: this.middleX, y, width: halfWidth, height: halfHeight}, this.capacity, depth, this),
      new QuadNode({x, y: this.middleY, width: halfWidth, height: halfHeight}, this.capacity, depth, this),
      new QuadNode({x: this.middleX, y: this.middleY, width: halfWidth, height: halfHeight}, this.capacity, depth, this),
    ];
    this.children = children;

    for (const item of this.items.splice(0)) {
      this.childAt(children, item.x, item.y).insert(item);
    }
  }

  /**
   * Takes items of all children back into the node, and removes children
   */
  private merge(): void {
    this.collect(this.items);
    this.children = undefined;
    for (const item of this.items) item.node = this;
  }

  private collect(items: Array<QuadItem<T>>): void {
    if (this.children === undefined) {
      items.push(...this.items);
      return;
    }

    for (const child of this.children) child.collect(items);
  }

  /**
   * Returns the quarter the point belongs to
   */
  private childAt(children: Quarters<T>, x: number, y: number): QuadNode<T> {
    return children[(x < this.middleX ? 0 : 1) + (y < this.middleY ? 0 : 2)];
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
 * Children of a node: the top left, top right, bottom left and bottom right quarters
 */
type Quarters<T> = readonly [QuadNode<T>, QuadNode<T>, QuadNode<T>, QuadNode<T>];

/**
 * Nodes of this depth don't split, so many items at one point don't make the tree endless
 */
const MAX_DEPTH = 8;
