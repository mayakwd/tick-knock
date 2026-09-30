# Snake

In this tutorial, we will build the classic Snake step by step. It's a small game, but it touches almost everything
you need in every game: components and tags, entities, systems, messages, views and input.

<GameDemo game="snake" />

## The plan

Before writing any code, let's think about what our game consists of. In ECS it's always the same question: **what
data do we have, and what happens to it?**

- There is a grid. Everything on it occupies a **cell**.
- The snake has a **head**, that moves in some **direction** every tick.
- The snake has a **body**, that follows the head.
- There is **food**. When the head reaches it, the snake grows, and new food appears.
- The game is over when the head hits a wall or the body.

The body is the most interesting part. Every tick, the head leaves a **segment** in the cell it leaves, and every
segment lives as many ticks as long the snake is. Old segments disappear, new ones appear, and the body follows the
head by itself. When the snake eats, it becomes longer, and new segments live longer. 🐍

## Components

Components are data. Let's write them, one per file.

The cell of the grid, that an entity occupies:

<<< @/../examples/snake/components/Cell.ts

The cell is immutable. When the head moves, it gets a new cell: `head.add(new Cell(x, y))` replaces the component.
Tick-Knock notices a replaced component, and updates queries and reaction systems. We will use it to keep the grid up
to date.

The direction the head moves in:

<<< @/../examples/snake/components/Heading.ts

The length of the snake. It's stored on the head, because the head decides how long new segments live:

<<< @/../examples/snake/components/Body.ts

And the lifetime of a segment:

<<< @/../examples/snake/components/Lifetime.ts

> ❗ There is no logic in components at all. They don't know how the snake moves, and that's the point: the logic lives
> in systems, and components can be combined in any way.

## Tags

The head, segments, and food are different kinds of entities, but they don't need any data to tell them apart. That's
what [tags](/guide/tag) are for:

<<< @/../examples/snake/tags.ts

A segment and food both have a `Cell`, and tags let queries tell them apart: a query of segments contains `Cell` and
`SEGMENT`, a query of food contains `Cell` and `FOOD`.

> Keep it simple! 😄

## Entities

Every entity on the grid is drawn, so it needs a **view**. A view is a component too, it keeps a display object of
pixi.js:

<<< @/../examples/shared/render/View.ts

Views are drawn by small functions, one for every kind of entity:

<<< @/../examples/snake/render/graphics.ts

Now let's write a function for every kind of entity. The function adds all components of the entity, its view
included, so the entity is complete from the start, and the code that creates entities reads like a description of the
game:

<<< @/../examples/snake/entities/createHead.ts

<<< @/../examples/snake/entities/createSegment.ts

<<< @/../examples/snake/entities/createFood.ts

## Controls

The player turns the snake. The input can come from the keyboard, an autopilot, or a test, so the game doesn't read the
keyboard itself. It has **controls**, and any input source can turn the snake with them. The game takes the direction
once per tick:

<<< @/../examples/snake/Controls.ts

## Messages

When something important happens, systems don't change the score or stop the game themselves. They **dispatch
a message**, and whoever is interested subscribes to it:

<<< @/../examples/snake/messages.ts

This way, every system knows only about its own job.

## The grid

The head must know what is in the next cell: a segment, food, or nothing. Our game is a grid, so let's keep entities in
a grid. A cell is an index of an array, so finding out what is in a cell is a lookup:

<<< @/../examples/snake/Grid.ts

Who keeps the grid up to date? A reaction system of the `Cell` component. It adds an entity to the grid when the entity
gets a cell, and removes it when the entity loses its cell. When the head gets a new cell, the reaction system sees the
old cell removed and the new one added, so the grid follows the head by itself:

```typescript
this.engine.reactive([Cell], {
  added: ({current}, cell) => this.grid.add(cell, current),
  removed: ({current}, cell) => this.grid.remove(cell, current),
});
```

