# What's new in 5.0

- **Faster.** Queries store entities and their components in dense arrays, so iteration, adding and removing entities
  and component changes are several times faster, and entities take ~4x less memory. See [Performance](/benchmarks).
- **Typed queries.** `QueryBuilder` infers types of components, and `Query.forEach` passes them to the callback:

  ```typescript
  const movable = new QueryBuilder().contains(Position, Velocity).build(); // Query<[Position, Velocity]>
  engine.addQuery(movable);
  movable.forEach((entity, position, velocity) => {
    position.x += velocity.x;
  });
  ```

- **Typed systems.** `IterativeSystem.of` and `ReactionSystem.of` create base classes of systems, which receive
  components of the entity with inferred types, no more `entity.get(Position)!`:

  ```typescript
  class MovementSystem extends IterativeSystem.of(Position, Velocity) {
    protected updateEntity(entity: Entity, dt: number, position: Position, velocity: Velocity) {
      position.x += velocity.x * dt;
    }
  }
  ```

- **Functional systems.** Small systems don't need a class at all:

  ```typescript
  engine
    .iterative([Position, Velocity], (entity, dt, position, velocity) => {
      position.x += velocity.x * dt;
    })
    .reactive([View, Position], {
      added: (snapshot, view, position) => stage.addChild(view.sprite),
      removed: (snapshot, view) => stage.removeChild(view.sprite),
    });
  ```

- **System identifiers.** Systems are added with options `{priority, id}`, found with `engine.getSystemById(id)` and
  removed with `engine.removeSystem(id)`.
- **Safe removal by default.** Entities removed during the update are removed after all systems have been updated,
  so systems never see half-removed entities.
- **Examples and benchmarks.** The repository contains [Examples](/examples/) of simple games and benchmarks comparing tick-knock
  with other ECS libraries.

See [CHANGELOG](https://github.com/mayakwd/tick-knock/blob/develop/CHANGELOG.md) for the full list of changes.
