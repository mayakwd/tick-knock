# Bullet hell

Bullet hell is a shooter where the screen is filled with bullets, and the player dodges them with a tiny ship. It's a
good test for an ECS: hundreds of entities are created, moved, checked for collisions and removed every second.

This tutorial is also about **data-driven design**: enemies are described by data, and the same systems handle all of
them. A new kind of enemy is a new description, not new code.

<GameDemo game="bullet-hell" />

## The plan

- The **player** moves in all directions, can move slowly for precise dodging, and fires.
- **Enemies** descend from the top, some of them sway from side to side, and they fire bullets in patterns: rings,
  spirals and fans aimed at the player.
- **Bullets** fly straight and disappear when they leave the screen.
- The player has three **lives**. After a hit the player is **invulnerable** for two seconds, and all enemy bullets
  disappear, so there is a chance to recover.
- **Waves** of enemies follow each other. When all waves are over, they repeat with stronger enemies.

## Components

Most components are familiar: position, velocity, collider, health.

<<< @/../examples/bullet-hell/components/Position.ts

<<< @/../examples/bullet-hell/components/Velocity.ts

<<< @/../examples/bullet-hell/components/Collider.ts

<<< @/../examples/bullet-hell/components/Health.ts

The player has lives and a gun:

<<< @/../examples/bullet-hell/components/Lives.ts

<<< @/../examples/bullet-hell/components/Gun.ts

Enemies are more interesting. The `Enemy` component keeps the kind of the enemy, and `Emitter` describes how it fires:

<<< @/../examples/bullet-hell/components/Enemy.ts

<<< @/../examples/bullet-hell/components/Emitter.ts

`Emitter` has no methods, only parameters: the pattern, the interval, the amount and the speed of bullets. One system
will read these parameters and fire all patterns.

## Enemies are data

Kinds of enemies are described in one table, and waves are a list of enemies with the time and place they appear:

<<< @/../examples/bullet-hell/enemies.ts

To add a new enemy, you add a description. To change the difficulty, you change numbers. Nothing in systems changes.

The factory turns a description into an entity:

<<< @/../examples/bullet-hell/entities/createEnemy.ts

## Optional behaviour is an optional component

Some enemies sway from side to side, and some don't. Instead of a flag `canSway` in the enemy, swaying is a
component, and only enemies that sway have it:

<<< @/../examples/bullet-hell/components/Sway.ts

A system processes entities that have `Sway`, and doesn't know about the others. Adding swaying to any entity, even to
a bullet, is adding one component.

## Motion

<<< @/../examples/bullet-hell/systems/motion.ts

- `movement` moves everything that has a velocity: enemies and bullets.
- `swaying` changes only the horizontal position, so it works together with `movement`: an enemy descends and sways at
  the same time.
- `leavingScreen` removes bullets and enemies that have left the screen. The player has no velocity, so it's never
  removed by this system.
- `invulnerability` counts down the invulnerability and removes the component when the time is over.

## Temporary state is a component

After a hit, the player is invulnerable for two seconds. The simplest way to express a temporary state in ECS is a
component, that exists while the state lasts:

<<< @/../examples/bullet-hell/components/Invulnerable.ts

The collision system just checks `player.has(Invulnerable)`. Rendering makes the invulnerable player blink with a
system for `[View, Invulnerable]`, and restores it when the component is removed. Nobody checks timers and flags
everywhere: the presence of the component is the state.

## One system, all patterns

The emitter system fires bullets of all enemies. It reads the pattern from the emitter, and fires a ring, a spiral or
an aimed fan:

<<< @/../examples/bullet-hell/systems/EmitterSystem.ts

Aimed patterns need the position of the player, so the system has an additional query of the player.

## The player

<<< @/../examples/bullet-hell/systems/PlayerControlSystem.ts

## Collisions

<<< @/../examples/bullet-hell/systems/CollisionSystem.ts

There are hundreds of enemy bullets, and one player. Checking every bullet against the player is a single pass over
the query with `forEach`, which is fast: components are stored next to each other, and there are no lookups. For this
game, no spatial partitioning is needed. See [Performance](/decisions/performance) for when it is.

Hits use the same trick as in [Asteroids](/tutorials/asteroids): hit entities lose their colliders immediately, so
they can't hit anything else in the same update.

## Waves

<<< @/../examples/bullet-hell/systems/SpawnSystem.ts

The spawn system keeps the progress of the current wave in its own fields. It's the state of the system, not of
any entity, so it doesn't need to be a component. The number of the wave is shared with the game through a plain
object passed to the constructor, so the game can show it.

## Putting it all together

<<< @/../examples/bullet-hell/game.ts

When the player is hit, a subscription to `PlayerHit` removes all enemy bullets. It's game logic, that reacts to a
message: the collision system doesn't need to know about it.

## Rendering hundreds of bullets

Bullets look the same, so they share geometry. Creating a `Graphics` from a shared `GraphicsContext` doesn't build the
geometry again:

<<< @/../examples/bullet-hell/render/graphics.ts

<<< @/../examples/bullet-hell/render/addRendering.ts

## What we've learned

- Kinds of things are data. One system handles all of them by reading their parameters.
- Optional behaviour is an optional component.
- Temporary state is a component, that exists while the state lasts.
- Systems can keep their own state, when it doesn't belong to any entity.
- Hundreds of entities are processed by typed iterative systems and `forEach` without any tricks.

Next, in [Tower defense](/tutorials/tower-defense), entities get several effects of the same kind, and start
referencing each other.
