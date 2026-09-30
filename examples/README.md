# Tick-Knock Examples

Small games that show how to build a game with tick-knock. The game logic of every example doesn't depend on rendering
and input, so the same code runs in a terminal, a browser and tests.

# Table of contents

- [Running]
- [Snake]
- [Asteroids]
- [Tests]

# Running

Examples are a package of the pnpm workspace, so their dependencies are installed by `pnpm install` in the repository
root. They use the sources of the library directly, so they don't need a build of it.

```shell
pnpm --filter tick-knock-examples snake            # play Snake in the terminal
pnpm --filter tick-knock-examples snake --demo     # watch the autopilot play
pnpm --filter tick-knock-examples asteroids        # start Asteroids in the browser
```

# Snake

The classic snake in the terminal: arrows or WASD to turn, Q to quit.

- [snake/game.ts](snake/game.ts) — the game logic.
- [snake/autopilot.ts](snake/autopilot.ts) — a greedy autopilot for the demo mode and tests.
- [snake/terminal.ts](snake/terminal.ts) — rendering to the terminal and keyboard input.

What it shows:

- Class-based systems with dependencies passed in constructors: `SteeringSystem` reads the controls object,
  `CollisionSystem` receives the size of the grid.
- Functional systems for small logic: the head leaves body segments behind with `engine.iterative`, and segments
  disappear when their lifetime is over.
- Tags (`HEAD`, `SEGMENT`, `FOOD`) in queries.
- A reaction system, that spawns new food when the previous one is eaten.
- Messages (`FoodEaten`, `GameOver`) dispatched by systems and handled outside of them.
- System identifiers and priorities.

# Asteroids

Fly the ship, shoot asteroids, and survive as many waves as you can: arrows or WASD to fly, Space to fire, R to restart.

- [asteroids/game.ts](asteroids/game.ts) — the game logic.
- [asteroids/main.ts](asteroids/main.ts) — rendering to canvas and keyboard input.

What it shows:

- Lots of entities created and removed every second: bullets with a lifetime, asteroids that split into smaller ones.
- Typed queries with `forEach` in a class-based collision system.
- A render system that receives the canvas context in the constructor and is added with the highest priority, so the
  game logic runs in tests without a browser.
- A reaction system that starts the next wave when the last asteroid is destroyed.

# Tests

```shell
pnpm --filter tick-knock-examples test         # play both games without rendering
pnpm --filter tick-knock-examples typecheck    # check types of the examples
```

Smoke tests play both games with seeded random numbers and check that they behave as expected, so the examples keep
working when the library changes.

[Running]: #running

[Snake]: #snake

[Asteroids]: #asteroids

[Tests]: #tests
