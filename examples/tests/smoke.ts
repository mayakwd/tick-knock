/**
 * Smoke tests of the examples: games are played without rendering and input, with seeded random numbers,
 * so the examples keep working when the library changes.
 *
 * Usage: pnpm --filter tick-knock-examples test
 */
import * as assert from 'node:assert/strict';
import {createAsteroidsGame, Lifetime, Position} from '../asteroids/game';
import {createAutopilot} from '../snake/autopilot';
import {createSnakeGame, FOOD, HEAD, renderSnakeGame, seededRandom} from '../snake/game';

function testSnake(): void {
  const game = createSnakeGame({width: 20, height: 10, random: seededRandom(42)});
  const autopilot = createAutopilot(game);
  let ticks = 0;
  while (!game.isOver && ticks < 5000) {
    autopilot();
    game.tick();
    ticks++;
  }
  assert.ok(game.score >= 10, `autopilot should eat at least 10 food, ate ${game.score}`);
  assert.equal(game.engine.entities.filter((entity) => entity.has(FOOD)).length, 1, 'there is always one food');
  assert.equal(game.engine.entities.filter((entity) => entity.has(HEAD)).length, 1, 'there is one head');
  assert.ok(game.engine.getSystemById('movement') !== undefined, 'systems are found by identifiers');

  if (game.isOver) {
    const frame = renderSnakeGame(game);
    game.tick();
    assert.equal(renderSnakeGame(game), frame, 'the game doesn\'t change after it\'s over');
  }
  console.log(`snake: score ${game.score} in ${ticks} ticks`);
}

function testAsteroids(): void {
  const game = createAsteroidsGame({width: 800, height: 600, random: seededRandom(7)});
  // The ship spins in place and fires all the time
  Object.assign(game.controls, {right: true, fire: true});
  const dt = 1 / 60;
  let seconds = 0;
  for (; seconds < 120 && !game.isOver; seconds += dt) {
    game.update(dt);
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

testSnake();
testAsteroids();
console.log('Examples work');
