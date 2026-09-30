# Asteroids

In [Snake](/tutorials/snake), everything moved by cells, once per tick. In Asteroids, things fly smoothly, collide and
break apart, and entities appear and disappear all the time: every shot is an entity, and every destroyed asteroid
turns into two smaller ones. Let's see how Tick-Knock handles it.

<GameDemo game="asteroids" />

## The plan

What data do we have?

- Everything has a **position**, and most things have a **velocity**.
- The ship and asteroids have a **rotation**, and asteroids spin, so they have an **angular velocity**.
- Things that can collide have a **collider**, a circle of some radius.
- Bullets live for a second, so they have a **lifetime**.
- The ship fires not more often than its **cooldown** allows.
- An asteroid has a **size**, and its own outline, so every asteroid looks different.

And what happens to it?

- The ship turns, accelerates, and fires according to the controls.
- Everything moves, and wraps around the edges of the screen.
- Bullets disappear when their lifetime is over.
- A bullet destroys an asteroid, and a large asteroid splits into two smaller ones.
- An asteroid destroys the ship, and the game is over.
- When the last asteroid is destroyed, the next wave begins.

## Components

Components are small and familiar by now:

<<< @/../examples/asteroids/components/Position.ts

<<< @/../examples/asteroids/components/Velocity.ts

<<< @/../examples/asteroids/components/Rotation.ts

<<< @/../examples/asteroids/components/AngularVelocity.ts

<<< @/../examples/asteroids/components/Collider.ts

<<< @/../examples/asteroids/components/Lifetime.ts

<<< @/../examples/asteroids/components/Asteroid.ts

The ship and bullets don't have data of their own, so they are marked with tags:

<<< @/../examples/asteroids/tags.ts

Numbers that tune the game are kept in one place:

<<< @/../examples/asteroids/config.ts

## Cooldown

The ship has a **cooldown**: the interval between shots, and the time until the next shot. It's a component, shared by
all examples, and it's data only:

<<< @/../examples/shared/Cooldown.ts

The logic is in systems. `CooldownSystem` counts down cooldowns of all entities that have one. The system that fires
checks whether the cooldown is over, and adds the interval after a shot:

<<< @/../examples/shared/CooldownSystem.ts

> 💡 The time passed after the cooldown is over is kept for the next shot, so the ship fires at the same rate on any
> frame rate.

## Entities

All bullets look the same, so they share geometry. Creating a view of a bullet doesn't build its geometry again, and
that matters when bullets appear several times per second:

<<< @/../examples/asteroids/render/graphics.ts

Factories create entities with their views, as in Snake:

<<< @/../examples/asteroids/entities/createShip.ts

<<< @/../examples/asteroids/entities/createAsteroid.ts

<<< @/../examples/asteroids/entities/createBullet.ts

The random number generator is passed to the factory of asteroids. The game receives it in options, so tests can pass
a seeded generator and get the same game every time.

## Controlling the ship

The ship control is more than a few lines, so it's a class. It receives the controls of the game in the constructor.
`IterativeSystem.of(Position, Velocity, Rotation, Cooldown, SHIP)` passes four components to `updateEntity`, all with their
types, and the tag only filters entities:

<<< @/../examples/asteroids/systems/ShipControlSystem.ts

A few things to notice:

- The drag is `Math.exp(-DRAG * dt)`: the ship loses the same share of its speed every second, whatever the frame rate
  is.
- Firing is just adding a new entity to the engine. Queries pick up the new bullet right away, so systems updated
  after this one, like movement, see it in the same update. The system that is iterating right now visits entities
  added during its iteration starting from the next update.

## Collisions and safe removal

Collisions are the heart of the game. A bullet or the ship can only hit asteroids near it, so let's find them without
checking every asteroid. We will use a **quad tree**: it divides the screen into four quarters, and every quarter,
that has too many asteroids, into four more, and so on. Finding asteroids near a point looks only into quarters around
it:

<<< @/../examples/shared/QuadTree.ts

The screen of Asteroids wraps around, so an asteroid at the right edge can hit the ship at the left edge. The tree of
asteroids knows about it: near an edge, it looks for asteroids at the opposite edge too, and measures the distance
across the edges with `wrappedDifference` from the shared geometry helpers:

