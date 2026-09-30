# Snake

Arrows or WASD to turn, R to restart.

<GameDemo game="snake" />

What it shows:

- Tags (`HEAD`, `SEGMENT`, `FOOD`) in queries.
- Functional systems written in place: steering reads the controls from the closure, the head leaves body segments
  behind, and segments are destroyed when their lifetime is over.
- A grid of cells, maintained by a reaction system on the `Cell` component, so the head finds what is in the next
  cell with a lookup.
- Entities destroyed with the `DESTROYED` tag, and removed by the shared destroy system.
- A spawn system, that adds new food when there is no food on the grid.
- State read from entities: the score is the length of the snake, the game is over when the head can't move.
- A message (`GameOver`) for the world outside of the game: the page subscribes to it, the game logic doesn't need it.
- The same game rendered with pixi.js in the browser and as text in the terminal.

- [Sources](https://github.com/mayakwd/tick-knock/tree/develop/examples/snake)
- [Tutorial](/tutorials/snake), that builds this game step by step
