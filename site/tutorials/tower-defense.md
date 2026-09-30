# Tower defense

In a tower defense, creeps walk along a path, and the player builds towers that shoot them, and upgrades them. It's the
most complex game of the tutorials, and it brings new questions:

- Kinds of towers are described by data. Where do characteristics of a particular tower live, so it can be upgraded?
- A creep can be slowed by two frost towers and poisoned by three poison towers at the same time. How to store several
  components of the same kind?
- A tower looks for creeps in its range. How to find them quickly?
- Gold and lives belong to the player, not to any entity. Where to keep them?
- A projectile flies to its target. What if the target dies before the projectile reaches it?

<GameDemo game="tower-defense" />

## The plan

- The **map** is a grid with a path. Towers can be built on any cell, that is not on the path.
- **Creeps** appear in waves, walk along the path, and take a life when they reach the exit.
- **Towers** choose a target in range, and keep firing at it while it's alive and in range. Most towers choose the
  creep, that is the closest to the exit, and poison towers choose the creep with the most health. There are four
  kinds:
  - **Arrow** fires fast.
  - **Cannon** deals damage in an area.
  - **Frost** slows creeps down.
  - **Poison** damages creeps over time.
- Every tower can be **upgraded** twice. Upgrades make towers stronger, and the last levels of frost and poison towers
  hit creeps around the target too.
- **Projectiles** fly to their targets.
- Killed creeps give **gold**, which is spent on towers and upgrades.

## The map is data

The map never changes. There is nothing to update, nothing to query, and nothing to react to, so it's plain data: turns
of the path in cells and in pixels, and functions that tell whether a cell is on the path, and whether a tower can be
built in it.

<<< @/../examples/tower-defense/map.ts

It's drawn once as a single picture. Entities are for things that change and are processed by systems.

## Kinds are data, towers own their state

Kinds of towers and their levels are described by data:

<<< @/../examples/tower-defense/towers.ts

The table is used when a tower is built or upgraded: the level is turned into components of the tower. From that
moment, the tower owns its characteristics, and systems work only with its components. A tower can be upgraded, and a
new kind of tower needs no changes in systems.

The tower knows what it is:

<<< @/../examples/tower-defense/components/Tower.ts

Where it is, is a separate component. Towers and creeps both have a cell of the map:

<<< @/../examples/tower-defense/components/Cell.ts

