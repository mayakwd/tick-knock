import * as assert from 'node:assert/strict';
import {Vector} from '../shared/geometry';
import {QuadTree} from '../shared/indexes/QuadTree';
import {seededRandom} from '../shared/random';

/**
 * The quad tree finds the same points near a center as checking every point, while points are inserted, moved and
 * removed
 */
export function testQuadTree(): void {
  const random = seededRandom(11);
  const bounds = {x: 0, y: 0, width: 800, height: 600};
  const randomPoint = () => ({x: random() * bounds.width, y: random() * bounds.height});

  const tree = new QuadTree<number>(bounds, 4);
  const points = new Map<number, Vector>();

  const checkNear = () => {
    for (let i = 0; i < 50; i++) {
      const center = randomPoint();
      const radius = random() * 120;
      const found: number[] = [];
      tree.forEachNear(center, radius, (index) => found.push(index));

      const expected = [...points]
        .filter(([, point]) => Math.abs(point.x - center.x) <= radius && Math.abs(point.y - center.y) <= radius)
        .map(([index]) => index);
      assert.deepEqual(found.sort((a, b) => a - b), expected.sort((a, b) => a - b), 'the quad tree finds all points near the center');
    }
  };

  for (let index = 0; index < 500; index++) {
    const point = randomPoint();
    points.set(index, point);
    tree.insert(index, point);
  }
  checkNear();

  // Points move a little, so most of them stay in their nodes, and some cross into neighbours
  for (let step = 0; step < 20; step++) {
    for (const [index, point] of points) {
      point.x = Math.min(Math.max(point.x + (random() - 0.5) * 40, 0), bounds.width - 1);
      point.y = Math.min(Math.max(point.y + (random() - 0.5) * 40, 0), bounds.height - 1);
      tree.move(index, point);
    }
    checkNear();
  }

  // Removing most of the points merges nodes back
  for (let index = 0; index < 480; index++) {
    points.delete(index);
    tree.remove(index);
  }
  assert.equal(tree.size, points.size, 'removed points leave the quad tree');
  checkNear();

  tree.clear();
  tree.forEachNear({x: 400, y: 300}, 1000, () => assert.fail('a cleared quad tree is empty'));
  console.log('quad tree: finds the same points as checking every point, while they move');
}
