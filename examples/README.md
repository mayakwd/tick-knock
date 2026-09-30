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
  entities/     factories, that create entities from components
  systems/      the game logic
  render/       pixi.js views and systems, that attach them to entities
  input/        keyboard, pointer and the autopilot
  tags.ts       tags of entities, if the game uses them
  messages.ts   messages dispatched by systems
  game.ts       the engine with all systems, without rendering and input
  mount.ts      starts the game in a page
```

Rendering is added to the game by the host through the `setup` option: reaction systems attach views to entities when
they appear, and destroy them when entities are removed. The game itself never creates views, so tests play it
without a browser. [shared](shared) contains code used by all games: keyboard input, the view component and the
system that adds views to the stage.

# Snake

The classic snake: arrows or WASD to turn.

What it shows:

- Tags (`HEAD`, `SEGMENT`, `FOOD`) in queries.
- Class-based systems with dependencies passed in constructors: `SteeringSystem` reads the controls object,
  `CollisionSystem` receives the size of the grid.
- Functional systems for small logic: the head leaves body segments behind, and segments disappear when their lifetime
  is over.
- A reaction system, that spawns new food when the previous one is eaten.
- Messages (`FoodEaten`, `GameOver`) dispatched by systems and handled outside of them.
- The same game rendered with pixi.js in the browser and as text in the terminal.

# Asteroids

Fly the ship, shoot asteroids, and survive as many waves as you can: arrows or WASD to fly, Space to fire.

What it shows:

- Lots of entities created and removed every second: bullets with a lifetime, asteroids that split into smaller ones.
- Typed queries with `forEach` in a class-based collision system.
- Safe removal: collided entities lose their colliders immediately, and are removed after the update.
- A reaction system that starts the next wave when the last asteroid is destroyed.

# Bullet hell

Dodge hundreds of bullets and shoot enemies down: arrows or WASD to move, Shift to move slowly, Space or Z to fire.

What it shows:

- Hundreds of entities updated every frame by typed iterative systems.
- Data-driven enemies: kinds of enemies and waves are data, turned into components when an enemy appears.
- Firing patterns as separate components: an enemy fires with every pattern it has.
- Optional behaviour as an optional component: only some enemies sway.
- Temporary state as a component: the player is invulnerable while it has the `Invulnerable` component.
- Views of bullets sharing geometry, so creating a view is cheap.

# Tower defense

Build towers along the path and don't let creeps through: 1-4 to select a tower, click to build it, click a tower to
upgrade it.

What it shows:

- Kinds of towers are data, but every tower owns its characteristics as components, so it can be upgraded.
- Damage described once: the same `Damage` is data of a level and a component of towers, projectiles and creeps.
- Linked components for effects: a creep can be slowed and poisoned several times, every effect expires on its own.
- Game state that doesn't belong to entities: gold and lives are a plain object, that the game changes when systems
  report kills and escapes.
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
