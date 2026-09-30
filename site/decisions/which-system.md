# Which system?

**Short answer:**

- Logic for every entity with some components, without state or dependencies — a functional system,
  `engine.iterative`.
- The same, but with dependencies or state — `IterativeSystem.of(...)`.
- Logic that runs when entities appear or disappear — `engine.reactive` or `ReactionSystem.of(...)`.
- Logic that works with several queries at once, or with no entities at all — `System`.

## Functional systems

Most logic is small: move things, count down timers, remove expired entities. It doesn't need a class:

```typescript
engine.iterative([Lifetime], (entity, dt, lifetime) => {
  lifetime.seconds -= dt;
  if (lifetime.seconds <= 0) engine.removeEntity(entity);
});
```

A functional system can live in its own file as a function returning `IterativeUpdate`, and receive what it needs as
arguments, like `movement(width, height)` in [Asteroids](/tutorials/asteroids).

## Class-based iterative systems

When a system has dependencies, like controls or a random number generator, or its own state, it's a class:

```typescript
class ShipControlSystem extends IterativeSystem.of(Ship, Position, Velocity, Rotation) {
  public constructor(private readonly controls: Controls) {
    super();
  }

  protected updateEntity(entity: Entity, dt: number, ship: Ship, position: Position, velocity: Velocity, rotation: Rotation) {
    // ...
  }
}
```

A class is also needed when the system has additional queries: they are added to the engine in `onAddedToEngine`,
like the query of the player in the emitter system of the [Bullet hell](/tutorials/bullet-hell).

## Reaction systems

Some logic runs not every frame, but when something changes: a view is created when an entity appears, new food
appears when the old one is eaten, the next wave starts when the last enemy is gone.

```typescript
engine.reactive([Position, FOOD], {removed: spawnFood});
```

A reaction system is notified only about changes that happen after it has been added. If entities already exist,
override `prepare` in a class-based reaction system to handle them, or add the system before the entities, as the
examples do with the `setup` option.

## Plain systems

Some systems don't process entities one by one:

- The collision system in [Asteroids](/tutorials/asteroids) checks pairs of entities from different queries.
- The spawn system in the [Bullet hell](/tutorials/bullet-hell) creates entities by a timeline, and doesn't iterate
  anything.

They extend `System` and implement `update`.
