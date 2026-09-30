# Which system?

**Short answer:**

- Logic for every entity with some components — a functional system, `engine.iterative`, written right where it's
  added to the engine. It reads anything it needs from the closure: controls, settings, queries of the game.
- Logic with its own state or its own queries — `IterativeSystem.of(...)` in its own file.
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

Dependencies don't make a system a class. The ship control of [Asteroids](/tutorials/asteroids) reads the controls of
the game from the closure, and it's twenty lines in place:

```typescript
engine.iterative([Position, Velocity, Rotation, Gun, SHIP], (ship, dt, position, velocity, rotation, gun) => {
  const {left, right, thrust, fire} = controls;
  // ...
});
```

> 💡 Don't move a small system into its own file just to make the game file shorter. When a system gets its own
> state or its own queries, make it a class.

## Class-based systems

When a system has its own state or its own queries, it's a class in its own file. It adds its queries to the engine in
`onAddedToEngine` and removes them in `onRemovedFromEngine`, so they live exactly as long as the system:

```typescript
class CollisionSystem extends System {
  private readonly bullets = new QueryBuilder().contains(Position, Collider, BULLET).build();
  private readonly asteroids = new QueryBuilder().contains(Position, Collider, Asteroid).build();

  public onAddedToEngine(): void {
    this.engine.addQuery(this.bullets).addQuery(this.asteroids);
  }

  // ...
}
```

Data the system needs from the game, like the size of the screen, is passed to the constructor.

## Reaction systems

Some logic runs not every frame, but when something changes: a view is created when an entity appears, new food
appears when the old one is eaten, the next wave starts when the last enemy is gone.

```typescript
engine.reactive([Position, FOOD], {removed: spawnFood});
```

Indexes are kept the same way: the grid of [Snake](/tutorials/snake) and spatial indexes of the
[Tower defense](/tutorials/tower-defense) are maintained by reaction systems on the `Cell` component, and don't need
an update at all.

A reaction system is notified only about changes that happen after it has been added. If entities already exist,
override `prepare` in a class-based reaction system to handle them, or add the system before the entities, as the
examples do with the `setup` option.

## Plain systems

Some systems don't process entities one by one:

- The collision system in [Asteroids](/tutorials/asteroids) checks pairs of entities from different queries.
- The spawn system in the [Bullet hell](/tutorials/bullet-hell) creates entities by a timeline, and doesn't iterate
  anything.

They extend `System` and implement `update`.
