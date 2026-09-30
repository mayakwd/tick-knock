# Which system?

**Short answer:**

- A few lines of logic for every entity with some components — a functional system, `engine.iterative`, written
  right where it's added to the engine.
- Logic that is bigger than a few lines, or has its own state or queries — a class, `IterativeSystem.of(...)`, in its
  own file, with a name that says what it does.
- Logic that runs when entities appear or disappear — `engine.reactive` or `ReactionSystem.of(...)`.
- Logic that works with several queries at once, or with no entities at all — `System`.

## Functional systems

Some logic is tiny: move things, count down timers, remove expired entities. It doesn't need a class:

```typescript
engine.iterative([Lifetime], (entity, dt, lifetime) => {
  lifetime.seconds -= dt;
  if (lifetime.seconds <= 0) engine.removeEntity(entity);
});
```

That's what the builder is for: a system of a few lines is written in place, next to the other systems of the game.
A functional system is a closure, so it uses anything in scope without passing it around: the engine, the size of the
screen, a query of the player, like the aimed pattern in the [Bullet hell](/tutorials/bullet-hell).

## Class-based systems

When a system is more than a few lines, a function in the middle of the game becomes a wall of code. A class has
a name, that says what the system does, and a file of its own:

```typescript
class CollisionSystem extends IterativeSystem.of(Cell, Heading, HEAD) {
  public constructor(private readonly grid: Grid) {
    super();
  }

  protected updateEntity(head: Entity, dt: number, cell: Cell, heading: Heading): void {
    // ...
  }
}
```

Its dependencies, like controls or an index, are passed to the constructor. A class also keeps its own queries: it adds
them to the engine in `onAddedToEngine` and removes them in `onRemovedFromEngine`, so they live exactly as long as the
system.

Keep one system for one thing. The head of [Snake](/tutorials/snake) collides, moves and eats in three systems, not in
one: every system is short, and its name tells what it does.

## Order of systems

Systems are updated in the order they are added, so the game reads as the update goes:

```typescript
engine
  .addSystem(new CollisionSystem(grid))
  .addSystem(new MovementSystem())
  .addSystem(new EatingSystem(grid));
```

Priorities and identifiers are optional: `addSystem(system, {priority, id})`. Use a priority when a system must be
added out of order, for example by a plugin, and an identifier when the system is found or removed later.

## Reaction systems

Some logic runs not every frame, but when something changes: new food appears when the old one is eaten, the next
wave starts when the last enemy is gone.

```typescript
engine.reactive([Cell, FOOD], {removed: () => this.spawnFood()});
```

Indexes are kept the same way: the grid of [Snake](/tutorials/snake) and spatial indexes of the
[Tower defense](/tutorials/tower-defense) are maintained by reaction systems on the `Cell` component, and don't need
an update at all.

A reaction system is notified only about changes that happen after it has been added. If entities already exist,
override `prepare` in a class-based reaction system to handle them, or add the system before the entities, as the
examples do: games add all systems in their constructors, and create the first entities after them.

## Plain systems

Some systems don't process entities one by one:

- The collision system in [Asteroids](/tutorials/asteroids) checks pairs of entities from different queries.
- The spawn system in the [Bullet hell](/tutorials/bullet-hell) creates entities by a timeline, and doesn't iterate
  anything.

They extend `System` and implement `update`.
