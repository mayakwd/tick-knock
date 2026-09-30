import {EntitySnapshot, ReactionSystem} from 'tick-knock';
import {Container} from 'pixi.js';
import {View} from './View';

/**
 * Adds views of entities to the layer and destroys them when entities are removed or lose their views
 */
export class ViewSystem extends ReactionSystem.of(View) {
  public constructor(private readonly layer: Container) {
    super();
  }

  protected entityAdded = (snapshot: EntitySnapshot, {display}: View) => {
    this.layer.addChild(display);
  };

  protected entityRemoved = (snapshot: EntitySnapshot, {display}: View) => {
    display.destroy({children: true});
  };
}
