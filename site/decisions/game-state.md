# Where to keep game state?

**Short answer:** state of things is kept in components. State of the game, that doesn't belong to any entity, is kept
in plain objects owned by the game or passed to systems, or in systems themselves.

## Not everything must be an entity

It's tempting to make everything an entity: the score, the settings, the current wave. But an entity is useful when
systems query it. If there is always exactly one of something, and only a couple of places need it, an entity adds
nothing but lookups.

In the [Tower defense](/tutorials/tower-defense), gold and lives are a plain object:

```typescript
interface Economy {
  gold: number;
  lives: number;
}
```

The game changes it when messages arrive: systems report kills and escapes, and don't touch gold and lives at all.
When a system needs such state, the game passes the object to its constructor, as described below.

## Dependencies are passed to constructors

Class-based systems receive shared data in their constructors, functional systems read it from the closure:

```typescript
const controls: Controls = {left: false, right: false, thrust: false, fire: false};
engine.addSystem(new ShipControlSystem(controls));
```

It's explicit: looking at the constructor, you see everything the system depends on.

> 💡 Before 5.0, there was `Engine.sharedConfig`, an entity shared by all systems. It was removed: passing data
> explicitly is simpler and typed.

## State of a system stays in the system

The spawn system in the [Bullet hell](/tutorials/bullet-hell) keeps the time of the current wave and the list of
enemies to spawn. Nobody else needs them, so they are fields of the system.

## Static data is just data

The map of the tower defense and descriptions of enemies never change. They are constants in modules, not entities
and not components.
