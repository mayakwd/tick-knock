import * as assert from 'node:assert/strict';
import {Container} from 'pixi.js';
import {Lifetime, Position} from '../asteroids/components';
import {AsteroidsGame} from '../asteroids/game';
import {AsteroidsAutopilot} from '../asteroids/input/autopilot';
import {seededRandom} from '../shared/random';
import {assertViews} from './rendering';

export function testAsteroids(): void {
  const layer = new Container();
  const game = new AsteroidsGame({width: 800, height: 600, layer, random: seededRandom(7)});
  const autopilot = new AsteroidsAutopilot(game);
  const dt = 1 / 60;
  let seconds = 0;
  for (; seconds < 120 && !game.isOver; seconds += dt) {
    autopilot.update();
    game.update(dt);
    assertViews(game.engine, layer, 'asteroids', [Position], (entity) => entity.get(Position));
    for (const entity of game.engine.entities) {
      const position = entity.get(Position)!;
      assert.ok(Number.isFinite(position.x) && Number.isFinite(position.y), 'positions are finite');
      assert.ok(position.x >= 0 && position.x < 800 && position.y >= 0 && position.y < 600, 'entities wrap around');
    }
  }
  assert.ok(game.score > 0, 'the ship destroys asteroids');
  const bullets = game.engine.entities.filter((entity) => entity.has(Lifetime)).length;
  assert.ok(bullets <= 6, `expired bullets are removed, ${bullets} bullets alive`);
  console.log(`asteroids: score ${game.score}, wave ${game.wave}, ${game.isOver ? 'destroyed' : 'survived'} after ${Math.round(seconds)} s`);
}
