# Tick-Knock Examples

Small games that show how to build a game with tick-knock. The game logic of every example doesn't depend on rendering
and input, so the same code runs in a browser and in tests, and Snake is also played in a terminal.

# Table of contents

- [Running]
- [Structure]
- [Snake]
- [Asteroids]
- [Bullet hell]
- [Tower defense]
- [Tests]

# Running

Examples are a package of the pnpm workspace, so their dependencies are installed by `pnpm install` in the repository
root. They use the sources of the library directly, so they don't need a build of it.

```shell
pnpm --filter tick-knock-examples dev              # open all games in the browser
pnpm --filter tick-knock-examples snake            # play Snake in the terminal
pnpm --filter tick-knock-examples snake --demo     # watch the autopilot play in the terminal
```

Every game is played by an autopilot until you click it, then you take control.

# Structure

All games have the same structure:

```
game/
  components/   data of entities, one class per file
  entities/     factories, that create entities with their components and views
  systems/      systems with their own queries or state, small systems are written in place in game.ts
  render/       pixi.js drawing of views
  input/        keyboard, pointer and the autopilot
  tags.ts       tags of entities, if the game uses them
  config.ts     numbers that tune the game
  game.ts       the game: the engine with all systems, without input
  mount.ts      the demo, that starts the game in a page
```

A view is a component, that factories create together with entities, and the game adds views to the layer it receives.
pixi.js creates display objects without a renderer, so tests play the games without a browser. [shared](shared) contains
code used by all games: geometry helpers, the cooldown of weapons, the destroy system, the `GameOver` message, keyboard
input, views and the demo loop, that lets the autopilot play until the player takes control.

# Snake

The classic snake: arrows or WASD to turn.

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

# Asteroids

Fly the ship, shoot asteroids, and survive as many waves as you can: arrows or WASD to fly, Space to fire.

What it shows:

- Lots of entities created and removed every second: bullets with a lifetime, asteroids that split into smaller ones.
- Typed queries with `forEach` in a class-based collision system.
- Destruction with a tag: collided entities are destroyed, lose their colliders immediately, and are removed after
  the update.
- A system of destroyed asteroids, that splits them into smaller ones.
- A spawn system, that starts the next wave when the last asteroid is gone.
- A quad tree of asteroids, kept up to date by a system.
- Frame rate independence: movement, drag and the cooldown of firing.

# Bullet hell

Dodge hundreds of bullets and shoot enemies down: arrows or WASD to move, Shift to move slowly, Space or Z to fire.

What it shows:

- Hundreds of entities updated every frame by typed iterative systems.
- Data-driven enemies: kinds of enemies and waves are data, turned into components when an enemy appears.
- Firing patterns as separate components, every pattern has its own system. A kind of enemies has one pattern, typed
  as a union of pattern components.
- A quad tree of colliders, kept up to date by a system: the player and its bullets find what they touch in it.
- Collisions only report hits, systems of hit entities decide what a hit does.
- Optional behaviour as an optional component: only some enemies sway.
- Temporary state as a component: the player is invulnerable while it has the `Invulnerable` component.
- Views of bullets sharing geometry, so creating a view is cheap.

# Tower defense

Build towers along the path and don't let creeps through: 1-4 to select a tower, click to build it, click a tower to
upgrade it.

What it shows:

- Kinds of towers are data, but every tower owns its characteristics as components, so it can be upgraded.
- Descriptions reused as components: the payload of a level is the component of the tower and its projectiles.
- A spatial index of creeps, maintained by reaction systems on the `Cell` component: towers find targets in it,
  and keep them while they are in range. Rules of targeting are tags.
- Linked components for effects: a creep can be slowed and poisoned several times, every effect expires on its own.
- Game state that doesn't belong to entities: gold and lives are kept by the game, and systems, that change them,
  receive them in their constructors.
- Entities referencing other entities: projectiles fly to their targets and disappear when targets die.
- Static data outside of the engine: the map is a picture and a list of turns of the path, not entities.

# Tests

```shell
pnpm --filter tick-knock-examples test         # play all games by autopilots and check rendering
pnpm --filter tick-knock-examples typecheck    # check types of the examples
```

[Running]: #running
[Structure]: #structure
[Snake]: #snake
[Asteroids]: #asteroids
[Bullet hell]: #bullet-hell
[Tower defense]: #tower-defense
[Tests]: #tests
