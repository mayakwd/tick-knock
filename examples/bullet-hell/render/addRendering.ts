import {Engine, EntitySnapshot} from 'tick-knock';
import {Container} from 'pixi.js';
import {View} from '../../shared/render/View';
import {ViewSystem} from '../../shared/render/ViewSystem';
import {Enemy, Invulnerable, Position} from '../components';
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

  engine
    .addSystem(new ViewSystem(layer), {id: 'views'})
    .reactive([PLAYER], {added: attach(drawPlayer)}, {id: 'player-view'})
    .reactive([Enemy], {added: ({current}, {kind}) => current.add(new View(drawEnemy(kind)))}, {id: 'enemy-view'})
    .reactive([PLAYER_BULLET], {added: attach(drawPlayerBullet)}, {id: 'player-bullet-view'})
    .reactive([ENEMY_BULLET], {added: attach(drawEnemyBullet)}, {id: 'enemy-bullet-view'})
    // A new view is placed right away, and follows its entity after all game systems have been updated
    .reactive([View, Position], {added: (snapshot, view, position) => place(view, position)}, {id: 'view-placement'})
    .iterative([View, Position], (entity, dt, view, position) => place(view, position), {priority: Priority.Render, id: 'view-position'})
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

function place({display}: View, {x, y}: Position): void {
  display.position.set(x, y);
}
