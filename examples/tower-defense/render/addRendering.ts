import {Engine} from 'tick-knock';
import {Container} from 'pixi.js';
import {View} from '../../shared/render/View';
import {ViewSystem} from '../../shared/render/ViewSystem';
import {Creep, Health, Poison, Position, Projectile, Slow, Tower} from '../components';
import {Priority} from '../game';
import {CreepView} from './CreepView';
import {drawProjectile, drawTower} from './graphics';

/**
 * Adds rendering to the game: views are attached to towers, creeps and projectiles when they appear
 */
export function addRendering(engine: Engine, layer: Container): void {
  engine
    .addSystem(new ViewSystem(layer), {id: 'views'})
    .reactive([Tower], {added: ({current}, {kind}) => current.add(new View(drawTower(kind)))}, {id: 'tower-view'})
    .reactive([Creep], {added: ({current}) => current.add(new View(new CreepView()))}, {id: 'creep-view'})
    .reactive([Projectile], {added: ({current}, {kind}) => current.add(new View(drawProjectile(kind)))}, {id: 'projectile-view'})
    // A new view is placed right away, and follows its entity after all game systems have been updated
    .reactive([View, Position], {added: (snapshot, view, position) => place(view, position)}, {id: 'view-placement'})
    .iterative([View, Position], (entity, dt, view, position) => place(view, position), {priority: Priority.Render, id: 'view-position'})
    .iterative([View, Health, Creep], (entity, dt, {display}, health) => {
      const view = display as CreepView;
      view.setHealth(health.value / health.max);
      view.setEffects(entity.has(Slow), entity.has(Poison));
    }, {priority: Priority.Render, id: 'creep-status'});
}

function place({display}: View, {x, y}: Position): void {
  display.position.set(x, y);
}