Every tower has a weapon, and fires when its [cooldown](/tutorials/asteroids#cooldown) is over:

<<< @/../examples/tower-defense/components/Weapon.ts

And a payload, that describes what a hit does: the damage, the splash, and optional effects. The same description is
used by levels in the table and by the component, so the component is created from a level as is:

<<< @/../examples/tower-defense/components/Payload.ts

A cannon is a tower which payload has a splash, and a frost tower of the last level has a slow and a splash. Behaviour
is composed from data. 🧩

A new tower is an entity with its cell, position, target, and the `Tower` component of the first level:

<<< @/../examples/tower-defense/entities/createTower.ts

Its weapon, cooldown, payload, and view come from the level, and a reaction system of `Tower` adds them. It's called when a tower
appears, and when an upgrade replaces its `Tower` with the next level, so building and upgrading are the same thing
for it:

```typescript
this.engine.reactive([Tower], {
  added: ({current}, {kind, level}) => {
    const {targeting, levels} = TOWERS[kind];
    const {range, interval, projectileSpeed, payload} = levels[level];
    current
      .add(new Weapon(range, projectileSpeed))
      .add(new Cooldown(interval))
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

Waves are data too: the size of a wave and creeps of a wave are functions of its number. The balance is tuned in one
place, and the spawn system only counts time:

<<< @/../examples/tower-defense/waves.ts

<<< @/../examples/tower-defense/systems/SpawnSystem.ts

The path system moves creeps with `moveTowards` from the shared geometry helpers. It returns the part of the step left
after a turn has been reached, so a fast creep turns the corner in the same update. When a creep crosses into another
cell, it gets a new `Cell`. A creep, that has reached the exit, escapes: it takes a life of the player, and is
destroyed:

<<< @/../examples/tower-defense/systems/PathSystem.ts

## Choosing a target

A tower keeps its target while the target is alive and in range, and looks for a new one only when it's lost. So the
target is the state of the tower:

<<< @/../examples/tower-defense/components/Target.ts

When a tower looks for a target, it asks a **spatial index**: creeps indexed by cells of the map. The index gives only
creeps in cells around the tower:

<<< @/../examples/tower-defense/SpatialIndex.ts

The index is kept by reaction systems of the `Cell` component. A creep is added when it gets a cell, and when the path
system gives it a new cell, the reaction system sees the old cell removed and the new one added. A creep, that has lost
its `Health`, leaves the index of targets right away. Towers are indexed the same way, so the game finds the tower in
a cell with a lookup:

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

The rule of choosing a target is a tag: `TARGET_FIRST` or `TARGET_STRONGEST`. Every rule has its own targeting system,
and both of them choose the creep with the best score in range: the distance passed or the health. A new rule is a new
tag and a new system.

<<< @/../examples/tower-defense/systems/TargetingSystem.ts

Distances are checked with `isWithin` from the shared geometry helpers: it compares squares of distances, and reads as
what it means.

## Projectiles carry their payload

When a tower fires, its payload is copied to the projectile:

<<< @/../examples/tower-defense/entities/createProjectile.ts

<<< @/../examples/tower-defense/components/Projectile.ts

The projectile is independent of the tower: if the tower is upgraded while the projectile is flying, the projectile
hits with the payload of the shot. On hit, the projectile system gives the target, or all creeps around it, a component
for every effect of the payload. Creeps around the target are found with the same spatial index.

<<< @/../examples/tower-defense/systems/ProjectileSystem.ts

## References between entities

A projectile keeps a reference to its target, and a tower keeps a reference to its target too. What if the target dies
or escapes? The projectile system checks it with `creeps.has(target)`: the target is still in the index of creeps with
health. Towers check it the same way before they fire.

A creep dies or escapes, and is destroyed with the `DESTROYED` tag, as in the previous tutorials. It stays in the
engine until the end of the update, but it must stop taking part in the game right away. Let's react to the tag:
a destroyed creep loses its `Health`. It leaves the index of targets, and queries of damage and death, so it can't be
hit or killed once again:

```typescript
this.engine
  .reactive([Health, DESTROYED], {added: ({current}) => current.remove(Health)})
  .addSystem(new DestroySystem());
```

> ❗ Keep references to entities only as long as you check that they still take part in the game. A query or an index
> of the components you need is the simplest way to check it.

## Effects are linked components

A creep can be poisoned by three poison towers and slowed by two frost towers at the same time, and hit by several
projectiles in one update. Every effect is its own component:

<<< @/../examples/tower-defense/components/Hit.ts

<<< @/../examples/tower-defense/components/Slow.ts

<<< @/../examples/tower-defense/components/Poison.ts

What will happen, if `Poison` is a usual component? The second poison will replace the first one. That's what
[linked components](/guide/linked-components) are for: an entity can have several components of the same class.
`Slow` and `Poison` are created from the descriptions of the payload, the same way the payload is created from
a level.

Linked components are added with `append`, as the projectile system does on hit. They are processed with `iterate`,
which visits every linked component of the class. Expired ones are removed with `pick`, which removes one particular
component and keeps the others.

## The game

Here is the whole game. Its constructor adds indexes, the reaction to levels of towers, and systems in the order they
are updated. Its methods are actions of the player:

<<< @/../examples/tower-defense/game.ts

A few things to notice:

- Every effect has its own small system, written right where it's added. Hits are dealt once and removed. Poisons
  stack: every poison deals its damage. Slows don't: the path system applies the strongest one. Every effect is
  a class, and every system processes its class.
- The death system runs after all damage of the update has been dealt. A killed creep gives gold, and is destroyed.
  Then it has no health, so it's killed only once.
- Building and upgrading are actions of the player, so they are methods of the game. They check gold, the map, and the
  index of towers, create a tower or replace its `Tower` with the next level.

> 💡 A query of `[Poison, Health]` contains every creep that has at least one poison. The component passed to the
> system is the first one, and `entity.iterate(Poison, ...)` visits all of them.

## Game state outside of entities

Gold and lives belong to the player. There is only one player, and it's not an entity, so gold and lives are kept by
the game:

<<< @/../examples/tower-defense/Economy.ts

Systems, that change them, receive the economy explicitly: the death system gives gold for a killed creep, and the path
system takes a life, when a creep escapes.

The game is over when there are no lives left, and the path system dispatches `GameOver` for the page, when the last
life is lost. See [Where to keep game state?](/decisions/game-state) for more about
this choice.

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

A tower is drawn by its kind and level, so its view comes from the level, together with the weapon. An upgrade
replaces the view, and the view system destroys the previous one. A projectile is drawn by its payload.

Towers are built and upgraded with the pointer. The placement shows the cell and the range the tower would have, and
builds a tower in an empty cell or upgrades the tower on click. It asks the game what's possible, so the rules are in
one place:

<<< @/../examples/tower-defense/input/pointer.ts

The page is the [demo](/tutorials/demo): it draws the map under the world once, and updates the placement every
frame:

<<< @/../examples/tower-defense/mount.ts

## What we've learned

- Static data is just data.
- Kinds of things are data, but every entity owns its state: data is turned into components when an entity is created,
  and changing components changes the entity, for example on upgrade.
- The same description can be data of a level and a component, so it's copied from a level to a tower and a projectile
  as is.
- Behaviour is composed from data and components, and systems don't depend on kinds.
- Towers keep their targets, and look for new ones in a spatial index.
- An index is kept by reaction systems of the component it indexes: an entity that moves gets a new `Cell`, and indexes
  follow it.
- Linked components store several components of the same class, `iterate` visits them, and `pick` removes one of them.
- Game state, that doesn't belong to entities, is kept by the game.
- References to entities are checked with queries or indexes before use.
- Damage from different systems is resolved by one system that runs after all of them.

That's all the tutorials. 🎉 Now it's time to build your own game. When you face a choice, look into
[Decisions](/decisions/).
