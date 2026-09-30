# Bullet hell

Bullet hell is a shooter, where the screen is filled with bullets, and the player dodges them with a tiny ship. It's
a good test for an ECS: hundreds of entities are created, moved, checked for collisions, and removed every second.

This tutorial is also about **data-driven design**: enemies are described by data, and the same systems handle all of
them. A new kind of enemy is a new description, not new code.

<GameDemo game="bullet-hell" />

## The plan

- The **player** moves in all directions, can move slowly for precise dodging, and fires.
- **Enemies** descend from the top, some of them sway from side to side, and they fire bullets in patterns: rings,
  spirals, and fans aimed at the player.
- **Bullets** fly straight and disappear when they leave the screen.
- The player has three **lives**. After a hit, the player is **invulnerable** for two seconds, and all enemy bullets
  disappear, so there is a chance to recover.
- **Waves** of enemies follow each other. When all waves are over, they repeat with stronger enemies.

## Components

Most components are familiar: position, velocity, collider, and health.

<<< @/../examples/bullet-hell/components/Position.ts

<<< @/../examples/bullet-hell/components/Velocity.ts

<<< @/../examples/bullet-hell/components/Collider.ts

<<< @/../examples/bullet-hell/components/Health.ts

The player has lives and a gun. The gun keeps a [cooldown](/tutorials/asteroids#the-gun-and-its-cooldown), as in
Asteroids:

<<< @/../examples/bullet-hell/components/Lives.ts

<<< @/../examples/bullet-hell/components/Gun.ts

An enemy keeps its kind, which is used to draw it:

<<< @/../examples/bullet-hell/components/Enemy.ts

## Patterns are components

Enemies fire bullets in patterns. Every pattern is a component with its own parameters and its own cooldown:

<<< @/../examples/bullet-hell/components/RingPattern.ts

<<< @/../examples/bullet-hell/components/SpiralPattern.ts

<<< @/../examples/bullet-hell/components/AimedPattern.ts

An enemy fires with every pattern it has, and patterns of one enemy fire independently. A boss, that fires a spiral
and aimed fans at the same time, is an entity with two components. 😈

## Enemies are data

Kinds of enemies are described in one table, and waves are lists of enemies with the time and place they appear:

<<< @/../examples/bullet-hell/enemies.ts

To add a new enemy, you add a description. To change the difficulty, you change numbers. Systems stay the same.

The factory turns a description into an entity with its view. The description is used only here: from this moment,
the enemy owns its parameters.

<<< @/../examples/bullet-hell/entities/createEnemy.ts

## Optional behaviour is an optional component

Some enemies sway from side to side, and some don't. Swaying is a component, and only enemies that sway have it:

<<< @/../examples/bullet-hell/components/Sway.ts

A system processes entities that have `Sway`, and doesn't know about the others. Adding swaying to any entity, even to
a bullet, is adding one component.

## Temporary state is a component

After a hit, the player is invulnerable for two seconds. The simplest way to express a temporary state in ECS is
a component, that exists while the state lasts:

<<< @/../examples/bullet-hell/components/Invulnerable.ts

The collision system checks `player.has(Invulnerable)`, and bullets fly through the invulnerable player. The view of
the invulnerable player blinks with a system of `[View, Invulnerable]`, and becomes solid when the component is
removed. The presence of the component is the state.

## Controlling the player

The player control moves the player and fires its gun according to the controls. `clamp` from the shared geometry
helpers keeps the player on the screen:

<<< @/../examples/bullet-hell/systems/PlayerControlSystem.ts

## Collisions and hits

<<< @/../examples/bullet-hell/systems/CollisionSystem.ts

There are hundreds of enemy bullets and one player. Checking every bullet against the player is a single pass over the
query with `forEach`, and that is fast: components are stored next to each other, and there are no lookups. For this
game, it's all we need. See [Performance](/decisions/performance) for when a spatial index is worth it.

The collision system only reports hits. A bullet that hits is destroyed, and the hit entity gets a `Hit`. An entity can
be hit several times in one update, so `Hit` is a linked component:

<<< @/../examples/bullet-hell/components/Hit.ts

What a hit does is decided by systems of the hit entities. An enemy loses a point of health for every hit:

<<< @/../examples/bullet-hell/systems/EnemyHitSystem.ts

The player loses one life, even if a bullet and an enemy have hit it at once, and becomes invulnerable:

<<< @/../examples/bullet-hell/systems/PlayerHitSystem.ts

Destroyed entities lose their colliders immediately, as in [Asteroids](/tutorials/asteroids), so they can't hit
anything else in the same update:

<<< @/../examples/bullet-hell/entities/destroy.ts

## Waves

<<< @/../examples/bullet-hell/systems/SpawnSystem.ts

The spawn system keeps the progress of the current wave in its own fields. It's the state of the system, and nobody
else needs it. The number of the wave is shared with the game through a small object passed to the constructor, so the
game can show it.

## The game

<<< @/../examples/bullet-hell/game.ts

Systems are updated in the order they are added, so the constructor reads the same way the update goes:

1. The gun cools down, the player moves and fires, and new enemies appear.
2. Everything that has a velocity moves. Swaying adds only the change of the swing to the horizontal position, so an
   enemy descends and sways at the same time.
3. Cooldowns of patterns are counted down, and every pattern fires while its cooldown is over, adding the interval
   after every shot. A spiral fires every 0.05 seconds, so on a slow frame it fires twice.
4. The aimed pattern needs the position of the player. The system is a closure, so it simply uses the query of the
   player, that the game has created.
5. Collisions are checked, and hits are resolved.
6. Invulnerability is counted down, and the component is removed when the time is over.
7. Entities with the `REMOVED_OFFSCREEN` tag are removed when they leave the screen. Bullets and enemies have this tag,
   and the player doesn't:

<<< @/../examples/bullet-hell/tags.ts

When the player is hit, a subscription to `PlayerHit` removes all enemy bullets, which the game keeps in its own query.
Lives belong to the player: the game reads the `Lives` component of the player when it shows the status.

## Hundreds of bullets on the screen

Bullets look the same, so they share geometry. Creating a `Graphics` from a shared `GraphicsContext` doesn't build the
geometry again, and that matters when hundreds of bullets appear every second:

<<< @/../examples/bullet-hell/render/graphics.ts

<<< @/../examples/bullet-hell/entities/createBullet.ts

## What we've learned

- Kinds of things are data, that is turned into components when an entity is created.
- Variants of behaviour are separate components, so an entity can combine them.
- Optional behaviour is an optional component.
- Temporary state is a component, that exists while the state lasts.
- Systems can keep their own state, when it doesn't belong to any entity.
- Collisions report hits, and systems of hit entities decide what a hit does.
- Hundreds of entities are processed by typed iterative systems and `forEach` without any tricks.

Next, in [Tower defense](/tutorials/tower-defense), entities get several effects of the same kind, and start
referencing each other. 🏰
