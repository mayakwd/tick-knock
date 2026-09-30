# Where to keep game state?

**Short answer:** state of things is kept in components. State of the game, that doesn't belong to any entity, is kept
in small classes owned by the game or passed to systems, or in systems themselves.

## Not everything must be an entity

It's tempting to make everything an entity: the score, the settings, the current wave. But an entity is useful when
systems query it. If there is always exactly one of something, and only a couple of places need it, an entity adds
nothing but lookups.

In the [Tower defense](/tutorials/tower-defense), gold and lives are kept by the game:

```typescript
class Economy {
  public gold = START_GOLD;
  public lives = START_LIVES;
}
```

The game changes it when messages arrive: systems report kills and escapes, and don't touch gold and lives at all.
When a system needs such state, it gets it explicitly, as described below.

## Dependencies are explicit

Functional systems read shared data from the closure, class-based systems receive it in their constructors:

```typescript
engine
  .addSystem(new ShipControlSystem(this.controls))
  .iterative([Position, Velocity], (entity, dt, position, velocity) => {
    position.x = wrap(position.x + velocity.x * dt, width);
    position.y = wrap(position.y + velocity.y * dt, height);
  });
```

It's explicit: looking at the closure or at the constructor, you see everything the system depends on.

> 💡 Before 5.0, there was `Engine.sharedConfig`, an entity shared by all systems. It was removed: passing data
> explicitly is simpler and typed.

## State of an entity stays in the entity

Lives of the player in the [Bullet hell](/tutorials/bullet-hell) are a component of the player, and the game doesn't
keep a copy of them. It reads the component when it shows the status: there is one source of truth, and nothing to
keep in sync.

## State of a system stays in the system

The spawn system in the [Bullet hell](/tutorials/bullet-hell) keeps the time of the current wave and the list of
enemies to spawn. Nobody else needs them, so they are fields of the system.

## Static data is just data

The map of the tower defense and descriptions of enemies never change. They are constants in modules, not entities
and not components.