<<< @/../examples/asteroids/AsteroidTree.ts

Asteroids move every frame, so the tree is filled again every update, after everything has moved:

<<< @/../examples/asteroids/systems/AsteroidTreeSystem.ts

Then every bullet and the ship ask the tree for an asteroid they touch. Each of them has its own system:

<<< @/../examples/asteroids/systems/BulletCollisionSystem.ts

<<< @/../examples/asteroids/systems/ShipCollisionSystem.ts

> 💡 A quad tree suits things that move freely, and are spread unevenly over the screen. When entities live in cells,
> an index of cells is simpler: see the grid of [Snake](/tutorials/snake) and the spatial index of the
> [Tower defense](/tutorials/tower-defense).

Now, there is a subtle problem. A bullet hits an asteroid and is removed. Entities removed during the update are removed
after it, so the bullet stays in its query until the end of the update. Could it hit one more asteroid in the same
update?

**Remove the component that queries depend on.** The hit bullet loses its `Collider`, and leaves the query of bullets
immediately, because the query contains `Collider`. The bullet is removed from the engine after the update, but it
can't collide anymore. The same happens to destroyed asteroids and the ship: a destroyed asteroid is still in the tree
until the next update, but the tree skips asteroids without a collider.

<<< @/../examples/asteroids/entities/destroy.ts

> 💡 Removal is deferred, so every system of the update sees the removed entity, and nobody breaks iteration of anybody
> else. Added entities and changed components are seen right away. See
> [Remove the entity or the component?](/decisions/removing).

Collision systems only report what has happened: they dispatch `AsteroidDestroyed` with the destroyed asteroid, and
`ShipDestroyed`:

<<< @/../examples/asteroids/messages.ts

## The game

Let's put it all together:

<<< @/../examples/asteroids/game.ts

Systems are updated in the order they are added, so the constructor reads the same way the update goes:

1. Cooldowns are counted down, and the ship is controlled.
2. Everything that has a velocity moves, and wraps around the edges of the screen with `wrap`. One system, three kinds
   of entities: the ship, asteroids, and bullets share the same components.
3. Everything that has an angular velocity spins. Only asteroids have one, so only they spin.
4. Bullets disappear when their lifetime is over.
5. Asteroids are put into the tree, and collisions of bullets and the ship are checked after everything has moved.
6. A reaction system counts asteroids: it's notified when an asteroid appears and when it's removed. When the last one
   is removed, the next wave begins.

The game subscribes to `AsteroidDestroyed`: it counts the score, and splits the asteroid into two smaller ones.
The asteroid is removed after the update, so the subscriber can still read its size and position.

> 💡 Movement, spinning and lifetime are closures: movement uses the size of the screen, and lifetime uses the engine.
> Nothing needs to be passed to them.

Views follow positions with the shared `addViews`, as in Snake. Two more systems rotate views of entities that have
a rotation: a reaction system rotates a new view right away, and `[View, Rotation]` rotates views every update. Bullets
don't have a rotation, so they are not rotated. The behaviour of views is composed from components too.

## Input

<<< @/../examples/asteroids/input/keyboardControls.ts

The keyboard is read every frame and written to the controls. The autopilot writes to the same controls, so the game
doesn't care who plays it. The page is the [demo](/tutorials/demo), that reads the keyboard while the player plays:

<<< @/../examples/asteroids/mount.ts

## What we've learned

- Systems move things by `velocity * dt`, and cooldowns keep the time passed after they are over, so the game doesn't
  depend on the frame rate.
- A cooldown is data, and `CooldownSystem` counts it down.
- Small systems are written in place, bigger systems are classes.
- Behaviour follows data: only entities with an angular velocity spin, and only views with a rotation are rotated.
- Systems report what has happened with messages, and the game decides what it means.
- Removed entities stay in queries until the end of the update. To take an entity out of queries immediately, remove
  the component they depend on.
- Reaction systems notice when things appear and disappear, like the last asteroid of a wave.
- A quad tree, filled every update by a system, finds things near a point without checking all of them.

Next, in the [Bullet hell](/tutorials/bullet-hell), there will be hundreds of entities on the screen at once. 💥
