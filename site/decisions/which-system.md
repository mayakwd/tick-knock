# Which system?

**Short answer:**

- Small logic for every entity with some components — a functional system, `engine.iterative`, written right where
  it's added to the engine.
- Bigger logic, or logic with its own state — `IterativeSystem.of(...)` in its own file.
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

That's what the builder is for: a system of a few lines is written in place, next to the other systems of the game,
and the whole game loop is seen at once. A functional system is a closure, so it uses anything in scope without
passing it around: the engine, the size of the screen, a query of the player, like the aimed pattern in the
[Bullet hell](/tutorials/bullet-hell).

> 💡 Don't move a small system into its own file just to make the game file shorter. When a system grows, or gets its
> own state, make it a class.

## Class-based iterative systems

When a system is bigger, or has its own state, it's a class in its own file. Its dependencies, like controls, are
passed to the constructor:

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

When a class needs additional queries, it adds them to the engine in `onAddedToEngine`.

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
