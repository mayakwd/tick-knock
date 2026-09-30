# Keeping rendering apart

**Short answer:** the game logic never creates views. Rendering systems attach views to entities from outside, when
entities appear.

## Why

- The game runs without a browser, so it's easy to test.
- The same game can be rendered differently: [Snake](/tutorials/snake) is rendered with pixi.js in the browser, and as
  text in the terminal.
- Rendering can be replaced or removed without touching the game logic.

## How

A view is a component that holds a display object:

```typescript
class View {
  public constructor(public readonly display: Container) {}
}
```

Reaction systems attach views to entities when they appear:

```typescript
engine.reactive([Asteroid], {
  added: ({current}, asteroid) => current.add(new View(drawAsteroid(asteroid))),
});
```

A reaction system of `View` adds views to the stage, and destroys them when entities are removed. An iterative system
of `[View, Position]` moves views after all game systems have been updated.

## The setup option

Reaction systems are notified only about entities added after them. So rendering must be added before the first
entities of the game are created. The games accept a `setup` option, that is called right before that:

```typescript
const game = createAsteroidsGame({width, height, setup: (engine) => addRendering(engine, layer)});
```

## Testing rendering

pixi.js creates display objects without a renderer, so rendering can be tested without a browser too. The tests of the
examples check that every visible entity has a view, and every view is on the stage.
