# Snake

In this tutorial we'll build the classic Snake. It's a small game, but it touches almost everything you need in every
game: components and tags, entities, systems of different kinds, messages, rendering and input.

<GameDemo game="snake" />

## The plan

Before writing any code, let's think about what our game consists of. In ECS it's always the same question: **what
data do we have, and what happens to it?**

- There is a grid. Everything on it occupies a cell, so it has a **position**.
- The snake has a **head**, that moves in some **direction** every tick.
- The snake has a **body**, that follows the head.
- There is **food**. When the head reaches it, the snake grows, and new food appears.
- The game is over when the head hits a wall or the body.

The body is the most interesting part. We could store the body as an array of cells in the head, but there is a
simpler way: every tick the head leaves a **segment** at the cell it leaves, and every segment lives as many ticks as
long the snake is. Old segments disappear, new ones appear, and the body follows the head by itself. When the snake
eats, it just becomes longer, and new segments live longer. 🐍

## Components

Components are data. Let's write them, one per file.

The position is a cell of the grid:

<<< @/../examples/snake/components/Position.ts

The direction the head moves in:

<<< @/../examples/snake/components/Heading.ts

The length of the snake. It's stored on the head, because the head decides how long new segments live:

<<< @/../examples/snake/components/Body.ts

And the lifetime of a segment:

<<< @/../examples/snake/components/Lifetime.ts

> 💡 Notice that there is no logic in components at all. They don't know how the snake moves, and that's the point:
> the logic lives in systems, and components can be combined in any way.

## Tags

The head, segments and food are different kinds of entities, but they don't need any data to tell them apart. That's
what [tags](/guide/tag) are for:

<<< @/../examples/snake/tags.ts

A segment and food both have a `Position`. Tags let queries tell them apart: a query of segments contains `Position`
and `SEGMENT`, a query of food contains `Position` and `FOOD`.

## Entities

It's convenient to have a function for every kind of entity. Then nobody forgets a component, and the code that creates
entities reads like a description of the game:

<<< @/../examples/snake/entities/createHead.ts

<<< @/../examples/snake/entities/createSegment.ts

<<< @/../examples/snake/entities/createFood.ts

## Movement

Now the logic. Every tick the head leaves a segment behind and moves one cell forward. It's a small piece of logic
without any state, so it doesn't need a class: a [functional system](/guide/built-in-systems#functional-systems) is
enough. Such systems are written right where they are added to the engine, together with the other systems of the
game:

<<< @/../examples/snake/game.ts#systems

`engine.iterative([Position, Heading, Body], ...)` adds a system with a function, that receives an entity, the delta
time and components of the entity. It's called for every entity that has all three components, which is only the
head. The function is a closure, so it uses the engine to add segments without passing it anywhere.

`aging` counts down the lifetime of segments, and removes a segment when its time is over. The other systems are
explained below.

> ❗ Segments are removed while the engine is being updated. Tick-Knock doesn't remove them immediately: entities
> removed during the update are removed after all systems have been updated. That's why the collision system below
> checks `lifetime.ticks > 0`: an expired segment is still in the query until the end of the update, but the head can
> already move to its cell.

## Steering

The player turns the snake. The input can come from the keyboard, an autopilot or a test, so the game doesn't read the
keyboard itself. Instead, it has **controls**, a plain object that any input source can change:

<<< @/../examples/snake/Controls.ts

The steering system needs these controls, so it's a class, that receives them in the constructor.
`IterativeSystem.of(Heading, HEAD)` builds its query: entities with the `Heading` component and the `HEAD` tag.
Components are passed to `updateEntity`, tags are only used for matching.

<<< @/../examples/snake/systems/SteeringSystem.ts

## Collisions and messages

The collision system checks what the head has run into. It needs more than one query: its own query of heads, and
additional queries of food and segments. Additional queries must be added to the engine, so the system adds them in
`onAddedToEngine` and removes them in `onRemovedFromEngine`.

<<< @/../examples/snake/systems/CollisionSystem.ts

When something important happens, the system doesn't change the score or stop the game itself. It **dispatches a
message**, and whoever is interested subscribes to it:

<<< @/../examples/snake/messages.ts

This way the collision system only knows about collisions. Counting the score and stopping the game are somebody
else's responsibility.

## Putting it all together

The game is an engine with systems. Let's look at it piece by piece.

<<< @/../examples/snake/game.ts

A few things to notice:

- **Priorities.** Systems are updated in order of their priority, from the lowest to the highest. The snake must turn
  before it moves, and collisions are checked after it has moved. Priorities are named in one place, so the order of
  systems is easy to read and change.
- **Identifiers.** Every system has an `id`, so it can be found with `engine.getSystemById` or removed with
  `engine.removeSystem`.
- **Food spawner.** A reaction system created with `engine.reactive([Position, FOOD], {removed: spawnFood})` calls
  `spawnFood` every time food leaves its query, that is, when it's eaten. The game doesn't need to remember that food
  must be spawned after eating: it reacts to the change.
- **Messages.** `engine.subscribe` counts the score and stops the game.
- **The `setup` option.** It lets the host of the game add its own systems, rendering for example. We'll need it in a
  moment.

The game has no rendering and no input yet, but it already works. It can be played in a test:

```typescript
const game = createSnakeGame({width: 20, height: 10});
game.controls.direction = 'up';
game.tick();
```

## Rendering

The game logic doesn't know how it's displayed, and it's worth keeping it this way: the same game is rendered with
pixi.js in the browser, as text in the terminal, and not rendered at all in tests.

Rendering is added by the host through `setup`. The idea is simple: when an entity appears, a reaction system attaches
a **view** to it. The view is a component too:

<<< @/../examples/shared/render/View.ts

`ViewSystem` adds views to the stage, and destroys them when entities are removed:

<<< @/../examples/shared/render/ViewSystem.ts

And here is the rendering of Snake. Reaction systems attach views to entities by their tags, and an iterative system
moves views to the cells of their entities after all game systems have been updated:

<<< @/../examples/snake/render/addRendering.ts

> 💡 Why is `setup` called before the first entities are created? Reaction systems are notified only about entities
> added after them. If the head were created before rendering was added, it would never get a view.

## Input and the game loop

The last part starts the game in a page: it creates a pixi.js application, connects the keyboard, and updates the
game. Snake works in ticks, so the time of frames is accumulated, and the game is advanced by whole ticks:

<<< @/../examples/snake/mount.ts

The autopilot plays until you click the game. It's written the same way as systems: it has its own queries and reads
components through them.

<<< @/../examples/snake/input/autopilot.ts

## Testing without a browser

Since the game logic doesn't depend on rendering, it's easy to test. The examples are played by autopilots in tests,
and rendering is checked too: pixi.js creates display objects without a renderer, so the test checks that every entity
has its view.

<<< @/../examples/tests/snake.ts

## What we've learned

- Components are plain data, tags are labels without data.
- Entity factories keep creation of entities in one place.
- Small logic without state is a functional system, logic with dependencies is a class.
- Systems dispatch messages instead of changing things they are not responsible for.
- Reaction systems react to changes of queries: new food appears when the old one is eaten.
- Rendering is attached to entities from outside, so the game runs anywhere.

Next, in [Asteroids](/tutorials/asteroids), the world stops being a grid: things fly, collide and break apart.
