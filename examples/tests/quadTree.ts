import * as assert from 'node:assert/strict';
import {QuadTree} from '../shared/QuadTree';
import {seededRandom} from '../shared/random';

/**
 * The quad tree finds the same points near a center as checking every point
 */
export function testQuadTree(): void {
  const random = seededRandom(11);
  const bounds = {x: 0, y: 0, width: 800, height: 600};
  const tree = new QuadTree<number>(bounds, 4);
  const points = Array.from({length: 500}, () => ({x: random() * bounds.width, y: random() * bounds.height}));
  points.forEach((point, index) => tree.insert(index, point));

  for (let i = 0; i < 200; i++) {
    const center = {x: random() * bounds.width, y: random() * bounds.height};
    const radius = random() * 120;
    const found: number[] = [];
    tree.forEachNear(center, radius, (index) => found.push(index));

    const expected = points
      .map((point, index) => ({point, index}))
      .filter(({point}) => Math.abs(point.x - center.x) <= radius && Math.abs(point.y - center.y) <= radius)
      .map(({index}) => index);
    assert.deepEqual(found.sort((a, b) => a - b), expected, 'the quad tree finds all points near the center');
  }

  tree.clear();
  tree.forEachNear({x: 400, y: 300}, 1000, () => assert.fail('a cleared quad tree is empty'));
  console.log('quad tree: finds the same points as checking every point');
}
