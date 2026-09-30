# Examples

Small games built with Tick-Knock. Every game is played by an autopilot until you click it, then you take control.

The sources are in the [examples](https://github.com/mayakwd/tick-knock/tree/develop/examples) folder of the
repository. The game logic of every example doesn't depend on rendering and input, so the same code runs in a browser and in
tests, and Snake is also played in a terminal.

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
  entities/     factories, that create entities with their components and views
  systems/      systems, that are bigger than a few lines
  render/       pixi.js drawing of views
  input/        keyboard, pointer and the autopilot
  tags.ts       tags of entities, if the game uses them
  messages.ts   messages dispatched by systems
  game.ts       the game: the engine with all systems, without input
  mount.ts      the demo, that starts the game in a page
```

Rendering uses [pixi.js](https://pixijs.com). A view is a component, that factories create together with entities,
and the game adds views to the layer it receives. pixi.js creates display objects without a renderer, so tests play
the games without a browser. See [Where do views come from?](/decisions/rendering) for details.

## Running locally

```shell
pnpm install
pnpm --filter tick-knock-examples dev      # open all games in the browser
pnpm --filter tick-knock-examples test     # play all games by autopilots
```
