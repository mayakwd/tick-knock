import {Engine} from 'tick-knock';
import {Container} from 'pixi.js';
import {addViews} from '../../shared/render/addViews';
import {View} from '../../shared/render/View';
import {Creep, Health, Payload, Poison, Position, Projectile, Slow, Tower} from '../components';
import {Priority} from '../game';
import {CreepView} from './CreepView';
import {CreepViewRef} from './CreepViewRef';
import {drawProjectile, drawTower} from './graphics';

/**
 * Adds rendering to the game: views are attached to towers, creeps and projectiles when they appear
 */
export function addRendering(engine: Engine, layer: Container): void {
  addViews(engine, layer, {position: Position, priority: Priority.Render});
  engine
    // An upgrade replaces the Tower component, so the tower is drawn again with its new level
    .reactive([Tower], {added: ({current}, {kind, level}) => current.add(new View(drawTower(kind, level)))}, {id: 'tower-view'})
    .reactive([Creep], {
      added: ({current}) => {
        const view = new CreepView();
        current.add(new View(view)).add(new CreepViewRef(view));
      },
    }, {id: 'creep-view'})
    .reactive([Projectile, Payload], {added: ({current}, projectile, payload) => current.add(new View(drawProjectile(payload)))}, {id: 'projectile-view'})
    .iterative([CreepViewRef, Health], (creep, dt, {view}, health) => {
      view.setHealth(health.value / health.max);
      view.setEffects(creep.has(Slow), creep.has(Poison));
    }, {priority: Priority.Render, id: 'creep-status'});
}
