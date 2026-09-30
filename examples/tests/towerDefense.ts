import * as assert from 'node:assert/strict';
import {Container} from 'pixi.js';
import {Creep, Position, Projectile, Tower} from '../tower-defense/components';
import {createTowerDefenseGame} from '../tower-defense/game';
import {createAutopilot} from '../tower-defense/input/autopilot';
import {addRendering} from '../tower-defense/render/addRendering';
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
  const towers = game.engine.entities.filter((entity) => entity.has(Tower)).length;
  assert.ok(towers >= 5, `the autopilot builds towers, ${towers} built`);
  assert.ok(game.wave >= 5, `waves are defended, wave ${game.wave}`);
  assert.ok(game.economy.lives > 0, 'the autopilot survives first waves');
  for (const entity of game.engine.entities) {
    assert.ok(entity.hasAny(Tower, Creep, Projectile), 'there are no unknown entities');
  }
  console.log(`tower defense: wave ${game.wave}, ${towers} towers, ${game.economy.lives} lives, ${game.economy.gold} gold`);
}
