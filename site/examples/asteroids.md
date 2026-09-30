# Asteroids

Arrows or WASD to fly, Space to fire, R to restart.

<GameDemo game="asteroids" />

What it shows:

- Lots of entities created and removed every second: bullets with a lifetime, asteroids that split into smaller ones.
- Typed queries with `forEach` in a class-based collision system.
- Destruction with a tag: collided entities are destroyed, lose their colliders immediately, and are removed after
  the update.
- A system of destroyed asteroids, that splits them into smaller ones.
- A spawn system, that starts the next wave when the last asteroid is gone.
- A quad tree of asteroids, kept up to date by a system.
- Frame rate independence: movement, drag and the cooldown of firing.

- [Sources](https://github.com/mayakwd/tick-knock/tree/develop/examples/asteroids)
- [Tutorial](/tutorials/asteroids), that builds this game step by step
