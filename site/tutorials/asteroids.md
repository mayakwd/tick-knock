# Asteroids

In [Snake](/tutorials/snake) everything moved by cells, once per tick. In Asteroids things fly smoothly, collide and
break apart, and entities appear and disappear all the time: every shot is an entity, every destroyed asteroid turns
into two smaller ones. Let's see how Tick-Knock handles it.

<GameDemo game="asteroids" />

## The plan

What data do we have?

- Everything has a **position** and most things have a **velocity**.
- The ship and asteroids have a **rotation**.
- Things that can collide have a **collider**, a circle of some radius.
- Bullets live for a second, so they have a **lifetime**.
- The ship has its own data: the cooldown of the gun.
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

<<< @/../examples/asteroids/components/Ship.ts

<<< @/../examples/asteroids/components/Asteroid.ts

Bullets don't have data of their own. Everything they have is a position, a velocity, a collider and a lifetime, so
they are marked with a tag:

<<< @/../examples/asteroids/tags.ts

Numbers that tune the game are kept in one place:

<<< @/../examples/asteroids/config.ts

## Entities

<<< @/../examples/asteroids/entities/createShip.ts

<<< @/../examples/asteroids/entities/createAsteroid.ts

The random number generator is passed to the factory. The game receives it in options, so tests can pass a seeded
generator and get the same game every time.

<<< @/../examples/asteroids/entities/createBullet.ts

## Controlling the ship

The ship is controlled the same way as the snake: the system receives the controls in the constructor. This time
`IterativeSystem.of(Ship, Position, Velocity, Rotation)` passes four components to `updateEntity`, all with their
types.

<<< @/../examples/asteroids/systems/ShipControlSystem.ts

Firing is just adding a new entity to the engine. The new bullet is picked up by queries right away, so systems
updated after this one, like movement, see it in the same update. Only the system that is iterating right now doesn't
visit entities added during its own iteration: they are updated starting from the next update.

## Continuous movement

Now the delta time matters. `engine.update(dt)` passes the time since the previous frame to every system, and systems
move things by `velocity * dt`, so the game runs at the same speed on any frame rate.

<<< @/../examples/asteroids/systems/movement.ts

These are three functional systems:

- `movement` works for every entity with `Position` and `Velocity`: the ship, asteroids and bullets. One system,
  three kinds of entities, because they share the same components.
- `spin` is registered with `[Rotation, Velocity, Asteroid]`. The ship has a rotation and a velocity too, but only
  asteroids spin, so the `Asteroid` component is added to the query. It's passed to the function as the third
  component, the function just doesn't declare a parameter for it, but it still filters entities.
- `expiration` removes entities when their lifetime is over.

> 💡 A functional system can be written in its own file as a function returning `IterativeUpdate`. Then the game file
> only registers it: `engine.iterative([Position, Velocity], movement(width, height))`.

## Collisions and safe removal

Collisions are the heart of the game. The collision system checks every asteroid against every bullet and the ship.
It uses typed queries with `forEach`: components of every entity are passed to the callback right away, which is both
convenient and fast.

<<< @/../examples/asteroids/systems/CollisionSystem.ts

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

Splitting an asteroid is a function passed to the collision system, so the system doesn't need to know how asteroids
are created. You'll see it in the game file below.

## Waves

When the last asteroid is destroyed, a new wave begins. How do we know that it was the last one?

A reaction system of asteroids is notified every time an asteroid is removed. If its query is empty after that, there
are no asteroids left:

<<< @/../examples/asteroids/systems/WaveSystem.ts

Nobody has to count asteroids or check them every frame: the game reacts to the change when it happens.

> ❗ The system checks its own query. When the handler is called, the query of the system has already been updated.
> Another query of asteroids could be notified after this handler, and would still contain the removed asteroid.

## Putting it all together

<<< @/../examples/asteroids/game.ts

The score is counted by a subscription to `AsteroidDestroyed`. The collision system only reports what has happened,
and the game decides what it means.

## Rendering

Rendering works as in Snake: views are attached to entities when they appear.

<<< @/../examples/asteroids/render/addRendering.ts

Look at the last two systems. `[View, Position]` moves views of all entities, and `[View, Rotation]` rotates views of
entities that have a rotation. Bullets don't have one, and they are not rotated. Instead of one system with `if`s, the
behaviour is composed from components.

All bullets look the same, so they share geometry. Creating a view of a bullet doesn't build its geometry again, which
matters when bullets appear several times per second:

<<< @/../examples/asteroids/render/graphics.ts

## Input

<<< @/../examples/asteroids/input/keyboardControls.ts

The keyboard is read every frame and written to the controls. The autopilot writes to the same controls, so the game
doesn't care who plays it.

## What we've learned

- Systems move things by `velocity * dt`, so the game doesn't depend on the frame rate.
- Functional systems can live in their own files, and be registered in one line.
- Queries filter by components the system doesn't read: `spin` only rotates asteroids.
- Removed entities stay in queries until the end of the update. To take an entity out of queries immediately, remove
  the component they depend on.
- Reaction systems with an empty query check replace counters.
- Rendering behaviour is composed from components too.

Next, in the [Bullet hell](/tutorials/bullet-hell), there will be hundreds of entities on the screen at once.
