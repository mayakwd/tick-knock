# Remove the entity or the component?

**Short answer:** remove the entity when it's gone. Also remove the component that queries depend on, if the entity
must stop taking part in the game immediately.

## Removal is deferred during the update

Entities removed while the engine is being updated are removed after all systems have been updated. Until then, they
stay in queries and in `engine.entities`, but `engine.getEntityById` doesn't find them. This guarantees that every
system of the update sees the removed entity, and removing entities never breaks iteration of other systems. Only
removal is deferred: added entities and changed components are seen right away. Outside of the update, entities are
removed immediately.

## Taking an entity out of queries immediately

In [Asteroids](/tutorials/asteroids), a bullet hits an asteroid and is removed. But until the end of the update it's
still in the query of bullets, and could hit another asteroid. The solution is to remove its collider:

```typescript
bullet.remove(Collider);
this.engine.removeEntity(bullet);
```

The query of bullets contains `Collider`, so the bullet leaves it immediately. It's removed from the engine after the
update.

## Removing a component instead of the entity

Sometimes the entity is not gone, only one of its aspects is:

- The invulnerability of the player is over — `Invulnerable` is removed, the player stays.
- A poison has expired — one `Damage` is picked from the creep, others stay.

## Checking an entity you keep a reference to

If you keep a reference to an entity, like a projectile keeps its target in the
[Tower defense](/tutorials/tower-defense), check that it still takes part in the game before using it. A query of the
components you need is the simplest way: `creeps.has(target)`.

A query still contains an entity removed during the current update. If the entity must stop taking part in the game
immediately, remove a component the query depends on together with the entity: an escaped creep in the tower defense
loses its `Health`, so projectiles can't hit it anymore. `engine.getEntityById(entity.id)` returns `undefined` for an
entity removed during the update, when you need to know whether it's going to be removed.
