# Remove the entity or the component?

**Short answer:** remove the entity when it's gone. Also remove the component that queries depend on, if the entity
must stop taking part in the game immediately.

## Removal is deferred during the update

Entities removed while the engine is being updated are removed after all systems have been updated. Until then, they
stay in queries. This guarantees that every system sees the same world, and removing entities never breaks iteration of
other systems. Outside of the update, entities are removed immediately.

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
- A slow has expired — one `Slow` is picked from the creep, others stay.

## Checking that an entity is still alive

If you keep a reference to an entity, like a projectile keeps its target in the
[Tower defense](/tutorials/tower-defense), check that it's still in the engine before using it. A query is the
simplest way: `creeps.has(target)`.
