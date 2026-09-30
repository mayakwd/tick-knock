import * as assert from 'node:assert/strict';
import {Container} from 'pixi.js';
import {seededRandom} from '../shared/random';
import {Position} from '../snake/components';
import {createSnakeGame} from '../snake/game';
import {createAutopilot} from '../snake/input/autopilot';
import {addRendering} from '../snake/render/addRendering';
import {CELL} from '../snake/render/graphics';
import {renderSnakeGame} from '../snake/render/text';
import {FOOD, HEAD} from '../snake/tags';
import {assertViews} from './rendering';

export function testSnake(): void {
  const layer = new Container();
  const game = createSnakeGame({width: 20, height: 10, random: seededRandom(42), setup: (engine) => addRendering(engine, layer)});
  const autopilot = createAutopilot(game);
  let ticks = 0;
  const checkViews = () => assertViews(game.engine, layer, 'snake', [Position], (entity) => {
    const position = entity.get(Position);
    return position && {x: position.x * CELL, y: position.y * CELL};
  });
  checkViews();
  while (!game.isOver && ticks < 5000) {
    autopilot();
    game.tick();
    ticks++;
    checkViews();
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
