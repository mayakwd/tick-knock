/**
 * Smoke tests of the examples: games are played by autopilots with seeded random numbers, and rendering is checked
 * without a browser, so the examples keep working when the library changes.
 *
 * Usage: pnpm --filter tick-knock-examples test
 */
import {testAsteroids} from './asteroids';
import {testBulletHell} from './bulletHell';
import {testQuadTree} from './quadTree';
import {testSnake} from './snake';
import {testTowerDefense, testTowerUpgrades} from './towerDefense';

testQuadTree();
testSnake();
testAsteroids();
testBulletHell();
testTowerDefense();
testTowerUpgrades();
console.log('Examples work');
