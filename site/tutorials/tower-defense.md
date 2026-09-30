# Tower defense

In a tower defense, creeps walk along a path, and the player builds towers that shoot them, and upgrades them. It's the
most complex game of the tutorials, and it brings new questions:

- Kinds of towers are described by data. Where do characteristics of a particular tower live, so it can be upgraded?
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
- Every tower can be **upgraded** twice. Upgrades make towers stronger, and the last levels of frost and poison towers
  hit creeps around the target too.
- **Projectiles** fly to their targets.
- Killed creeps give **gold**, which is spent on towers and upgrades.

## The map is not entities

The map never changes. There is nothing to update, nothing to query, and nothing to react to, so it doesn't need to be
entities. It's plain data: turns of the path, and a function that tells whether a tower can be built in a cell.

<<< @/../examples/tower-defense/map.ts

It's rendered once as a single picture. Not everything in a game must be an entity: entities are for things that
change and are processed by systems.

## Kinds are data, towers own their state

Kinds of towers and their levels are described by data:

<<< @/../examples/tower-defense/towers.ts

It's tempting to give a tower only its kind, and let systems look up everything else in this table. But then all towers
of a kind are the same, and a tower can't be upgraded: the only thing to change would be the table itself. Systems would
also depend on the table and on kinds of towers, so a new kind of tower would require changes in systems.

Instead, the table is used only when a tower is built or upgraded. Its level is turned into components of the tower,
and from that moment the tower owns its characteristics. Systems work with components, and never look into the table.

The tower knows what it is:

<<< @/../examples/tower-defense/components/Tower.ts

Every tower has a weapon:

<<< @/../examples/tower-defense/components/Weapon.ts

And effects are optional components. A tower deals damage in an area if it has `Splash`, slows creeps if it has
`SlowOnHit`, and poisons them if it has `PoisonOnHit`:

<<< @/../examples/tower-defense/components/Splash.ts

<<< @/../examples/tower-defense/components/SlowOnHit.ts

<<< @/../examples/tower-defense/components/PoisonOnHit.ts

There is no "cannon" or "frost tower" in the logic of the game. A cannon is a tower with a weapon and `Splash`, a frost
tower of the last level is a tower with a weapon, `SlowOnHit` and `Splash`. Behaviour is composed from components.

One function turns a level into components. It adds components the level has, and removes components it doesn't have,
so the tower becomes exactly what the level describes:

<<< @/../examples/tower-defense/entities/equipTower.ts

Building a tower is equipping a new entity with the first level:

<<< @/../examples/tower-defense/entities/createTower.ts

And upgrading is equipping the same entity with the next level. See
[Data or components?](/decisions/data-or-components) for more about this choice.

## Creeps

<<< @/../examples/tower-defense/components/Position.ts

<<< @/../examples/tower-defense/components/Health.ts

<<< @/../examples/tower-defense/components/Creep.ts

A creep follows the path. The follower keeps the index of the next waypoint, and the distance passed, which towers use
to choose their target:

<<< @/../examples/tower-defense/components/PathFollower.ts

## Towers and targets

<<< @/../examples/tower-defense/systems/TowerSystem.ts

The system works with every entity that has a position and a weapon, and reads characteristics from the weapon. An
upgraded tower fires further and stronger, and the system doesn't know about it.

The tower looks through creeps in range, and chooses the one that has passed the longest distance. Towers are updated
before projectiles and effects deal their damage, so all creeps they see are alive: creeps killed in the previous update
have already been removed.

## Projectiles carry their effects

When a tower fires, its damage and effects are copied to the projectile:

<<< @/../examples/tower-defense/entities/createProjectile.ts

<<< @/../examples/tower-defense/components/Projectile.ts

The projectile is independent of the tower: if the tower is upgraded while the projectile is flying, the projectile
hits with the characteristics of the shot. And the projectile system doesn't need towers at all: it checks which
effects the projectile has.

<<< @/../examples/tower-defense/systems/ProjectileSystem.ts

## References between entities

