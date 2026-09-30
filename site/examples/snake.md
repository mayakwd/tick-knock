# Snake

Arrows or WASD to turn, R to restart.

<GameDemo game="snake" />

What it shows:

- Tags (`HEAD`, `SEGMENT`, `FOOD`) in queries.
- Class-based systems with dependencies passed in constructors.
- Functional systems for small logic: the head leaves body segments behind, and segments disappear when their lifetime
  is over.
- A reaction system, that spawns new food when the previous one is eaten.
- Messages dispatched by systems and handled outside of them.
- The same game rendered with pixi.js in the browser and as text in the terminal.

- [Sources](https://github.com/mayakwd/tick-knock/tree/develop/examples/snake)
- [Tutorial](/tutorials/snake), that builds this game step by step
