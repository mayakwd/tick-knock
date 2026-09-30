import * as assert from 'node:assert/strict';
import {Class, Engine, Tag} from 'tick-knock';
import {Container} from 'pixi.js';
import {View} from '../shared/render/View';


/**
 * Checks that visible entities have views, every view is displayed, and views of removed entities are removed.
 * pixi.js creates display objects without a renderer, so rendering is checked without a browser.
 */
export function assertViews(engine: Engine, layer: Container, name: string, visible: Array<Class<unknown> | Tag>): void {
  for (const entity of engine.entities) {
    if (entity.hasAny(...visible)) assert.ok(entity.has(View), `${name}: visible entities have views`);
  }
  const views = engine.entities.filter((entity) => entity.has(View)).map((entity) => entity.get(View)!.display);
  assert.equal(layer.children.length, views.length, `${name}: every view is on the layer`);
  for (const display of views) {
    assert.ok(layer.children.includes(display), `${name}: views of entities are displayed`);
  }
}
