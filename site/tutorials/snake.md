# Snake

In this tutorial we'll build the classic Snake. It's a small game, but it touches almost everything you need in every
game: components and tags, entities, systems of different kinds, messages, rendering and input.

<GameDemo game="snake" />

## The plan

Before writing any code, let's think about what our game consists of. In ECS it's always the same question: **what
data do we have, and what happens to it?**

- There is a grid. Everything on it occupies a **cell**.
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

The cell of the grid an entity occupies:

<<< @/../examples/snake/components/Cell.ts

The cell is immutable. When the head moves, it gets a new cell: `head.add(new Cell(x, y))` replaces the component.
Why not just change `x` and `y`? Because Tick-Knock notices a replaced component and updates queries and reaction
systems, while a changed field goes unnoticed. We'll use it to keep the grid up to date.

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

A segment and food both have a `Cell`. Tags let queries tell them apart: a query of segments contains `Cell` and
`SEGMENT`, a query of food contains `Cell` and `FOOD`.

## Entities

It's convenient to have a function for every kind of entity. Then nobody forgets a component, and the code that creates
entities reads like a description of the game:

<<< @/../examples/snake/entities/createHead.ts

<<< @/../examples/snake/entities/createSegment.ts

<<< @/../examples/snake/entities/createFood.ts

## The grid

The head must know what is in the next cell: a segment, food or nothing. Searching all segments and food every tick
would work, but the game is a grid, so let's use one. The grid keeps the entity of every cell in an array, and a cell
is an index of the array, so a lookup is instant:

<<< @/../examples/snake/Grid.ts

Who keeps the grid up to date? Not the systems that move things. The grid is an **index of the `Cell` component**, and
a reaction system maintains it: an entity is added to the grid when it gets a cell, and removed when it loses it. When
the head gets a new cell, the reaction system sees the old cell removed and the new one added, so the grid follows the
head by itself:

<<< @/../examples/snake/game.ts#grid

Nobody can forget to update the grid, and no system has to know about it except those that read it.

## Controls

The player turns the snake. The input can come from the keyboard, an autopilot or a test, so the game doesn't read the
keyboard itself. Instead, it has **controls**, a plain object that any input source can change:

<<< @/../examples/snake/Controls.ts

## Systems

Now the logic. Every tick the snake turns, its tail shortens, and the head moves one cell forward. These are small
pieces of logic, so [functional systems](/guide/built-in-systems#functional-systems) are enough. Such systems are
written right where they are added to the engine, together with the other systems of the game:

<<< @/../examples/snake/game.ts#systems

- `steering` turns the head in the direction of the controls. It's called for entities with the `Heading` component
  and the `HEAD` tag. Components are passed to the function, tags are only used for matching. The function is
  a closure, so it reads the controls of the game without any constructor or parameter.
- `aging` counts down the lifetime of segments. An expired segment is removed from the engine after the update, but it
  loses its `Cell` right away, so the grid frees the cell, and the head can move there in the same tick.
- `movement` looks into the next cell with the grid. A wall or a segment ends the game, food makes the snake longer.
  Then the head gets its new cell and leaves a segment behind.
- The food spawner is a reaction system: every time food loses its cell, that is, it's eaten, new food appears in a
  random free cell of the grid. When there are no free cells, the snake has filled the board, and the game is won.

> ❗ Entities removed during the update are removed after all systems have been updated, and until then they stay in
> queries. Removing the component, that queries and indexes depend on, is the way to make an entity stop taking part in
> the game immediately: here it's `Cell` of expired segments and eaten food.

## Messages

When something important happens, the movement system doesn't change the score or stop the game itself. It
**dispatches a message**, and whoever is interested subscribes to it:

<<< @/../examples/snake/messages.ts

This way the movement system only knows about movement. Counting the score and stopping the game are somebody
else's responsibility.

## Putting it all together

<<< @/../examples/snake/game.ts

A few things to notice:

- **Priorities.** Systems are updated in order of their priority, from the lowest to the highest. The snake turns,
  the tail frees its cell, and then the head moves. Priorities are named in one place, so the order of systems is easy
  to read and change.
- **Identifiers.** Every system has an `id`, so it can be found with `engine.getSystemById` or removed with
  `engine.removeSystem`.
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

Every game places views the same way: a new view is placed right away, and views follow their entities after all game
systems have been updated. It's shared by all examples:

<<< @/../examples/shared/render/addViews.ts

And here is the rendering of Snake. Reaction systems attach views to entities by their tags, and cells are scaled to
pixels:

<<< @/../examples/snake/render/addRendering.ts

> 💡 Why is `setup` called before the first entities are created? Reaction systems are notified only about entities
> added after them. If the head were created before rendering was added, it would never get a view.

## Input and the game loop

The last part starts the game in a page. All examples do the same: create a pixi.js application, connect the keyboard,
let the autopilot play until the player clicks the game, and restart the game when it's over. That's in the shared
`mountDemo`, and every game only describes itself. Snake works in ticks, so the time of frames is accumulated, and the
game is advanced by whole ticks:

<<< @/../examples/snake/mount.ts

The autopilot plays until you click the game. It's written the same way as systems: it finds the head and food with
its own queries, and looks into cells with the grid.

<<< @/../examples/snake/input/autopilot.ts

## Testing without a browser

Since the game logic doesn't depend on rendering, it's easy to test. The examples are played by autopilots in tests,
and rendering is checked too: pixi.js creates display objects without a renderer, so the test checks that every entity
has its view.

<<< @/../examples/tests/snake.ts

## What we've learned

- Components are plain data, tags are labels without data.
- Entity factories keep creation of entities in one place.
- Small logic is a functional system written in place.
- An index, like the grid, is maintained by a reaction system on the component it indexes, and an immutable component
  replaced on every change keeps it up to date.
- Removing a component, that queries and indexes depend on, makes an entity stop taking part in the game immediately.
- Systems dispatch messages instead of changing things they are not responsible for.
- Reaction systems react to changes of queries: new food appears when the old one is eaten.
- Rendering is attached to entities from outside, so the game runs anywhere.

Next, in [Asteroids](/tutorials/asteroids), the world stops being a grid: things fly, collide and break apart.
