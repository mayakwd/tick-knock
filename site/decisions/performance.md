# Performance

**Short answer:** typed systems and `forEach` are fast enough for thousands of entities without any tricks. Measure
before optimizing.

## What's fast

- **Typed iteration.** `IterativeSystem.of`, functional systems and `Query.forEach` receive components from dense
  arrays of the query, without looking them up in every entity. It's several times faster than `entity.get` in a loop.
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
enough. When both sides grow to hundreds, put one side into a spatial grid: a plain data structure, rebuilt by a system
every update, not entities.

## Rendering

Rendering is usually slower than the game logic. Share geometry between views that look the same, like bullets in the
examples, and destroy views of removed entities.
