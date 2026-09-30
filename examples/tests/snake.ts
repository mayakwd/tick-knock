import * as assert from 'node:assert/strict';
import {Container} from 'pixi.js';
import {seededRandom} from '../shared/random';
import {Cell} from '../snake/components';
import {SnakeGame} from '../snake/game';
import {SnakeAutopilot} from '../snake/input/autopilot';
import {CELL} from '../snake/config';
import {renderSnakeGame} from '../snake/render/text';
import {FOOD, HEAD} from '../snake/tags';
import {assertViews} from './rendering';

export function testSnake(): void {
  const layer = new Container();
  const game = new SnakeGame({width: 20, height: 10, layer, random: seededRandom(42)});
  const autopilot = new SnakeAutopilot(game);
  let ticks = 0;
  const checkViews = () => assertViews(game.engine, layer, 'snake', [Cell], (entity) => {
    const cell = entity.get(Cell);
    return cell && {x: cell.x * CELL, y: cell.y * CELL};
  });
  checkViews();
  while (!game.isOver && ticks < 5000) {
    autopilot.update();
    game.tick();
    ticks++;
    checkViews();
  }
  assert.ok(game.score >= 10, `autopilot should eat at least 10 food, ate ${game.score}`);
  assert.equal(game.engine.entities.filter((entity) => entity.has(FOOD)).length, 1, 'there is always one food');
  assert.equal(game.engine.entities.filter((entity) => entity.has(HEAD)).length, 1, 'there is one head');

  if (game.isOver) {
    const frame = renderSnakeGame(game);
    game.tick();
    assert.equal(renderSnakeGame(game), frame, 'the game doesn\'t change after it\'s over');
  }
  console.log(`snake: score ${game.score} in ${ticks} ticks`);
}