> 💡 The grid is an index of a component. Systems that move entities just replace their cells, and the index follows
> them.

## Systems

Every tick, the head checks where it goes, moves, and eats. Each of these steps is a separate system, and each of them
is a class with a name, that tells what it does.

The collision system looks into the cell the head is about to move to. A wall or the body ends the game. The crashed
snake loses its heading, so it doesn't move anymore:

<<< @/../examples/snake/systems/CollisionSystem.ts

The movement system moves the head one cell forward, and leaves a segment behind:

<<< @/../examples/snake/systems/MovementSystem.ts

The eating system looks for food in the new cell of the head. For a moment the head and food share a cell, that's why
the grid keeps a list of entities in every cell:

<<< @/../examples/snake/systems/EatingSystem.ts

> ❗ Entities removed during the update are removed after all systems have been updated, and until then they stay in
> queries. That's why the eaten food also loses its `Cell`: it leaves the grid right away. Removing the component, that
> queries and indexes depend on, makes an entity stop taking part in the game immediately.

## The game

Now let's put it all together. The game is a class, that owns the engine, the controls, and the grid. Its constructor
adds systems, subscribes to messages, and creates the first entities:

<<< @/../examples/snake/game.ts

Systems are updated in the order they are added, so the constructor reads the same way the tick goes:

1. The head turns in the direction of the controls. It's a few lines, so it's a
   [functional system](/guide/built-in-systems#functional-systems), written right where it's added.
   `engine.iterative([Heading, HEAD], ...)` is called for every entity with the `Heading` component and the `HEAD` tag.
   Components are passed to the function, tags are only used for matching.
2. Segments count down their lifetime. An expired segment loses its cell right away, so the head can move there in the
   same tick.
3. The head checks where it goes, moves, and eats.
4. Every time food loses its cell, that is, it's eaten, a reaction system adds new food to a random free cell. When
   there are no free cells, the snake has filled the grid, and the game is won.

`engine.subscribe` counts the score and stops the game.

## Views on the screen

`addViews` is added after all game systems. It adds `ViewSystem`, which puts views on the layer and destroys them when
entities are removed, and a system, that moves views to cells of their entities:

<<< @/../examples/shared/render/addViews.ts

<<< @/../examples/shared/render/ViewSystem.ts

The game doesn't read input and doesn't know where its layer is displayed, so it can be played anywhere, even in
a test:

```typescript
const game = new SnakeGame({width: 20, height: 10, layer: new Container()});
game.controls.turn('up');
game.tick();
```

> Looks easy? Yes, it is!

## Playing in a page

The game is started in a page by a demo, which is described in [Demo skeleton](/tutorials/demo). Snake extends it, and
describes how the game is created, controlled, and shown. The game works in ticks, so the time of frames is
accumulated, and the game is advanced by whole ticks:

<<< @/../examples/snake/mount.ts

The autopilot plays until you click the game. It's written the same way as systems: it finds the head and food with
its own queries, and looks into cells with the grid:

<<< @/../examples/snake/input/autopilot.ts

## Testing without a browser

pixi.js creates display objects without a renderer, so the game runs without a browser. The test lets the autopilot
play, and checks that every entity has its view, and every view is where its entity is:

<<< @/../examples/tests/snake.ts

The same game is also played in the terminal: `pnpm --filter tick-knock-examples snake`. Its views are created but
never displayed, and the grid is printed as text.

## What we've learned

- Components are plain data, tags are labels without data.
- Entity factories create entities with all their components, the view included.
- Small logic is a functional system written in place, a system that does something bigger is a class with a name.
- Systems are updated in the order they are added.
- An index, like the grid, is kept by a reaction system of the component it indexes.
- Removing a component, that queries and indexes depend on, makes an entity stop taking part in the game immediately.
- Systems dispatch messages, and the game decides what they mean.

Next, in [Asteroids](/tutorials/asteroids), the world stops being a grid: things fly, collide, and break apart. 🚀
