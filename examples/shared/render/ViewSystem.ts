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
    this.destroy(display);
  };

  /**
   * Destroys the display object with its children. Every object is destroyed without options, so graphics release
   * their own geometry, while geometry shared by several graphics is kept.
   */
  private destroy(display: Container): void {
    for (const child of [...display.children]) this.destroy(child);
    display.destroy();
  }
}
