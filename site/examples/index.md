# Examples

Small games built with Tick-Knock. Every game is played by an autopilot until you click it, then you take control.

The sources are in the [examples](https://github.com/mayakwd/tick-knock/tree/develop/examples) folder of the
repository. The game logic of every example doesn't depend on rendering and input, so the same code runs in a browser,
a terminal and tests.

| Game | What it shows |
| :--- | :--- |
| [Snake](/examples/snake) | Components, tags, first systems and messages |
| [Asteroids](/examples/asteroids) | Functional systems, collisions and safe removal |
| [Bullet hell](/examples/bullet-hell) | Hundreds of entities, data-driven enemies and temporary components |
| [Tower defense](/examples/tower-defense) | Linked components for effects, game state outside of entities |

## Structure

All games have the same structure:

```
game/
  components/   data of entities, one class per file
  entities/     factories, that create entities from components
  systems/      the game logic
  render/       pixi.js views and systems, that attach them to entities
  input/        keyboard, pointer and the autopilot
  tags.ts       tags of entities
  messages.ts   messages dispatched by systems
  game.ts       the engine with all systems, without rendering and input
  mount.ts      starts the game in a page
```

Rendering uses [pixi.js](https://pixijs.com). It's added to the game by the host: reaction systems attach views to
entities when they appear, and destroy them when entities are removed. The game itself never creates views, so tests
play it without a browser. See [Keeping rendering apart](/decisions/rendering) for details.

## Running locally

```shell
pnpm install
pnpm --filter tick-knock-examples dev      # open all games in the browser
pnpm --filter tick-knock-examples test     # play all games by autopilots
```
