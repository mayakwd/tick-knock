# Remove the entity or the component?

**Short answer:** destroy the entity with a tag, and let a system remove it. Remove a component, when only one aspect
of the entity is gone.

## Removal is deferred during the update

Entities removed while the engine is being updated are removed after all systems have been updated. Until then, they
stay in queries and in `engine.entities`, but `engine.getEntityById` doesn't find them. This guarantees that every
system of the update sees the removed entity, and removing entities never breaks iteration of other systems. Only
removal is deferred: added entities and changed components are seen right away. Outside of the update, entities are
removed immediately.

## Destroying with a tag

Systems of the examples don't remove entities themselves. They add the `DESTROYED` tag, and the destroy system reacts
to it:

<<< @/../examples/shared/ecs/tags.ts

<<< @/../examples/shared/systems/DestroySystem.ts

Why not just remove the entity? Because destruction often has consequences. A destroyed asteroid splits into smaller
ones, a destroyed creep gives gold. The destroyed entity stays in the engine until the end of the update, so systems
updated after can handle it: they are ordinary systems, that query the tag.

## Taking an entity out of the game immediately

A bullet in [Asteroids](/tutorials/asteroids) hits an asteroid, and both of them are destroyed. But until the end of the
update they are still in queries: could the bullet hit another asteroid, or another bullet hit the same asteroid?

A destroyed entity must stop taking part in the game right away. Every game reacts to the tag, and removes the component
the game depends on:

```typescript
engine.reactive([Collider, DESTROYED], {added: ({current}) => current.remove(Collider)});
```

The queries of collisions and the tree of asteroids contain `Collider`, so the destroyed entity leaves them
immediately. The same way destroyed food of [Snake](/tutorials/snake) loses its `Cell`, and leaves the grid. The
[Tower defense](/tutorials/tower-defense) excludes the tag from queries instead: its index of creeps is kept by a system
of `ReactionSystem.of(Cell, ..., CREEP, without(DESTROYED))`, so a destroyed creep leaves the index at once.

## Removing a component instead of the entity

Sometimes the entity is not gone, only one of its aspects is:

- The invulnerability of the player is over — `Invulnerable` is removed, the player stays.
- A poison has expired — one `Poison` is picked from the creep, others stay.
- The snake has crashed — the head loses its `Heading`, and doesn't move anymore.

## Checking an entity you keep a reference to

If you keep a reference to an entity, like a projectile keeps its target in the
[Tower defense](/tutorials/tower-defense), check that it still takes part in the game before using it. A query of the
components you need is the simplest way. In the Tower defense a target is an entry of the index of creeps, and
`isAlive` checks that the creep hasn't been destroyed, even before it's removed from the engine.
