import * as assert from 'node:assert/strict';
import {Container} from 'pixi.js';
import {Cell} from '../shared/components/Cell';
import {Position} from '../shared/components/Position';
import {GameOver} from '../shared/ecs/GameOver';
import {seededRandom} from '../shared/random';
import {View} from '../shared/render/View';
import {Payload, Projectile, Target, Tower, Weapon} from '../tower-defense/components';
import {TOWERS} from '../tower-defense/data/towers';
import {CREEP, SPAWNER} from '../tower-defense/tags';
import {BuildOrder, TowerDefenseControls, UpgradeOrder} from '../tower-defense/TowerDefenseControls';
import {TowerDefenseGame} from '../tower-defense/TowerDefenseGame';
import {play} from './play';
import {assertViews} from './rendering';

/**
 * The autopilot builds and upgrades towers, and defends waves
 */
export function testTowerDefense(): void {
  const layer = new Container();
  const game = new TowerDefenseGame({layer, controls: new TowerDefenseControls(), random: seededRandom(1)});
  assert.equal(game.construction.canBuild('arrow', new Cell(0, 3)), false, 'towers can\'t be built on the path');

  // Views are checked twice a second
  let nextCheck = 0;
  play(game, 240, (time) => {
    if (time < nextCheck) return;
    assertViews(game.engine, layer, 'tower defense', [Position], (entity) => entity.get(Position));
    nextCheck += 0.5;
  });

  const towers = game.engine.entities.filter((entity) => entity.has(Tower));
  assert.ok(towers.length >= 5, `the autopilot builds towers, ${towers.length} built`);
  assert.ok(towers.some((entity) => entity.get(Tower)?.level !== 0), 'the autopilot upgrades towers');
  for (const entity of towers) {
    const tower = entity.get(Tower);
    assert.ok(tower !== undefined);
    const {range, payload} = TOWERS[tower.kind].levels[tower.level];
    assert.equal(entity.get(Weapon)?.range, range, 'weapons match levels of towers');
    assert.equal(entity.get(Payload)?.damage, payload.damage, 'payloads match levels of towers');
  }

  const {lives, gold} = game.state;
  const {wave} = game;
  assert.ok(wave >= 5, `waves are defended, wave ${wave}`);
  assert.ok(lives > 0 && !game.isOver, 'the autopilot survives first waves');
  for (const entity of game.engine.entities) {
    assert.ok(entity.hasAny(Tower, CREEP, Projectile, SPAWNER), 'there are no unknown entities');
  }
  console.log(`tower defense: wave ${wave}, ${towers.length} towers, ${lives} lives, ${gold} gold`);
}

/**
 * Orders of the player build and upgrade towers, upgrades change components of the tower, and its view is drawn again
 */
export function testTowerUpgrades(): void {
  const controls = new TowerDefenseControls();
  // The player plays, so the autopilot doesn't order anything
  controls.pilot = 'player';
  const game = new TowerDefenseGame({layer: new Container(), controls, random: seededRandom(2)});
  const {construction, state} = game;
  const cell = new Cell(5, 7);
  state.gold = 1000;

  // An order is carried out in the next update
  const dt = 1 / 60;
  controls.order = new BuildOrder('frost', cell);
  game.update(dt);
  assert.equal(controls.order, undefined, 'the order is carried out');
  assert.equal(state.gold, 1000 - TOWERS.frost.levels[0].cost, 'gold is spent');
  const entry = construction.towerAt(cell);
  assert.ok(entry !== undefined, 'a tower is built');
  const tower = entry.entity;
  assert.equal(tower.get(Payload)?.impact.kind, 'single', 'the first level of frost hits only the target');
  assert.equal(construction.upgradeAt(cell)?.level, TOWERS.frost.levels[1], 'the next level is the second one');

  // The tower waits for the first creep, and keeps it as the target after upgrades
  for (let time = 0; time < 30 && !tower.has(Target); time += dt) game.update(dt);
  const firstView = tower.get(View)?.display;
  const target = tower.get(Target);
  assert.ok(target !== undefined, 'the tower has a target');

  const upgrade = (): void => {
    controls.order = new UpgradeOrder(cell);
    game.update(dt);
  };
  upgrade();
  upgrade();
  assert.equal(construction.upgradeAt(cell), undefined, 'the last level can\'t be upgraded');
  const spent = state.gold;
  upgrade();
  assert.equal(state.gold, spent, 'the last level is not upgraded');

  assert.equal(tower.get(Tower)?.level, 2, 'the tower has the last level');
  assert.equal(tower.get(Weapon)?.range, TOWERS.frost.levels[2].range, 'the weapon has the range of the last level');
  const payload = tower.get(Payload);
  assert.equal(payload?.impact.kind, 'splash', 'the last level of frost freezes creeps around the target');
  assert.ok(payload.effects.some(({kind}) => kind === 'slow'), 'the last level of frost slows creeps');
  assert.equal(tower.get(Target), target, 'the upgraded tower keeps its target');
  assert.notEqual(tower.get(View)?.display, firstView, 'the view is drawn again after the upgrade');
  assert.equal(firstView?.destroyed, true, 'the previous view is destroyed');
  console.log('tower defense: upgrades work');
}

/**
 * The game is lost when the last life is lost: the message is dispatched once, and the world freezes
 */
export function testTowerDefenseGameOver(): void {
  const controls = new TowerDefenseControls();
  // Nobody builds towers, so the first creep escapes
  controls.pilot = 'player';
  const game = new TowerDefenseGame({layer: new Container(), controls, random: seededRandom(3)});
  game.state.lives = 1;
  const messages: GameOver[] = [];
  game.engine.subscribe(GameOver, (message) => messages.push(message));

  const time = play(game, 120);
  assert.ok(game.isOver, 'the game is over');
  assert.equal(game.state.outcome, 'lost', 'the game is lost');
  assert.deepEqual(messages, [new GameOver('lost')], 'GameOver is dispatched once');

  const creep = game.engine.entities.find((entity) => entity.has(CREEP));
  const position = creep?.get(Position);
  assert.ok(position !== undefined, 'creeps are on the path');
  const {x, y} = position;
  play(game, 1);
  assert.deepEqual({x: position.x, y: position.y}, {x, y}, 'the world freezes after the game is over');
  assert.equal(messages.length, 1, 'GameOver is not dispatched again');
  console.log(`tower defense: lost after ${time.toFixed(1)} s without towers`);
}
