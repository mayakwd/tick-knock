# Tower defense

Keys 1-4 select a tower, a click builds it, R to restart.

<GameDemo game="tower-defense" />

What it shows:

- Linked components for effects: a creep can be slowed and poisoned several times, every effect expires on its own.
- Game state that doesn't belong to entities: gold and lives are a plain object, that the game changes when systems
  report kills and escapes.
- Entities referencing other entities: projectiles fly to their targets and disappear when targets die.
- Static data outside of the engine: the map is a picture and a set of cells, not entities.

- [Sources](https://github.com/mayakwd/tick-knock/tree/develop/examples/tower-defense)
- [Tutorial](/tutorials/tower-defense), that builds this game step by step
