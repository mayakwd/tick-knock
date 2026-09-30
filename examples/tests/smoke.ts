/**
 * Smoke tests of the examples: games are played by autopilots with seeded random numbers, and rendering is checked
 * without a browser, so the examples keep working when the library changes.
 *
 * Usage: pnpm --filter tick-knock-examples test
 */
import {testAsteroids} from './asteroids';
import {testBulletHell} from './bulletHell';
import {testCircleIndex} from './circleIndex';
import {testQuadTree} from './quadTree';
import {testSnake} from './snake';
import {testTowerDefense, testTowerDefenseGameOver, testTowerUpgrades} from './towerDefense';

testQuadTree();
testCircleIndex();
testSnake();
testAsteroids();
testBulletHell();
testTowerDefense();
testTowerUpgrades();
testTowerDefenseGameOver();
console.log('Examples work');
