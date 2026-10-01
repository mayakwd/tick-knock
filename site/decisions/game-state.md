# Where to keep game state?

**Short answer:** state of things is kept in components. State of the game, that doesn't belong to any entity, is kept
in small classes owned by the game or passed to systems, or in systems themselves.

## Not everything must be an entity

It's tempting to make everything an entity: the score, the settings, the current wave. But an entity is useful when
systems query it. If there is always exactly one of something, and only a couple of places need it, an entity adds
nothing but lookups.

In the [Tower defense](/tutorials/tower-defense), gold and lives are kept in the state of the game:

```typescript
class TowerDefenseState extends GameState {
  public gold = START_GOLD;
  public lives = START_LIVES;
  public wave = 1;
}
```

Systems, that change gold and lives, receive the state explicitly: a killed creep gives gold, and the escape system
takes a life, when a creep escapes.

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

## State of an entity stays in the entity

Lives of the player in the [Bullet hell](/tutorials/bullet-hell) are a component of the player, and the game doesn't
keep a copy of them. It reads the component when it shows the status: there is one source of truth, and nothing to
keep in sync.

The same goes for everything, that can be read from entities. The score of [Snake](/tutorials/snake) is the length the
snake has grown by, and the game of [Asteroids](/tutorials/asteroids) is over when there is no ship:

```typescript
public get isOver(): boolean {
  return this.ships.isEmpty;
}
```

## State of a process is an entity

Waves of the [Tower defense](/tutorials/tower-defense) have a timer and progress: the time until the next creep, and
creeps left to release. Is it the state of the spawn system? It's tempting to keep it in fields of the system, but then
the system isn't a pure function of components anymore, and nobody else can see the progress.

Make the process an entity instead. The spawner is an entity with the `SPAWNER` tag, a `Cooldown` and `WaveStats`.
The spawn system releases creeps when the cooldown is over, the next wave system starts the next wave, and the game
reads the number of the wave from the same component to show it. Systems keep no state, and the shared
`CooldownSystem` counts down the spawner together with the towers.

## Static data is just data

The map of the tower defense and descriptions of enemies never change. They are constants in modules, not entities
and not components.
