import {Container} from 'pixi.js';

/**
 * Visual representation of the entity. Game logic never adds it: render systems attach views to entities,
 * so the same game runs without rendering in tests.
 */
export class View {
  public constructor(public readonly display: Container) {}
}
