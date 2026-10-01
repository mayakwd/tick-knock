import {Container} from 'pixi.js';

/**
 * Visual representation of the entity. Entity factories create it together with the other components, and render
 * systems added after all game systems show it. pixi.js creates display objects without a renderer, so the same game
 * runs in tests without a browser.
 */
export class View {
  public constructor(public readonly display: Container) {}
}