A projectile keeps a reference to its target. But the target can die or escape before the projectile reaches it. The
projectile system checks it with `creeps.has(target)`: the target is still a creep with health, that projectiles can
hit. It's a cheap check, and it doesn't require the target to know about projectiles flying to it.

Remember that a removed entity leaves queries only at the end of the update it was removed in. A creep that has
escaped is removed from the engine after the update, so the path system also removes its `Health`: the creep leaves
queries of towers, projectiles and death right away, and can't be killed after it has escaped. Otherwise the player
could lose a life and get gold for the same creep.

> ❗ Keep references to entities only as long as you check that they still take part in the game. A query of the
> components you need is the simplest way to check it.

## Linked components for effects

A creep can be slowed several times. If `Slow` were a usual component, the second slow would replace the first one,
and when it expired, the creep would lose both. That's what [linked components](/guide/linked-components) are for:
an entity can have several linked components of the same class.

<<< @/../examples/tower-defense/components/Slow.ts

<<< @/../examples/tower-defense/components/Poison.ts

Linked components are added with `append` instead of `add`, as the projectile system does on hit. They are processed
with `iterate`, which visits every linked component of the class. Expired ones are removed with `pick`, which removes
one particular component and keeps the others. These systems are small, so they are written right where they are
added to the engine:

<<< @/../examples/tower-defense/game.ts#systems

Poisons stack: every poison deals its damage. Slows don't: the path system applies the strongest one.

<<< @/../examples/tower-defense/systems/PathSystem.ts

> 💡 A query of `[Slow]` contains every entity that has at least one slow. The component passed to the system is the
> first one, and `entity.iterate(Slow, ...)` visits all of them.

## Death

Creeps are damaged by projectiles and poisons, in different systems. If every system removed killed creeps, a creep
could be killed twice in one update, and give gold twice. Instead, damage only decreases health, and the death system,
that runs after all damage, removes creeps without health. You can see it at the end of the systems above.

## Game state outside of entities

Gold and lives belong to the player. They could be components of a "player" entity, but nothing would ever query it:
there is only one player, and systems don't even read gold and lives, they only report what has happened. A plain
object kept by the game is simpler:

<<< @/../examples/tower-defense/Economy.ts

The game keeps it, and changes it when messages arrive: `CreepKilled` adds gold, `CreepEscaped` takes a life. See
[Where to keep game state?](/decisions/game-state) for more about this choice.

## Building and upgrading

Building and upgrading are actions of the player, not something that happens every update, so they are methods of the
game. They check gold, the map and existing towers, create a tower or equip it with the next level:

<<< @/../examples/tower-defense/game.ts#actions

The whole game:

<<< @/../examples/tower-defense/game.ts

## Rendering and input

A creep view has a health bar, and is tinted when the creep is slowed or poisoned:

<<< @/../examples/tower-defense/render/CreepView.ts

A tower is drawn by its kind and level. An upgrade replaces the `Tower` component: replacing a component removes the
entity from queries of the component and adds it again, so the reaction system attaches a new view, and the view system
destroys the previous one. Rendering reacts to upgrades without knowing about them.

<<< @/../examples/tower-defense/render/addRendering.ts

Towers are built and upgraded with the pointer. The placement shows the cell and the range the tower would have, and
builds a tower in an empty cell or upgrades the tower on click:

<<< @/../examples/tower-defense/input/pointer.ts

## What we've learned

- Not everything must be an entity: static data is just data.
- Kinds of things are data, but every entity owns its state: data is turned into components when an entity is created,
  and changing components changes the entity, for example on upgrade.
- Behaviour is composed from optional components, and systems don't depend on kinds.
- Linked components store several components of the same class, `iterate` visits them, and `pick` removes one of them.
- Game state, that doesn't belong to entities, can be a plain object kept by the game.
- References to entities are checked with queries before use.
- Damage from different systems is resolved by one system that runs after all of them.

That's all the tutorials. 🎉 Now it's time to build your own game. When you face a choice, look into
[Decisions](/decisions/).
