# Tower defense

In a tower defense, creeps walk along a path, and the player builds towers that shoot them. It's the most complex game
of the tutorials, and it brings new questions:

- A creep can be slowed by two frost towers and poisoned by three poison towers at the same time. How to store several
  components of the same kind?
- Gold and lives belong to the player, not to any entity. Where to keep them?
- A projectile flies to its target. What if the target dies before the projectile reaches it?

<GameDemo game="tower-defense" />

## The plan

- The **map** is a grid with a path. Towers can be built on any cell, that is not on the path.
- **Creeps** appear in waves, walk along the path, and take a life when they reach the exit.
- **Towers** fire at the creep, that is the closest to the exit. There are four kinds:
  - **Arrow** fires fast.
  - **Cannon** deals damage in an area.
  - **Frost** slows creeps down.
  - **Poison** damages creeps over time.
- **Projectiles** fly to their targets.
- Killed creeps give **gold**, which is spent on towers.

## The map is not entities

The map never changes. There is nothing to update, nothing to query, and nothing to react to, so it doesn't need to be
entities. It's plain data: turns of the path, and a function that tells whether a tower can be built in a cell.

<<< @/../examples/tower-defense/map.ts

It's rendered once as a single picture. Not everything in a game must be an entity: entities are for things that
change and are processed by systems.

## Towers are data

As enemies in the [Bullet hell](/tutorials/bullet-hell), kinds of towers are described by data:

<<< @/../examples/tower-defense/towers.ts

## Components

<<< @/../examples/tower-defense/components/Position.ts

<<< @/../examples/tower-defense/components/Health.ts

<<< @/../examples/tower-defense/components/Creep.ts

A creep follows the path. The follower keeps the index of the next waypoint, and the distance passed, which towers use
to choose their target:

<<< @/../examples/tower-defense/components/PathFollower.ts

<<< @/../examples/tower-defense/components/Tower.ts

## Linked components for effects

A creep can be slowed several times. If `Slow` were a usual component, the second slow would replace the first one,
and when it expired, the creep would lose both. That's what [linked components](/guide/linked-components) are for:
an entity can have several linked components of the same class.

<<< @/../examples/tower-defense/components/Slow.ts

<<< @/../examples/tower-defense/components/Poison.ts

Linked components are added with `append` instead of `add`. The projectile system appends effects on hit:

```typescript
if (slow !== undefined) creep.append(new Slow(slow.factor, slow.seconds));
if (poison !== undefined) creep.append(new Poison(poison.damagePerSecond, poison.seconds));
```

And effects are processed with `iterate`, which visits every linked component of the class. Expired ones are removed
with `pick`, which removes one particular component and keeps the others:

<<< @/../examples/tower-defense/systems/effects.ts

Poisons stack: every poison deals its damage. Slows don't: the path system applies the strongest one.

<<< @/../examples/tower-defense/systems/PathSystem.ts

> 💡 A query of `[Slow]` contains every entity that has at least one slow. The component passed to the system is the
> first one, and `entity.iterate(Slow, ...)` visits all of them.

## Game state outside of entities

Gold and lives belong to the player. They could be components of a "player" entity, but nothing would ever query it:
there is only one player, and systems don't even read gold and lives, they only report what has happened. A plain
object kept by the game is simpler:

<<< @/../examples/tower-defense/Economy.ts

The game keeps it, and changes it when messages arrive: `CreepKilled` adds gold, `CreepEscaped` takes a life. See
[Where to keep game state?](/decisions/game-state) for more about this choice.

## Towers and targets

<<< @/../examples/tower-defense/systems/TowerSystem.ts

The tower looks through creeps in range, and chooses the one that has passed the longest distance. Towers are updated
before projectiles and effects deal their damage, so all creeps they see are alive: creeps killed in the previous update
have already been removed.

## References between entities

A projectile flies to its target, so it keeps a reference to the target entity:

<<< @/../examples/tower-defense/components/Projectile.ts

But the target can die or escape before the projectile reaches it. The projectile system checks it with
`creeps.has(target)`: the target is still a creep with health, that projectiles can hit. It's a cheap check, and it
doesn't require the target to know about projectiles flying to it.

Remember that a removed entity leaves queries only at the end of the update it was removed in. A creep that has
escaped is removed from the engine after the update, so the path system also removes its `Health`: the creep leaves
queries of towers, projectiles and death right away, and can't be killed after it has escaped. Otherwise the player
could lose a life and get gold for the same creep.

<<< @/../examples/tower-defense/systems/ProjectileSystem.ts

> ❗ Keep references to entities only as long as you check that they still take part in the game. A query of the
> components you need is the simplest way to check it.

## Death

Creeps are damaged by projectiles and poisons, in different systems. If every system removed killed creeps, a creep
could be killed twice in one update, and give gold twice. Instead, damage only decreases health, and one system, that
runs after all damage, removes creeps without health:

```typescript
.iterative([Health, Creep], death(engine), {priority: Priority.Death, id: 'death'});
```

## Putting it all together

<<< @/../examples/tower-defense/game.ts

Building a tower is an action of the player, not something that happens every update, so it's a method of the game.
`canBuild` checks gold, the map and existing towers, and `build` creates the tower entity.

## Rendering and input

A creep view has a health bar, and is tinted when the creep is slowed or poisoned:

<<< @/../examples/tower-defense/render/CreepView.ts

<<< @/../examples/tower-defense/render/addRendering.ts

Towers are built with the pointer. The placement shows the cell and the range of the selected tower, and builds it on
click:

<<< @/../examples/tower-defense/input/pointer.ts

## What we've learned

- Not everything must be an entity: static data is just data.
- Linked components store several components of the same class, `iterate` visits them, and `pick` removes one of them.
- Game state, that doesn't belong to entities, can be a plain object kept by the game.
- References to entities are checked with queries before use.
- Damage from different systems is resolved by one system that runs after all of them.

That's all the tutorials. 🎉 Now it's time to build your own game. When you face a choice, look into
[Decisions](/decisions/).
