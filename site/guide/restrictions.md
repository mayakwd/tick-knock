# Restrictions

## Shared and Local Queries

In real development, you'll definitely face a situation when you want to reuse Query.

For example, when developing a game with heroes and enemies, you will surely always need two queries:

**Simplified version**

```typescript
const heroes = new Query(entity => entity.has(Hero));
const enemies = new Query(entity => entity.has(Enemy));
```

And you will want to use them in different systems. But the systems use local Queries. This means that after excluding a
system from Engine, the Query in it will no longer be updated.

To prevent this from happening, you need to use the shared queries approach. To do this, you only need to add the query
manually after initializing the Engine.

> shared-queries.ts

```typescript
export const heroes = new Query(entity => entity.has(Hero));
export const enemies = new Query(entity => entity.has(Enemy));
```

```typescript
import {heroes, enemies} from 'shared-queries';
// ...
engine.addQuery(heroes);
engine.addQuery(enemies)
```

Now you can use these Queries in any other system.

> ❗ Don't pass a shared query to a built-in system (`IterativeSystem`, `ReactionSystem`): a built-in system removes its
> query from the engine and clears it when the system is removed. Use shared queries in systems that don't own them,
> as in the example below.

**Example:**

```typescript
import {heroes, enemies} from 'shared-queries';

class DamageSystem extends IterativeSystem {
  // ...
  protected updateEntity(entity: Entity) {
    const damage = entity.remove(Damage)!
    const isHero = heroes.has(entity);
    if (damage.type === DamageType.SPLASH) {
      const neighbours = getNeighbours(isHero ? heroes : enemies);
      // ...
    }
  }
}
```

## Queries with complex logic and Entity invalidation

There are limitations for Query that do not allow you to track changes made inside components automatically.

Suppose that you want Query to track entities with an X position of 10.

```typescript
const query = new Query((entity) => entity.get(Position)?.x === 10);
```

And you have changed the Position parameters accordingly:

```typescript
entity.get(Position)!.x = 10;
```

The query will not know about these changes because the mechanism for tracking changes in component fields is redundant
and heavy, which will have a huge impact on performance. But to fix this, you can use an entity method
called `invalidate`, it will force Query to check this particular entity.

❗ Try not to use this approach too often. It may affect the performance of your application.
