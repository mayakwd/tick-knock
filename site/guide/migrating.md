# Migrating from 4.x

Code written for 4.x mostly works as is: systems with `updateEntity(entity, dt)`, reaction systems with
`entityAdded(snapshot)`, and queries built by `QueryBuilder` are still supported. So the project can be migrated
step by step: first fix the breaking changes, then move systems to the typed API where it's convenient.

## Breaking changes

- `Engine.sharedConfig` and `System.sharedConfig` are removed. Data shared between systems doesn't need to be an
  entity: pass it to systems in their constructors, or read it from the closure in functional systems.

  ```typescript
  // 4.x
  engine.sharedConfig.add(NO_VISUALS);
  engine.addSystem(new ViewSystem());
  // Inside of the system: this.sharedConfig.has(NO_VISUALS)

  // 5.0
  const config = {visuals: false};
  engine.addSystem(new ViewSystem(config));
  // Inside of the system: this.config.visuals
  ```

- `Engine.removeEntity` doesn't have the `safe` argument anymore: entities removed during the update are always removed
  after it, as `engine.removeEntity(entity, true)` did before. Outside of the update entities are removed immediately.
  If the system relied on immediate removal during the update, for example to not process the entity again in the same
  update, remove a component the other systems depend on, so the entity leaves their queries right away:

  ```typescript
  // 4.x: the bullet is removed immediately and can't hit another asteroid
  engine.removeEntity(bullet);

  // 5.0: the bullet leaves collision queries immediately and is removed after the update
  bullet.remove(Collider);
  engine.removeEntity(bullet);
  ```

- `Query.entities` returns an array of entities at the moment of the call, which is rebuilt after the query changes.
  Read `query.entities` again instead of keeping a reference to the array.
- Entities added to the query during an update of `IterativeSystem` are updated starting from the next update, and
  entities removed from the query during the update are not updated anymore.
- `EntitySnapshot.previous` is restored when it's accessed, so don't keep snapshots after handlers have returned.
- `Query` and built-in systems are generic now: `Query<C>`, where `C` are types of components. `Query` without type
  arguments accepts any query, so existing code compiles, but types of components are lost.
- The library is compiled to ES2017.

## Moving to the typed API

`IterativeSystem` with a query becomes `IterativeSystem.of` with components, which are passed to `updateEntity` after
the entity and the delta time, in the same order. Tags are checked, but not passed.

```typescript
// 4.x
class DamageSystem extends IterativeSystem {
  public constructor() {
    super(new QueryBuilder().contains(Health, Damage, ALIVE).build());
  }

  protected updateEntity(entity: Entity, dt: number) {
    const health = entity.get(Health)!;
    const damage = entity.get(Damage)!;
    health.value -= damage.value;
  }
}

// 5.0
class DamageSystem extends IterativeSystem.of(Health, Damage, ALIVE) {
  protected updateEntity(entity: Entity, dt: number, health: Health, damage: Damage) {
    health.value -= damage.value;
  }
}
```

The base class has no constructor arguments, so the system can have its own:

```typescript
class ViewSystem extends IterativeSystem.of(View, Position) {
  public constructor(private readonly config: {visuals: boolean}) {
    super();
  }
}
```

`ReactionSystem` becomes `ReactionSystem.of` the same way. `entityRemoved` receives components the entity had before
removing, including the removed one, so there's no need to read them from `snapshot.previous`:

```typescript
// 4.x
class ViewSystem extends ReactionSystem {
  public constructor(private readonly stage: Container) {
    super(new QueryBuilder().contains(View).build());
  }

  protected entityAdded = ({current}: EntitySnapshot) => {
    this.stage.addChild(current.get(View)!.sprite);
  };

  protected entityRemoved = ({previous}: EntitySnapshot) => {
    this.stage.removeChild(previous.get(View)!.sprite);
  };
}

// 5.0
class ViewSystem extends ReactionSystem.of(View) {
  public constructor(private readonly stage: Container) {
    super();
  }

  protected entityAdded = (snapshot: EntitySnapshot, view: View) => {
    this.stage.addChild(view.sprite);
  };

  protected entityRemoved = (snapshot: EntitySnapshot, view: View) => {
    this.stage.removeChild(view.sprite);
  };
}
```

Systems that only update components can become [Functional systems](/guide/built-in-systems#functional-systems), and priorities can be passed with identifiers:

```typescript
// 4.x
engine.addSystem(new MovementSystem(), 1);

// 5.0
engine.iterative([Position, Velocity], (entity, dt, position, velocity) => {
  position.x += velocity.x * dt;
}, {priority: 1, id: 'movement'});
```

Queries infer types of components from the builder. Iterating with `forEach` is faster than getting components
of every entity:

```typescript
// 4.x
const query = new QueryBuilder().contains(Position, Velocity).build();
for (const entity of query.entities) {
  const position = entity.get(Position)!;
}

// 5.0: `with` pairs with `without`, `contains` is deprecated
const query = new QueryBuilder().with(Position, Velocity).build();
query.forEach((entity, position, velocity) => {
  position.x += velocity.x;
});
```
