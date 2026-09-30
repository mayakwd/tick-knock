# Asteroids

In [Snake](/tutorials/snake) everything moved by cells, once per tick. In Asteroids things fly smoothly, collide and
break apart, and entities appear and disappear all the time: every shot is an entity, every destroyed asteroid turns
into two smaller ones. Let's see how Tick-Knock handles it.

<GameDemo game="asteroids" />

## The plan

What data do we have?

- Everything has a **position** and most things have a **velocity**.
- The ship and asteroids have a **rotation**, and asteroids spin, so they have an **angular velocity**.
- Things that can collide have a **collider**, a circle of some radius.
- Bullets live for a second, so they have a **lifetime**.
- The ship has a **gun**, that can't fire more often than its cooldown allows.
- An asteroid has a **size**, and its own outline, so every asteroid looks different.

And what happens to it?

- The ship turns, accelerates and fires according to the controls.
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

<<< @/../examples/asteroids/components/Collider.ts

<<< @/../examples/asteroids/components/Lifetime.ts

<<< @/../examples/asteroids/components/AngularVelocity.ts

<<< @/../examples/asteroids/components/Asteroid.ts

The gun keeps a cooldown, a small timer shared by all examples. It's data only: the interval between shots, and the time
until the next shot:

<<< @/../examples/asteroids/components/Gun.ts

<<< @/../examples/shared/Cooldown.ts

The logic is in systems. One system counts cooldowns down, and the system that fires checks whether the cooldown is
over, and restarts it by adding the interval. The time passed after the cooldown is over is kept for the next shot, so
the gun fires at the same rate on any frame rate:

<<< @/../examples/shared/CooldownSystem.ts

The system is created for a component class, `new CooldownSystem(Gun)`, and counts down cooldowns of all components of
this class. It's added right before the system that fires, so the gun is ready in the same update.

The ship and bullets don't have data of their own. Everything the ship has is a position, a velocity, a rotation,
a collider and a gun, so it's marked with a tag, as well as bullets:

<<< @/../examples/asteroids/tags.ts

Numbers that tune the game are kept in one place:

<<< @/../examples/asteroids/config.ts

## Views

All bullets look the same, so they share geometry. Creating a view of a bullet doesn't build its geometry again, which
matters when bullets appear several times per second:

<<< @/../examples/asteroids/render/graphics.ts

## Entities

Factories create entities with their views, as in Snake:

<<< @/../examples/asteroids/entities/createShip.ts

<<< @/../examples/asteroids/entities/createAsteroid.ts

The random number generator is passed to the factory. The game receives it in options, so tests can pass a seeded
generator and get the same game every time.

<<< @/../examples/asteroids/entities/createBullet.ts

## Continuous movement

Now the delta time matters. `engine.update(dt)` passes the time since the previous frame to every system, and systems
move things by `velocity * dt`, so the game runs at the same speed on any frame rate.

The game is a class, as in Snake. Its constructor adds systems in the order they are updated, so it reads as the update
goes:

<<< @/../examples/asteroids/game.ts

The ship is controlled first. The ship control system is bigger than a few lines, so it's a class. It receives the
controls of the game in the constructor, and `IterativeSystem.of(Position, Velocity, Rotation, Gun, SHIP)` passes four
components to `updateEntity`, all with their types, while the tag only filters entities:

<<< @/../examples/asteroids/systems/ShipControlSystem.ts

- The drag uses `Math.exp(-DRAG * dt)`: the ship loses the same share of its speed every second, whatever the frame
  rate is. Subtracting `velocity * DRAG * dt` would slow the ship differently at different frame rates.
- Firing is just adding a new entity to the engine. The new bullet is picked up by queries right away, so systems
  updated after this one, like movement, see it in the same update. Only the system that is iterating right now
  doesn't visit entities added during its own iteration: they are updated starting from the next update.

The next systems are a few lines each, so they are written in place:

- Movement works for every entity with `Position` and `Velocity`: the ship, asteroids and bullets. One system,
  three kinds of entities, because they share the same components. Positions wrap around the edges with `wrap` from
  the shared geometry helpers.
- Spinning works for every entity with `Rotation` and `AngularVelocity`. Only asteroids have an angular velocity, so
  only they spin, and the system doesn't need to know about asteroids.
- Lifetime removes bullets when their lifetime is over.

> 💡 Functional systems are closures: movement uses the size of the screen and lifetime uses the engine, and nothing
> is passed to them. Keep them in place while they are small, and make a class when a system does something bigger.

## Collisions and safe removal

Collisions are the heart of the game. The collision system checks every asteroid against every bullet and the ship.
It uses typed queries with `forEach`: components of every entity are passed to the callback right away, which is both
convenient and fast.

<<< @/../examples/asteroids/systems/CollisionSystem.ts

The screen wraps around, so an asteroid at the right edge can hit a ship at the left edge. The distance is measured
across the edges with `wrappedDifference`.

There is a subtle problem here. A bullet hits an asteroid and is removed. But entities removed during the update are
removed after it, so the bullet stays in its query until the end of the update, and could hit one more asteroid in the
same update.

The solution is simple: **remove the component that queries depend on.** The hit bullet loses its `Collider`, and
immediately leaves the query of bullets, because the query contains `Collider`. It's removed from the engine after the
update, but it can't collide anymore. The same happens to destroyed asteroids and the ship.

> 💡 Why doesn't Tick-Knock remove entities immediately? Because some systems of this update may have already seen the
> entity, and some haven't yet. Deferred removal guarantees that every system of the update sees the removed entity,
> and nobody breaks iteration of anybody else. Only removal is deferred: added entities and changed components are
> seen right away. See [Remove the entity or the component?](/decisions/removing).

## Messages

The collision system only reports what has happened: it dispatches `AsteroidDestroyed` with the destroyed asteroid.
It doesn't count the score and doesn't know how asteroids split. The game subscribes to the message in its
constructor, and does both. The asteroid is removed after the update, so the subscriber can still read its size and
position.

## Waves

When the last asteroid is destroyed, a new wave begins. How do we know that it was the last one?

A reaction system of asteroids, the last of the game systems, counts asteroids: it's notified when an asteroid
appears and when it's removed. When the last one is removed, the next wave begins. Nobody has to check asteroids
every frame: the game reacts to the change when it happens.

## Views follow entities

Views follow positions of entities with the shared `addViews`, as in Snake, and rotations with two more systems of the
game: a reaction system rotates a new view right away, and `[View, Rotation]` rotates views of entities that have
a rotation every update. Bullets don't have one, and they are not rotated. Instead of one system with `if`s,
the behaviour is composed from components.

## Input

<<< @/../examples/asteroids/input/keyboardControls.ts

The keyboard is read every frame and written to the controls. The autopilot writes to the same controls, so the game
doesn't care who plays it. The page extends the shared `Demo`, as in Snake, and reads the keyboard while the player
plays:

<<< @/../examples/asteroids/mount.ts

## What we've learned

- Systems move things by `velocity * dt`, and timers keep the time passed after they are over, so the game doesn't
  depend on the frame rate.
- Small functional systems are written in place, bigger systems are classes.
- Behaviour follows data: only entities with an angular velocity spin.
- Systems report what has happened with messages, and the game decides what it means.
- Removed entities stay in queries until the end of the update. To take an entity out of queries immediately, remove
  the component they depend on.
- Reaction systems notice when things appear and disappear, like the last asteroid of a wave.
- Rendering behaviour is composed from components too: only entities with a rotation are rotated.

Next, in the [Bullet hell](/tutorials/bullet-hell), there will be hundreds of entities on the screen at once.
