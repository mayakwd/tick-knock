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

## Views

Every entity on the grid is drawn. What it looks like is a component too, a **view**, that keeps a pixi.js display
object:

<<< @/../examples/shared/render/View.ts

Views are drawn by functions, one for every kind of entity:

<<< @/../examples/snake/render/graphics.ts

## Entities

It's convenient to have a function for every kind of entity. Then nobody forgets a component, and the code that creates
entities reads like a description of the game. The view is created together with the entity: it's just one more
component, and the entity is complete from the start.

<<< @/../examples/snake/entities/createHead.ts

<<< @/../examples/snake/entities/createSegment.ts

<<< @/../examples/snake/entities/createFood.ts

## The grid

The head must know what is in the next cell: a segment, food or nothing. Searching all segments and food every tick
would work, but the game is a grid, so let's use one. The grid keeps entities of every cell in an array, and a cell
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
keyboard itself. Instead, it has **controls**, that any input source can use to turn the snake. The game takes the
direction once per tick:

<<< @/../examples/snake/Controls.ts

## Systems

Now the logic. Every tick the snake turns, the tail frees its cell, the head checks where it goes, moves, and eats.
Systems are updated in the order they are added to the engine, so the code reads as the tick goes:

<<< @/../examples/snake/game.ts#systems

Turning and aging are a few lines each, so they are [functional systems](/guide/built-in-systems#functional-systems),
written right where they are added. `engine.iterative([Heading, HEAD], ...)` is called for entities with the `Heading`
component and the `HEAD` tag. Components are passed to the function, tags are only used for matching.

> ❗ Entities removed during the update are removed after all systems have been updated, and until then they stay in
> queries. That's why an expired segment also loses its `Cell`: it leaves the grid right away, and the head can move to
> its cell in the same tick. Removing the component, that queries and indexes depend on, is the way to make an entity
> stop taking part in the game immediately.

Collisions, movement and eating are separate systems. Each of them does one thing, and has a name, so they are classes.

The collision system looks into the cell the head is about to move to. A crashed snake loses its heading, so the
movement system doesn't move it anymore:

<<< @/../examples/snake/systems/CollisionSystem.ts

The movement system moves the head, and leaves a segment behind. The cell is immutable, so the head gets a new one:

<<< @/../examples/snake/systems/MovementSystem.ts

The eating system looks for food in the new cell of the head. For a moment the head and food share a cell, so the grid
keeps a list of entities in every cell:

<<< @/../examples/snake/systems/EatingSystem.ts

The last system is a reaction system: every time food loses its cell, that is, it's eaten, new food appears in a random
free cell of the grid. When there are no free cells, the snake has filled the grid, and the game is won.

## Messages

When something important happens, systems don't change the score or stop the game themselves. They **dispatch
a message**, and whoever is interested subscribes to it:

<<< @/../examples/snake/messages.ts

This way the collision system only knows about collisions, and the eating system only knows about eating. Counting
the score and stopping the game are somebody else's responsibility.

## Putting it all together

The game is a class, that owns the engine, the controls and the grid, adds systems, subscribes to messages and creates
the first entities:

<<< @/../examples/snake/game.ts

A few things to notice:

- **Order of systems.** Systems are updated in the order they are added. The snake turns, the tail frees its cell, and
  then the head moves. Systems also accept a priority and an identifier, but the game doesn't need them.
- **Views.** `addViews` is added after all game systems. It adds views to the layer, and moves them to cells of their
  entities after the game systems have moved the entities.
- **Messages.** `engine.subscribe` counts the score and stops the game.

<<< @/../examples/shared/render/addViews.ts

The game doesn't read input and doesn't know where its layer is displayed. It can be played in a test with a layer
that is never rendered:

```typescript
const game = new SnakeGame({width: 20, height: 10, layer: new Container()});
game.controls.turn('up');
game.tick();
```

`ViewSystem` adds views to the layer, and destroys them when entities are removed:

<<< @/../examples/shared/render/ViewSystem.ts

## Input and the game loop

The last part starts the game in a page. All examples do the same: create a pixi.js application, connect the keyboard,
let the autopilot play until the player clicks the game, and restart the game when it's over. That's the shared `Demo`
class:

<<< @/../examples/shared/Demo.ts

Every game extends it, and describes how it's created, controlled and shown. Snake works in ticks, so the time of
frames is accumulated, and the game is advanced by whole ticks:

<<< @/../examples/snake/mount.ts

The autopilot plays until you click the game. It's written the same way as systems: it finds the head and food with
its own queries, and looks into cells with the grid.

<<< @/../examples/snake/input/autopilot.ts

## Testing without a browser

The game runs without a browser, so it's easy to test. The examples are played by autopilots in tests, and rendering
is checked too: pixi.js creates display objects without a renderer, so the test checks that every entity has its view.

<<< @/../examples/tests/snake.ts

The same game is played in the terminal: its views are created, but never displayed, and the grid is printed as text.

## What we've learned

- Components are plain data, tags are labels without data.
- Entity factories keep creation of entities in one place, the view included.
- Small logic is a functional system written in place, a system that does something bigger is a class with a name.
- Systems are updated in the order they are added.
- An index, like the grid, is maintained by a reaction system on the component it indexes, and an immutable component
  replaced on every change keeps it up to date.
- Removing a component, that queries and indexes depend on, makes an entity stop taking part in the game immediately.
- Systems dispatch messages instead of changing things they are not responsible for.
- Reaction systems react to changes of queries: new food appears when the old one is eaten.

Next, in [Asteroids](/tutorials/asteroids), the world stops being a grid: things fly, collide and break apart.
