# Bullet hell

Arrows or WASD to move, Shift to move slowly, Space or Z to fire, R to restart.

<GameDemo game="bullet-hell" />

What it shows:

- Hundreds of entities updated every frame by typed iterative systems.
- Data-driven enemies: kinds of enemies and waves are data, one emitter system handles all firing patterns.
- Optional behaviour as an optional component: only some enemies sway.
- Temporary state as a component: the player is invulnerable while it has the `Invulnerable` component.
- Views of bullets sharing geometry, so creating a view is cheap.

- [Sources](https://github.com/mayakwd/tick-knock/tree/develop/examples/bullet-hell)
- [Tutorial](/tutorials/bullet-hell), that builds this game step by step
