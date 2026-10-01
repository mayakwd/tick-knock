# Where do views come from?

**Short answer:** a view is a component, and factories create entities with their views. Systems of the game move
entities, and one system after them moves views to their entities.

## A view is a component

A view holds a display object of pixi.js:

```typescript
class View {
  public constructor(public readonly display: Container) {}
}
```

It's created by the factory, together with the other components of the entity:

```typescript
export function createFood(x: number, y: number): Entity {
  return new Entity()
    .add(new Cell(x, y))
    .add(new View(drawFood()))
    .add(FOOD);
}
```

The entity is complete from the start. There is no second place, where views are attached to entities by their kinds,
and no way to forget a view of a new kind of entity.

When a view depends on the state of an entity, it's replaced together with the state. A tower of the
[Tower defense](/tutorials/tower-defense) gets a new view, when an upgrade gives it components of the next level.

## Views follow entities

A reaction system of `View` adds views to the layer, and destroys them when entities are removed or lose their views.
An iterative system of `[View, Position]` moves views to their entities. It's added after all game systems, so views
show entities where the systems have moved them. All examples share this code:

```typescript
addViews(engine, layer, {position: Position});
```

## Running without a screen

pixi.js creates display objects without a renderer, so the game runs without a browser: tests pass it a layer that is
never displayed, and check that every visible entity has a view, and every view is on the layer.
[Snake](/tutorials/snake) is played in the terminal the same way: its views are created, but the grid is printed as
text.
