import * as assert from 'node:assert/strict';
import {Container} from 'pixi.js';
import {Enemy, Position} from '../bullet-hell/components';
import {createBulletHellGame} from '../bullet-hell/game';
import {createAutopilot} from '../bullet-hell/input/autopilot';
import {addRendering} from '../bullet-hell/render/addRendering';
import {ENEMY_BULLET, PLAYER, PLAYER_BULLET} from '../bullet-hell/tags';
import {seededRandom} from '../shared/random';
import {assertViews} from './rendering';

export function testBulletHell(): void {
  const layer = new Container();
  const game = createBulletHellGame({random: seededRandom(3), setup: (engine) => addRendering(engine, layer)});
  const autopilot = createAutopilot(game);
  const dt = 1 / 60;
  let seconds = 0;
  let maxBullets = 0;
  for (; seconds < 90 && !game.isOver; seconds += dt) {
    autopilot();
    game.update(dt);
    const bullets = game.engine.entities.filter((entity) => entity.has(ENEMY_BULLET)).length;
    maxBullets = Math.max(maxBullets, bullets);
    if (Math.round(seconds / dt) % 30 === 0) assertViews(game.engine, layer, 'bullet hell', [Position]);
  }
  assertViews(game.engine, layer, 'bullet hell', [Position]);
  assert.ok(game.score > 0, 'the player destroys enemies');
  assert.ok(game.wave > 1, 'waves change');
  assert.ok(maxBullets > 300, `enemies fire a lot of bullets, ${maxBullets} at most`);
  for (const entity of game.engine.entities) {
    assert.ok(entity.hasAny(PLAYER, PLAYER_BULLET, ENEMY_BULLET, Enemy), 'there are no unknown entities');
  }
  console.log(`bullet hell: score ${game.score}, wave ${game.wave}, up to ${maxBullets} bullets, ` +
    `${game.isOver ? 'destroyed' : 'survived'} after ${Math.round(seconds)} s`);
}
