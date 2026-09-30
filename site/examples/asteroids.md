# Asteroids

Arrows or WASD to fly, Space to fire, R to restart.

<GameDemo game="asteroids" />

What it shows:

- Lots of entities created and removed every second: bullets with a lifetime, asteroids that split into smaller ones.
- Typed queries with `forEach` in a class-based collision system.
- Safe removal: collided entities lose their colliders immediately, and are removed after the update.
- A reaction system that starts the next wave when the last asteroid is destroyed.
- Collisions reported by messages: the game splits asteroids and counts the score.
- Frame rate independence: movement, drag and the cooldown of the gun.

- [Sources](https://github.com/mayakwd/tick-knock/tree/develop/examples/asteroids)
- [Tutorial](/tutorials/asteroids), that builds this game step by step
