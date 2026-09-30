import * as assert from 'node:assert/strict';
import {Container} from 'pixi.js';
import {Creep, Damage, Position, Projectile, Tower, Weapon} from '../tower-defense/components';
import {createTowerDefenseGame} from '../tower-defense/game';
import {createAutopilot} from '../tower-defense/input/autopilot';
import {addRendering} from '../tower-defense/render/addRendering';
import {TOWERS} from '../tower-defense/towers';
import {View} from '../shared/render/View';
import {assertViews} from './rendering';

export function testTowerDefense(): void {
  const layer = new Container();
  const game = createTowerDefenseGame({setup: (engine) => addRendering(engine, layer)});
  const autopilot = createAutopilot(game);
  assert.equal(game.build('arrow', {column: 0, row: 3}), false, 'towers can\'t be built on the path');

  const dt = 1 / 60;
  let seconds = 0;
  for (; seconds < 240 && !game.isOver; seconds += dt) {
    autopilot();
    game.update(dt);
    if (Math.round(seconds / dt) % 30 === 0) assertViews(game.engine, layer, 'tower defense', [Position], (entity) => entity.get(Position));
  }
  const towerEntities = game.engine.entities.filter((entity) => entity.has(Tower));
  const towers = towerEntities.length;
  assert.ok(towers >= 5, `the autopilot builds towers, ${towers} built`);
  assert.ok(towerEntities.some((entity) => entity.get(Tower)!.level > 0), 'the autopilot upgrades towers');
  for (const entity of towerEntities) {
    const {kind, level} = entity.get(Tower)!;
    const {range, damage} = TOWERS[kind].levels[level];
    const amounts = Array.from(entity.getAll(Damage), ({amount}) => amount);
    assert.equal(entity.get(Weapon)!.range, range, 'weapons match levels of towers');
    assert.deepEqual(amounts, damage.map(({amount}) => amount), 'damage matches levels of towers');
  }
  assert.ok(game.wave >= 5, `waves are defended, wave ${game.wave}`);
  assert.ok(game.economy.lives > 0, 'the autopilot survives first waves');
  for (const entity of game.engine.entities) {
    assert.ok(entity.hasAny(Tower, Creep, Projectile), 'there are no unknown entities');
  }
  console.log(`tower defense: wave ${game.wave}, ${towers} towers, ${game.economy.lives} lives, ${game.economy.gold} gold`);
}

/**
 * Upgrades change components of the tower, and its view is drawn again
 */
export function testTowerUpgrades(): void {
  const layer = new Container();
  const game = createTowerDefenseGame({setup: (engine) => addRendering(engine, layer)});
  const cell = {column: 5, row: 7};
  (game.economy as {gold: number}).gold = 1000;
  assert.ok(game.build('frost', cell), 'a tower is built');
  const tower = game.engine.entities.find((entity) => entity.has(Tower))!;
  const firstView = tower.get(View)!.display;
  const splash = () => tower.find(Damage, ({type, splash}) => type === 'frost' && splash > 0);
  assert.equal(splash(), undefined, 'the first level of frost has no splash');
  assert.equal(game.upgradeCost(cell), TOWERS.frost.levels[1].cost, 'the upgrade costs the next level');
  assert.ok(game.upgrade(cell) && game.upgrade(cell), 'the tower is upgraded twice');
  assert.equal(game.upgradeCost(cell), undefined, 'the last level can\'t be upgraded');
  assert.equal(game.upgrade(cell), false, 'the last level is not upgraded');
  assert.equal(tower.get(Tower)!.level, 2, 'the tower has the last level');
  assert.equal(tower.get(Weapon)!.range, TOWERS.frost.levels[2].range, 'the weapon has the range of the last level');
  assert.notEqual(splash(), undefined, 'the last level of frost freezes creeps around the target');
  assert.equal(tower.lengthOf(Damage), TOWERS.frost.levels[2].damage.length, 'damage of previous levels is replaced');
  assert.notEqual(tower.get(View)!.display, firstView, 'the view is drawn again after the upgrade');
  assert.equal(firstView.destroyed, true, 'the previous view is destroyed');
  assert.equal(game.economy.gold, 1000 - TOWERS.frost.levels.reduce((sum, {cost}) => sum + cost, 0), 'gold is spent');
  console.log('tower defense: upgrades work');
}
