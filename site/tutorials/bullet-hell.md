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

The player has lives and a gun. The gun keeps a shared `Cooldown`, as in [Asteroids](/tutorials/asteroids):

<<< @/../examples/bullet-hell/components/Lives.ts

<<< @/../examples/bullet-hell/components/Gun.ts

Enemies are more interesting. The `Enemy` component keeps the kind of the enemy, which is used only to draw it:

<<< @/../examples/bullet-hell/components/Enemy.ts

## Patterns are components

Enemies fire bullets in patterns. It's tempting to make one `Emitter` component with the kind of the pattern, and one
system with a `switch` over kinds. But then an enemy can fire only one pattern, and every new pattern changes the
system and the component, that gets fields used only by some of the patterns.

Instead, every pattern is a component with its own parameters:

<<< @/../examples/bullet-hell/components/RingPattern.ts

<<< @/../examples/bullet-hell/components/SpiralPattern.ts

<<< @/../examples/bullet-hell/components/AimedPattern.ts

Every pattern has a cooldown of its own, so patterns of one enemy fire independently.

An enemy fires with every pattern it has. A boss that fires a spiral and aimed fans at the same time is an entity with
two components, and it needs no new code.

## Enemies are data

Kinds of enemies are described in one table, and waves are a list of enemies with the time and place they appear:

<<< @/../examples/bullet-hell/enemies.ts

To add a new enemy, you add a description. To change the difficulty, you change numbers. Nothing in systems changes.

The factory turns a description into an entity. The description is used only here: from this moment the enemy owns
its parameters.

<<< @/../examples/bullet-hell/entities/createEnemy.ts

## Optional behaviour is an optional component

Some enemies sway from side to side, and some don't. Instead of a flag `canSway` in the enemy, swaying is a
component, and only enemies that sway have it:

<<< @/../examples/bullet-hell/components/Sway.ts

A system processes entities that have `Sway`, and doesn't know about the others. Adding swaying to any entity, even to
a bullet, is adding one component.

## Systems

The game is a class, as in the previous tutorials. Systems are updated in the order they are added, so its
constructor reads as the update goes: the player moves and fires, enemies appear, everything moves, enemies fire,
collisions are checked and hits are resolved, and the screen is cleaned up.

<<< @/../examples/bullet-hell/game.ts

Most systems are a few lines long, so they are written right where they are added to the engine:

- Movement moves everything that has a velocity: enemies and bullets.
- Swaying adds only the change of the swing to the horizontal position, so it works together with movement: an enemy
  descends and sways at the same time, and a bullet flying sideways would keep flying and sway.
- Every pattern has its own system. Patterns fire with the same method of the game, so each system describes only
  the directions of bullets. `cooldown.repeat` fires as many times as the cooldown is over in this update: a spiral
  fires every 0.05 seconds, and on a slow frame it fires twice instead of losing a shot.
- The aimed pattern needs the position of the player. The system is a closure, so it simply uses the query of the
  player, that the game has created.
- Invulnerability is counted down, and the component is removed when the time is over.
- Entities with the `REMOVED_OFFSCREEN` tag, bullets and enemies, are removed when they leave the screen. The rule is
  explicit: the player doesn't have the tag, and is never removed by this system.

<<< @/../examples/bullet-hell/tags.ts

Bigger systems are classes with names. The player control moves the player and fires its gun according to the
controls, and `clamp` from the shared geometry helpers keeps the player on the screen:

<<< @/../examples/bullet-hell/systems/PlayerControlSystem.ts

Collisions, hits and waves are explained below. See [Which system?](/decisions/which-system) for more about the choice
between a function and a class.

## Temporary state is a component

After a hit, the player is invulnerable for two seconds. The simplest way to express a temporary state in ECS is a
component, that exists while the state lasts:

<<< @/../examples/bullet-hell/components/Invulnerable.ts

The collision system just checks `player.has(Invulnerable)`: bullets fly through the invulnerable player. The view of
the invulnerable player blinks with a system for `[View, Invulnerable]`, and becomes solid when the component is
removed. Nobody checks timers and flags
everywhere: the presence of the component is the state.

## Collisions

<<< @/../examples/bullet-hell/systems/CollisionSystem.ts

There are hundreds of enemy bullets, and one player. Checking every bullet against the player is a single pass over
the query with `forEach`, which is fast: components are stored next to each other, and there are no lookups. For this
game, no spatial partitioning is needed. See [Performance](/decisions/performance) for when it is.

The collision system only reports hits. A bullet that hits is destroyed, and the hit entity gets a `Hit`, a linked
component, because an entity can be hit several times in one update:

<<< @/../examples/bullet-hell/components/Hit.ts

What a hit does is decided by systems of the hit entities. An enemy loses a point of health for every hit:

<<< @/../examples/bullet-hell/systems/EnemyHitSystem.ts

The player loses one life, even if a bullet and an enemy have hit it at once, and becomes invulnerable:

<<< @/../examples/bullet-hell/systems/PlayerHitSystem.ts

The collision system doesn't know about health, lives or the score: they can change without touching it.

Destroyed entities use the same trick as in [Asteroids](/tutorials/asteroids): they lose their colliders immediately,
so they can't hit anything else in the same update.

<<< @/../examples/bullet-hell/entities/destroy.ts

## Waves

<<< @/../examples/bullet-hell/systems/SpawnSystem.ts

The spawn system keeps the progress of the current wave in its own fields. It's the state of the system, not of
any entity, so it doesn't need to be a component. The number of the wave is shared with the game through a small
object passed to the constructor, so the game can show it.

## Lives

When the player is hit, a subscription to `PlayerHit` removes all enemy bullets, which the game keeps in its own query.
Lives belong to the player: the game doesn't keep a copy of them, it reads the `Lives` component of the player when
the status is shown.

## Rendering hundreds of bullets

Factories create entities with their views. Bullets look the same, so they share geometry: creating a `Graphics` from
a shared `GraphicsContext` doesn't build the geometry again, which matters when hundreds of bullets appear every second:

<<< @/../examples/bullet-hell/render/graphics.ts

<<< @/../examples/bullet-hell/entities/createBullet.ts

## What we've learned

- Kinds of things are data, that is turned into components when an entity is created.
- Variants of behaviour are separate components, so an entity can combine them.
- Optional behaviour is an optional component.
- Small systems are written in place with `engine.iterative`, bigger ones are classes.
- Temporary state is a component, that exists while the state lasts.
- Systems can keep their own state, when it doesn't belong to any entity.
- Collisions report hits, and systems of hit entities decide what a hit does.
- Hundreds of entities are processed by typed iterative systems and `forEach` without any tricks.

Next, in [Tower defense](/tutorials/tower-defense), entities get several effects of the same kind, and start
referencing each other.
