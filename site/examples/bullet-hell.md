# Bullet hell

Arrows or WASD to move, Shift to move slowly, Space or Z to fire, R to restart.

<GameDemo game="bullet-hell" />

What it shows:

- Hundreds of entities updated every frame by typed iterative systems.
- Data-driven enemies: kinds of enemies and waves are data, turned into components when an enemy appears.
- Firing patterns as separate components, every pattern has its own system. A kind of enemies has one pattern, typed
  as a union of pattern components.
- A quad tree of colliders, kept up to date by a system: the player and its bullets find what they touch in it.
- Optional behaviour as an optional component: only some enemies sway.
- Temporary state as a component: the player is invulnerable while it has the `Invulnerable` component.
- Views of bullets sharing geometry, so creating a view is cheap.

- [Sources](https://github.com/mayakwd/tick-knock/tree/develop/examples/bullet-hell)
- [Tutorial](/tutorials/bullet-hell), that builds this game step by step
