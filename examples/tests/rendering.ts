import * as assert from 'node:assert/strict';
import {Class, Engine, Entity, Tag} from 'tick-knock';
import {Container} from 'pixi.js';
import {View} from '../shared/render/View';

/**
 * Position of the view of an entity in pixels, or undefined if the entity has no position
 */
export type ExpectedPosition = (entity: Entity) => { x: number; y: number } | undefined;

/**
 * Checks that visible entities have views, every view is displayed at the position of its entity, and views of
 * removed entities are removed. pixi.js creates display objects without a renderer, so rendering is checked without
 * a browser.
 *
 * @param visible Components and tags of entities, that must have views
 * @param expectedPosition Position where the view of an entity must be displayed
 */
export function assertViews(
  engine: Engine,
  layer: Container,
  name: string,
  visible: Array<Class<unknown> | Tag>,
  expectedPosition: ExpectedPosition,
): void {
  for (const entity of engine.entities) {
    if (entity.hasAny(...visible)) assert.ok(entity.has(View), `${name}: visible entities have views`);
    const view = entity.get(View);
    const position = expectedPosition(entity);
    if (view === undefined || position === undefined) continue;
    assert.ok(
      Math.abs(view.display.x - position.x) < 1e-6 && Math.abs(view.display.y - position.y) < 1e-6,
      `${name}: views are displayed at positions of their entities`,
    );
  }
  const views = engine.entities.filter((entity) => entity.has(View)).map((entity) => entity.get(View)!.display);
  assert.equal(layer.children.length, views.length, `${name}: every view is on the layer`);
  for (const display of views) {
    assert.ok(layer.children.includes(display), `${name}: views of entities are displayed`);
  }
}
