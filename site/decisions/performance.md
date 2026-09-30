# Performance

**Short answer:** typed systems and `forEach` are fast enough for thousands of entities without any tricks. Measure
before optimizing.

## What's fast

- **Typed iteration.** `IterativeSystem.of`, functional systems and `Query.forEach` receive components from dense
  arrays of the query, without looking them up in every entity. It's several times faster than `entity.get` in a loop,
  and doesn't allocate, whatever the number of components is.
- **Queries built by `QueryBuilder`.** The engine knows which components and tags they depend on, and updates only them
  when a component changes. Queries created from predicates are checked on every change of every entity.
- **Adding and removing entities.** Membership checks, adding and removing are O(1).

See [Benchmarks](/benchmarks) for numbers.

## What to avoid

- Predicate queries in hot paths, when `QueryBuilder` can describe the same query.
- `entity.invalidate()` every frame.
- Iterating `engine.entities` to find something. Keep a query instead.

## Many-to-many checks

Checking every entity against every other one is O(n²). In the [Bullet hell](/tutorials/bullet-hell) hundreds of
bullets are checked against one player, and a dozen of enemies against a few dozen of bullets, so plain loops are
enough.

Before reaching for a spatial structure, check whether the work can be done less often. Towers of the
[Tower defense](/tutorials/tower-defense) keep their targets instead of looking for a target on every shot.

When one side has to look for nearby entities of the other one, use a spatial index: entities in buckets by cells, and
cells numbered, not keyed by strings. It's an index of a component, not a separate state to keep in sync by hand:

- The position in the index is a component, like `Cell`. It's immutable, and an entity that crosses into another cell
  gets a new one: `creep.add(new Cell(column, row))`. A new component is created only when the cell changes, not every
  frame.
- A reaction system on this component maintains the index: it adds an entity when the entity gets a cell, and removes
  it when it loses one. Replacing the component is seen as removing the old cell and adding the new one.
- A search is a request to the index: only cells around the point are checked.

```typescript
engine.reactive([Cell, Health, Creep], {
  added: ({current}, cell) => creeps.add(cell, current),
  removed: ({current}, cell) => creeps.remove(cell, current),
});

creeps.forEachWithin(tower, range, (creep) => {
  // only creeps in range
});
```

The [Tower defense](/tutorials/tower-defense) finds targets of towers and creeps hit by explosions this way, and
[Snake](/tutorials/snake) finds what occupies a cell with a grid built the same way.

Sometimes the shape of the game gives an even better index. Creeps of a tower defense follow one path, so the part of
the path covered by a tower can be computed once, when the tower is built, and a tower compares the distance creeps
have passed with it, without any geometry per frame.

## Rendering

Rendering is usually slower than the game logic. Share geometry between views that look the same, like bullets in the
examples, and destroy views of removed entities.
