# Tower defense

Keys 1-4 select a tower, a click builds it or upgrades the tower in the cell, R to restart.

<GameDemo game="tower-defense" />

What it shows:

- Kinds of towers are data, but every tower owns its characteristics as components, so it can be upgraded.
- Immutable components shared by entities: the payload of a tower is shared by its projectiles.
- A spatial index of creeps, maintained by reaction systems on the `Cell` component: towers find targets in it,
  and keep them while they are in range. Rules of targeting are tags.
- Linked components for effects: a creep can be slowed and poisoned several times, every effect expires on its own.
- Game state that doesn't belong to entities: gold and lives are kept in the state of the game, and systems, that
  change them, receive it in their constructors.
- Entities referencing other entities: projectiles fly to their targets and disappear when targets die.
- Static data outside of the engine: the map is a picture and a list of turns of the path, not entities.

- [Sources](https://github.com/mayakwd/tick-knock/tree/develop/examples/tower-defense)
- [Tutorial](/tutorials/tower-defense), that builds this game step by step
