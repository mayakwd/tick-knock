# Snake

Arrows or WASD to turn, R to restart.

<GameDemo game="snake" />

What it shows:

- Tags (`HEAD`, `SEGMENT`, `FOOD`) in queries.
- Functional systems written in place: steering reads the controls from the closure, the head leaves body segments
  behind, and segments disappear when their lifetime is over.
- A grid of cells, maintained by a reaction system on the `Cell` component, so the head finds what is in the next
  cell with a lookup.
- A reaction system, that spawns new food when the previous one is eaten.
- Messages dispatched by systems and handled outside of them.
- The same game rendered with pixi.js in the browser and as text in the terminal.

- [Sources](https://github.com/mayakwd/tick-knock/tree/develop/examples/snake)
- [Tutorial](/tutorials/snake), that builds this game step by step
