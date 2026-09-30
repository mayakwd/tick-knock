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
- **Towers** choose a target in range and keep firing at it while it's alive and in range. Most towers choose the
  creep, that is the closest to the exit, poison towers choose the creep with the most health. There are four kinds:
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
entities. It's plain data: turns of the path in cells and in pixels, and functions that tell whether a cell is on
the path, and whether a tower can be built in it.

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

Where it is, is a separate component. Towers and creeps both have a cell of the map:

<<< @/../examples/tower-defense/components/Cell.ts

Every tower has a weapon, which fires not more often than its [cooldown](/tutorials/asteroids#components) allows:

<<< @/../examples/tower-defense/components/Weapon.ts

And a payload, that describes what a hit does: the damage, the splash, and optional effects. The same description is
used by levels in the table and by the component, so the component is created from a level as is:

<<< @/../examples/tower-defense/components/Payload.ts

There is no "cannon" or "frost tower" in the logic of the game. A cannon is a tower which payload has a splash, a frost
tower of the last level has a slow and a splash. Behaviour is composed from data.

A new tower is an entity with its cell, position, target and the `Tower` component of the first level:

<<< @/../examples/tower-defense/entities/createTower.ts

Its weapon, payload and view come from the level, and a reaction system of `Tower` adds them. It's called when a tower
appears, and when an upgrade replaces its `Tower` with the next level, so building and upgrading are the same thing
for it:

```typescript
this.engine.reactive([Tower], {
  added: ({current}, {kind, level}) => {
    const {targeting, levels} = TOWERS[kind];
    const {range, interval, projectileSpeed, payload} = levels[level];
    current
      .add(new Weapon(range, interval, projectileSpeed))
      .add(new Payload(payload))
      .add(new View(drawTower(kind, level)))
      .add(targeting);
  },
});
```

Adding a component, that the entity already has, replaces it, so the tower becomes exactly what the level describes.
An upgrade is one line: `tower.add(new Tower(kind, level + 1))`. See
[Data or components?](/decisions/data-or-components) for more about this choice.

## Creeps and waves

<<< @/../examples/tower-defense/components/Position.ts

<<< @/../examples/tower-defense/components/Health.ts

<<< @/../examples/tower-defense/components/Creep.ts

A creep follows the path. The follower keeps the index of the next turn, and the distance passed, which towers use
to choose their target:

<<< @/../examples/tower-defense/components/PathFollower.ts

Waves are data too: the size of a wave and creeps of a wave are functions of its number, so the balance is tuned in
one place, and the spawn system only counts time:

<<< @/../examples/tower-defense/waves.ts

<<< @/../examples/tower-defense/systems/SpawnSystem.ts

The path system moves creeps with `moveTowards` from the shared geometry helpers. It returns the part of the step left
after a turn has been reached, so a fast creep turns the corner in the same update instead of stopping at it. When
a creep crosses into another cell, it gets a new `Cell`:

<<< @/../examples/tower-defense/systems/PathSystem.ts

## Choosing a target

A naive tower scans all creeps every time it fires, and compares distances in a long condition. It works for a few
towers, but it's wasteful, and it's not how tower defense games work: a tower keeps its target while the target is
alive and in range, and looks for a new one only when it's lost.

So the target is state of the tower:

<<< @/../examples/tower-defense/components/Target.ts

And when a tower looks for a target, it asks a **spatial index**: creeps indexed by cells of the map. It gives only
creeps in cells around the tower, instead of all creeps:

<<< @/../examples/tower-defense/SpatialIndex.ts

The index is not updated by the systems that move creeps. It's an index of the `Cell` component, and reaction
systems maintain it: a creep is added when it gets a cell, and when the path system gives it a new cell, the reaction
system sees the old cell removed and the new one added. A creep that has escaped loses its `Health`, so it leaves the
index of targets right away. Towers are indexed the same way, so the game finds the tower in a cell with a lookup:

```typescript
this.engine
  .reactive([Cell, Health, Creep], {
    added: ({current}, cell) => this.creeps.add(cell, current),
    removed: ({current}, cell) => this.creeps.remove(cell, current),
  })
  .reactive([Cell, Tower], {
    added: ({current}, cell) => this.towers.add(cell, current),
    removed: ({current}, cell) => this.towers.remove(cell, current),
  });
```

The rule of choosing a target is a tag: `TARGET_FIRST` or `TARGET_STRONGEST`. Every rule has its own targeting system:
the same class with the tag of the rule and a score of creeps, the distance passed or the health. A new rule is a new
tag and a new system, and the others don't change.

<<< @/../examples/tower-defense/systems/TargetingSystem.ts

The query of the system is built in the constructor with the tag of the rule, so one class serves all rules.

Distances are checked with `isWithin` from the shared geometry helpers. It compares squares of distances, so the check
reads as what it means, and doesn't calculate square roots.

## Projectiles carry their payload

When a tower fires, its payload is copied to the projectile:

<<< @/../examples/tower-defense/entities/createProjectile.ts

<<< @/../examples/tower-defense/components/Projectile.ts

The projectile is independent of the tower: if the tower is upgraded while the projectile is flying, the projectile
hits with the payload of the shot. And the projectile system doesn't need towers at all: on hit, it gives the target,
or all creeps around it, a component for every effect of the payload, and doesn't know what effects do. Creeps around
the target are found with the same spatial index.

<<< @/../examples/tower-defense/systems/ProjectileSystem.ts

## References between entities

A projectile keeps a reference to its target, and a tower keeps a reference to its target too. But the target can die
or escape. The projectile system checks it with `creeps.has(target)`: the target is still in the index of creeps with
health, that projectiles can hit. Towers check it the same way before they fire. It's a cheap check, and it doesn't require the
target to know who aims at it.

Remember that a removed entity leaves queries only at the end of the update it was removed in. A creep that has
escaped is removed from the engine after the update, so the path system also removes its `Health`: the creep leaves
the index of targets and queries of death right away, and can't be killed after it has escaped. Otherwise the player
could lose a life and get gold for the same creep.

> ❗ Keep references to entities only as long as you check that they still take part in the game. A query of the
> components you need is the simplest way to check it.

## Effects are linked components

A creep can be poisoned by three poison towers and slowed by two frost towers at the same time, and hit by several
projectiles in one update. Every effect is its own component:

<<< @/../examples/tower-defense/components/Hit.ts

<<< @/../examples/tower-defense/components/Slow.ts

<<< @/../examples/tower-defense/components/Poison.ts

If `Poison` were a usual component, the second poison would replace the first one, and when it expired, the creep
would lose both. That's what [linked components](/guide/linked-components) are for: an entity can have several
components of the same class. `Slow` and `Poison` are created from the descriptions of the payload, the same way
the payload is created from a level.

Linked components are added with `append` instead of `add`, as the projectile system does on hit. They are processed
with `iterate`, which visits every linked component of the class. Expired ones are removed with `pick`, which removes
one particular component and keeps the others. Every effect has its own small system, written right where it's added
to the engine among the other systems of the game. Here is the whole game: a class, which constructor adds indexes,
the reaction to levels of towers, systems in the order they are updated, and subscriptions to messages:

<<< @/../examples/tower-defense/game.ts

Hits are dealt once and removed. Poisons stack: every poison deals its damage. Slows don't: the path system applies
the strongest one. No system switches on a type of an effect: an effect is a class, and a system processes its class.

> 💡 A query of `[Poison, Health]` contains every creep that has at least one poison. The component passed to the
> system is the first one, and `entity.iterate(Poison, ...)` visits all of them.

## Death

Creeps are damaged by hits and poisons, in different systems. If every system removed killed creeps, a creep could be
killed twice in one update, and give gold twice. Instead, damage only decreases health, and the death system, that
runs after all damage, removes creeps without health. You can see it at the end of the systems above.

## Game state outside of entities

Gold and lives belong to the player. They could be components of a "player" entity, but nothing would ever query it:
there is only one player, and systems don't even read gold and lives, they only report what has happened. A small
class kept by the game is simpler:

<<< @/../examples/tower-defense/Economy.ts

The game keeps it, and changes it when messages arrive: `CreepKilled` adds gold, `CreepEscaped` takes a life. See
[Where to keep game state?](/decisions/game-state) for more about this choice.

## Building and upgrading

Building and upgrading are actions of the player, not something that happens every update, so they are methods of the
game, which you have seen above: `build`, `upgrade`, and methods, that tell whether they are possible. They check gold,
the map and the index of towers, create a tower or replace its `Tower` with the next level.

## Views and input

A creep view has a health bar, and is tinted when the creep is slowed or poisoned. The factory of creeps adds the view,
and a typed component besides `View`, so a system updates the health bar without casting:

<<< @/../examples/tower-defense/render/CreepView.ts

<<< @/../examples/tower-defense/render/CreepViewRef.ts

<<< @/../examples/tower-defense/entities/createCreep.ts

```typescript
this.engine.iterative([CreepViewRef, Health], (creep, dt, {view}, health) => {
  view.setHealth(health.value / health.max);
  view.setEffects(creep.has(Slow), creep.has(Poison));
});
```

A tower is drawn by its kind and level, so its view comes from the level, together with the weapon. An upgrade replaces
the view, and the view system destroys the previous one. A projectile is drawn by its payload.

Towers are built and upgraded with the pointer. The placement shows the cell and the range the tower would have, and
builds a tower in an empty cell or upgrades the tower on click. It asks the game what's possible, so the rules are in
one place:

<<< @/../examples/tower-defense/input/pointer.ts

The page extends the shared `Demo`: it draws the map under the world once, and updates the placement every frame:

<<< @/../examples/tower-defense/mount.ts

## What we've learned

- Not everything must be an entity: static data is just data.
- Kinds of things are data, but every entity owns its state: data is turned into components when an entity is created,
  and changing components changes the entity, for example on upgrade.
- The same description can be data of a level and a component, so it's copied from a level to a tower and a projectile
  without conversions.
- Behaviour is composed from data and components, and systems don't depend on kinds.
- Towers keep their targets, and look for new ones in a spatial index instead of scanning all creeps.
- An index is maintained by reaction systems on the component it indexes: an entity that moves gets a new `Cell`,
  and indexes follow it.
- Linked components store several components of the same class, `iterate` visits them, and `pick` removes one of them.
- Game state, that doesn't belong to entities, is kept by the game outside of entities.
- References to entities are checked with queries before use.
- Damage from different systems is resolved by one system that runs after all of them.

That's all the tutorials. 🎉 Now it's time to build your own game. When you face a choice, look into
[Decisions](/decisions/).
