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

The player has lives, and a [cooldown](/tutorials/asteroids#cooldown) of firing, as in Asteroids:

<<< @/../examples/bullet-hell/components/Lives.ts

An enemy keeps its kind, which is used to draw it:

<<< @/../examples/bullet-hell/components/Enemy.ts

## Patterns are components

Enemies fire bullets in patterns. Every pattern is a component with its own parameters:

<<< @/../examples/bullet-hell/components/RingPattern.ts

<<< @/../examples/bullet-hell/components/SpiralPattern.ts

<<< @/../examples/bullet-hell/components/AimedPattern.ts

Patterns don't change, so they have only readonly parameters. But the direction of firing changes: an aimed pattern
turns to the player, a spiral rotates after every shot. That's the state of every enemy, so it's a separate component,
the barrel of the enemy:

<<< @/../examples/bullet-hell/components/Barrel.ts

An enemy has one pattern, a barrel, and a cooldown, that tells how often it fires. Every pattern has its own system,
and the system fires only for enemies with its pattern. A new pattern is a new component and a new system. 😈

## Enemies are data

Kinds of enemies are described in one table, and waves are lists of enemies with the time and place they appear.
The pattern of an enemy is one field, typed as a union of the pattern components, so a kind can't have two patterns or
none:

<<< @/../examples/bullet-hell/enemies.ts

To add a new enemy, you add a description. To change the difficulty, you change numbers. Systems stay the same.

The factory turns a description into an entity with its view. The pattern is already a component, and it's immutable,
so all enemies of the kind share it, and the factory just adds it. Everything else, that changes, is created for every
enemy: health, the barrel, the cooldown, the sway.

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

The collision system of the player checks `player.has(Invulnerable)`, and bullets fly through the invulnerable player.
The view of the invulnerable player blinks with a system of `[View, Invulnerable]`, and becomes solid when the component
is removed. The presence of the component is the state.

## Controlling the player

The player control moves the player, and fires according to the controls. `clamp` from the shared geometry
helpers keeps the player on the screen:

<<< @/../examples/bullet-hell/systems/PlayerControlSystem.ts

## Collisions and hits

There are hundreds of bullets on the screen. Checking every bullet against every enemy and the player would be a lot of
work, so let's use the quad tree from [Asteroids](/tutorials/asteroids). This time the tree keeps every entity with
a collider: the player, enemies and all bullets:

<<< @/../examples/bullet-hell/ColliderTree.ts

A system keeps the tree up to date, the same way as the tree of asteroids:

<<< @/../examples/bullet-hell/systems/ColliderTreeSystem.ts

A bullet of the player asks the tree for an enemy it touches, and the player asks for enemies and enemy bullets:

<<< @/../examples/bullet-hell/systems/PlayerBulletCollisionSystem.ts

<<< @/../examples/bullet-hell/systems/PlayerCollisionSystem.ts

The player destroys enemy bullets, that hit it, and destroyed bullets leave the tree right away. That's why `findAll`
collects entities first, and returns them after the search: the tree isn't changed while it's being searched.

Collision systems only report hits. A bullet that hits is destroyed, and the hit entity gets a `Hit`. An entity can
be hit several times in one update, so `Hit` is a linked component:

<<< @/../examples/bullet-hell/components/Hit.ts

What a hit does is decided by systems of the hit entities. An enemy loses a point of health for every hit, and an
enemy without health is destroyed, and gives points:

<<< @/../examples/bullet-hell/systems/EnemyHitSystem.ts

The player loses one life, even if a bullet and an enemy have hit it at once, and becomes invulnerable. The player
without lives is destroyed:

<<< @/../examples/bullet-hell/systems/PlayerHitSystem.ts

Destroyed entities lose their colliders immediately, as in [Asteroids](/tutorials/asteroids), so they can't hit
anything else in the same update:

```typescript
this.engine
  .reactive([Collider, DESTROYED], {added: ({current}) => current.remove(Collider)})
  .addSystem(new DestroySystem());
```

## Waves

<<< @/../examples/bullet-hell/systems/SpawnSystem.ts

The spawn system keeps the progress of the current wave in its own fields. It's the state of the system, and nobody
else needs it. The number of the wave is shared with the game through a small object passed to the constructor, so the
game can show it.

## The game

<<< @/../examples/bullet-hell/game.ts

Systems are updated in the order they are added, so the constructor reads the same way the update goes:

1. Cooldowns are counted down, the player moves and fires, and new enemies appear.
2. Everything that has a velocity moves. Swaying adds only the change of the swing to the horizontal position, so an
   enemy descends and sways at the same time.
3. Every pattern fires from the barrel while the cooldown of its enemy is over, adding the interval after every shot.
   A ring turns the barrel by half of the gap between bullets, so the next ring flies between bullets of the previous
   one. A spiral fires
   every 0.05 seconds, so on a slow frame it fires twice. Cooldowns of enemies and the player are counted down by
   the same `CooldownSystem` at the start of the update.
4. The aimed pattern needs the position of the player. The system is a closure, so it simply uses the query of the
   player, that the game has created.
5. Entities are moved in the tree of colliders, collisions are checked, and hits are resolved.
6. Invulnerability is counted down, and the component is removed when the time is over.
7. Entities with the `REMOVED_OFFSCREEN` tag are destroyed when they leave the screen. Bullets and enemies have this
   tag, and the player doesn't:

<<< @/../examples/bullet-hell/tags.ts

When the player becomes invulnerable, a reaction system of `Invulnerable` destroys all enemy bullets, which the game
keeps in its own query. It doesn't matter what has made the player invulnerable: the reaction follows the component.

Lives belong to the player: the game reads the `Lives` component of the player when it shows the status. The game is
over when the player is destroyed, and the query of the player is empty. The system of player hits dispatches
`GameOver` for the page.

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
- Reaction systems react to components, whoever has added them.
- Hundreds of entities are processed by typed iterative systems and `forEach` without any tricks.

Next, in [Tower defense](/tutorials/tower-defense), entities get several effects of the same kind, and start
referencing each other. 🏰
