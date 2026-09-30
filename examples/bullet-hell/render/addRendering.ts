import {Engine, EntitySnapshot} from 'tick-knock';
import {Container} from 'pixi.js';
import {addViews} from '../../shared/render/addViews';
import {View} from '../../shared/render/View';
import {Collider, Enemy, Invulnerable, Position} from '../components';
import {Priority} from '../game';
import {ENEMY_BULLET, PLAYER, PLAYER_BULLET} from '../tags';
import {drawEnemy, drawEnemyBullet, drawPlayer, drawPlayerBullet} from './graphics';

/**
 * Blinks per second of the invulnerable player
 */
const BLINK_RATE = 8;

/**
 * Adds rendering to the game: views are attached to entities by their tags and components
 */
export function addRendering(engine: Engine, layer: Container): void {
  const attach = (draw: () => Container) => ({current}: EntitySnapshot) => {
    current.add(new View(draw()));
  };

  addViews(engine, layer, {position: Position, priority: Priority.Render});
  engine
    .reactive([PLAYER], {added: attach(drawPlayer)}, {id: 'player-view'})
    .reactive([Enemy, Collider], {
      added: ({current}, {kind}, {radius}) => current.add(new View(drawEnemy(kind, radius))),
    }, {id: 'enemy-view'})
    .reactive([PLAYER_BULLET], {added: attach(drawPlayerBullet)}, {id: 'player-bullet-view'})
    .reactive([ENEMY_BULLET], {added: attach(drawEnemyBullet)}, {id: 'enemy-bullet-view'})
    // The invulnerable player blinks, and becomes solid when the component is removed
    .iterative([View, Invulnerable], (entity, dt, {display}, {seconds}) => {
      display.alpha = Math.floor(seconds * BLINK_RATE) % 2 === 0 ? 1 : 0.3;
    }, {priority: Priority.Render, id: 'blinking'})
    .reactive([View, Invulnerable], {
      removed: (snapshot, {display}) => {
        display.alpha = 1;
      },
    }, {id: 'blinking-end'});
}
