import * as assert from 'node:assert/strict';
import {Entity} from 'tick-knock';
import {Collider} from '../shared/components/Collider';
import {Position} from '../shared/components/Position';
import {distance, isWithin} from '../shared/geometry';
import {CircleEntry, CircleIndex} from '../shared/indexes/CircleIndex';
import {seededRandom} from '../shared/random';

/**
 * The circle index finds the same circles as checking every circle: touching ones and the nearest one
 */
export function testCircleIndex(): void {
  const random = seededRandom(5);
  const bounds = {x: 0, y: 0, width: 800, height: 600};
  const maxRadius = 30;
  const index = new CircleIndex(bounds, maxRadius);
  const entries: CircleEntry[] = [];
  for (let i = 0; i < 300; i++) {
    const position = new Position(random() * bounds.width, random() * bounds.height);
    const entry = new CircleEntry(new Entity(), position, new Collider(random() * maxRadius));
    entries.push(entry);
    index.insert(entry);
  }

  // Circles move, and half of them are removed
  for (const {entity, position} of entries) {
    position.x = Math.min(Math.max(position.x + (random() - 0.5) * 60, 0), bounds.width - 1);
    position.y = Math.min(Math.max(position.y + (random() - 0.5) * 60, 0), bounds.height - 1);
    index.move(entity);
  }
  for (const {entity} of entries.splice(0, 150)) index.remove(entity);
  assert.equal(index.size, entries.length, 'removed circles leave the index');

  for (let i = 0; i < 100; i++) {
    const center = {x: random() * bounds.width, y: random() * bounds.height};
    const radius = random() * 50;
    const touching = entries.filter(({position, collider}) => isWithin(position, center, radius + collider.radius));
    const found: CircleEntry[] = [];
    index.forEachTouching(center, radius, (entry) => found.push(entry));
    assert.deepEqual(new Set(found), new Set(touching), 'the index finds all touching circles');
    assert.equal(index.find(center, radius) !== undefined, touching.length > 0, 'the index finds a touching circle');

    const gap = ({position, collider}: CircleEntry) => distance(center, position) - collider.radius;
    const maxDistance = random() * 300;
    const nearest = entries.reduce((best, entry) => gap(entry) < gap(best) ? entry : best);
    const expected = nearest !== undefined && gap(nearest) <= maxDistance ? nearest : undefined;
    assert.equal(index.nearest(center, maxDistance), expected, 'the index finds the nearest circle');
  }
  console.log('circle index: finds the same circles as checking every circle');
}
