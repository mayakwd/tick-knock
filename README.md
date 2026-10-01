# Tick-Knock

> Small and powerful, type-safe and easy-to-use Entity-Component-System (ECS)
> library written in TypeScript

[![Build Status](https://github.com/mayakwd/tick-knock/actions/workflows/build.yml/badge.svg)](https://github.com/mayakwd/tick-knock/actions/workflows/build.yml)

📖 [Documentation](https://mayakwd.github.io/tick-knock) · 🎮 [Examples](https://mayakwd.github.io/tick-knock/examples/) · 😊 [Buy me a coffee](https://www.buymeacoffee.com/rdolivaw)

# Table of contents

- [Installing]
- [Quick start]
- [What's new in 5.0]
- [Migrating from 4.x]
    - [Breaking changes]
    - [Moving to the typed API]
- [Documentation]
- [Examples]
- [Performance]
- [Development]
- [License]

# Installing

- PNPM: `pnpm add tick-knock`
- Yarn: `yarn add tick-knock`
- NPM: `npm i --save tick-knock`


# Quick start

Components are plain classes, systems process entities that have the components they need, and the engine updates
systems in order of their priority.

```typescript
import {Engine, Entity, IterativeSystem} from 'tick-knock';

class Position {
  public constructor(public x = 0, public y = 0) {}
}

class Velocity {
  public constructor(public x = 0, public y = 0) {}
}

class MovementSystem extends IterativeSystem.of(Position, Velocity) {
  protected updateEntity(entity: Entity, dt: number, position: Position, velocity: Velocity) {
    position.x += velocity.x * dt;
    position.y += velocity.y * dt;
  }
}

const engine = new Engine();
engine.addSystem(new MovementSystem());
engine.addEntity(new Entity().add(new Position()).add(new Velocity(10, 0)));

// Half a second has passed from the previous step
engine.update(0.5);
```

Continue with the [Guide](https://mayakwd.github.io/tick-knock/guide/) to learn all basics step by step.

# What's new in 5.0

- **Faster.** Queries store entities and their components in dense arrays, so iteration, adding and removing entities
  and component changes are several times faster, and entities take ~4x less memory. See [Performance].
- **Typed queries.** `QueryBuilder` infers types of components, and `Query.forEach` passes them to the callback:

  ```typescript
  const movable = new QueryBuilder().with(Position, Velocity).build(); // Query<[Position, Velocity]>
  engine.addQuery(movable);
  movable.forEach((entity, position, velocity) => {
    position.x += velocity.x;
  });
  ```

- **Exclusions.** `without` excludes entities with specific components or tags from queries and systems:
  `IterativeSystem.of(Position, Velocity, without(Frozen))`.
- **Typed systems.** `IterativeSystem.of` and `ReactionSystem.of` create base classes of systems, which receive
  components of the entity with inferred types, no more `entity.get(Position)!`:

  ```typescript
  class MovementSystem extends IterativeSystem.of(Position, Velocity) {
    protected updateEntity(entity: Entity, dt: number, position: Position, velocity: Velocity) {
      position.x += velocity.x * dt;
    }
  }
  ```

- **Functional systems.** Small systems don't need a class at all:

  ```typescript
  engine
    .iterative([Position, Velocity], (entity, dt, position, velocity) => {
      position.x += velocity.x * dt;
    })
    .reactive([View, Position], {
      added: (snapshot, view, position) => stage.addChild(view.sprite),
      removed: (snapshot, view) => stage.removeChild(view.sprite),
    });
  ```

- **System identifiers.** Systems are added with options `{priority, id}`, found with `engine.getSystemById(id)` and
  removed with `engine.removeSystem(id)`.
- **Safe removal by default.** Entities removed during the update are removed after all systems have been updated,
  so systems never see half-removed entities.
- **Examples and benchmarks.** The repository contains [Examples] of simple games and benchmarks comparing tick-knock
  with other ECS libraries.

See [CHANGELOG](CHANGELOG.md) for the full list of changes.


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

Systems that only update components can become [Functional systems], and priorities can be passed with identifiers:

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


# Documentation

The documentation is published at [mayakwd.github.io/tick-knock](https://mayakwd.github.io/tick-knock):

- [Guide](https://mayakwd.github.io/tick-knock/guide/) explains the engine, components, tags, entities, queries, systems, snapshots and linked components.
- [Tutorials](https://mayakwd.github.io/tick-knock/tutorials/) build Snake, Asteroids, a bullet hell and a tower defense from scratch, step by step.
- [Decisions](https://mayakwd.github.io/tick-knock/decisions/) answer questions that appear in every project: component or tag, which system to choose,
  where to keep the game state.
- [API reference](https://mayakwd.github.io/tick-knock/api/) describes every class and method.

# Examples

The [examples](examples) folder contains small games built with tick-knock and rendered with
[pixi.js](https://pixijs.com): Snake, Asteroids, a bullet hell and a tower defense. Play them on the
[site](https://mayakwd.github.io/tick-knock/examples/), or run them locally:

```shell
pnpm --filter tick-knock-examples dev      # open all games in the browser
pnpm --filter tick-knock-examples snake    # play Snake in the terminal
```

# Performance

The repository contains benchmarks in the [bench](bench) folder. They compare tick-knock with its previous versions
and with other TypeScript ECS libraries: Ape-ECS, becsy, bitecs, ecsy, geotic, koota, miniplex and sim-ecs.

```shell
pnpm bench                          # benchmark current sources and other ECS libraries
pnpm bench --baseline 4.3.0         # also benchmark a published tick-knock version
pnpm bench --filter iterate         # run only matching scenarios
```

Benchmarks also run in CI on dedicated hardware with [Bencher](https://bencher.dev), so every pull request to `develop`
shows how it affects performance. Results of the latest measurement:

<!-- benchmarks:start -->

Measured on [Bencher](https://bencher.dev/perf/tick-knock) bare metal runner (Intel, 4 cores), Node 22.

Speed is measured in operations per second (more is better), memory in bytes per entity (less is better).
The best result in every scenario is marked with bold, "–" means that scenario is not implemented by the library.

| Scenario | tick-knock (current) | tick-knock 4.3.0 | Ape-ECS 1.3.1 | becsy 0.15.5 | bitecs 0.4.0 | ecsy 0.4.3 | geotic 4.3.2 | koota 0.6.6 | miniplex 2.0.0 | sim-ecs 0.6.4 |
| :--- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| insert | **1,716** | 131 | 140 | 625 | 665 | 479 | 251 | 804 | 1,040 | 202 |
| iterate small | 147,449 | 16,270 | 76,301 | 4,255 | **165,317** | 43,371 | 134,553 | 100,080 | 56,309 | 2,259 |
| iterate large | 1,060 | 96.4 | 269 | 60.5 | **2,229** | 185 | 480 | 1,431 | 431 | 1,142 |
| component churn | **1,821** | 36.7 | 247 | 1,583 | 798 | 610 | 415 | 1,392 | 284 | – |
| unrelated churn | **5,126** | 37.4 | 251 | 2,265 | 2,491 | 1,159 | 552 | 2,613 | 329 | – |
| tag churn | **3,163** | 41.0 | – | – | – | – | – | – | – | – |
| spawn/despawn | **1,095** | 17.1 | 75.2 | 333 | 396 | 22.1 | 18.6 | 230 | 591 | – |
| reactive system | 1,949 | 157 | 431 | 1,328 | 1,385 | 649 | 654 | **2,394** | 532 | – |
| linked components | **695** | 52.9 | – | – | – | – | – | – | – | – |
| messages | **262** | 192 | – | – | – | – | – | – | – | – |
| memory per entity | 368 B | 1,472 B | 1,737 B | **216 B** | 282 B | 911 B | 406 B | 370 B | 256 B | 674 B |

<!-- benchmarks:end -->

See [bench/README.md](bench/README.md) for the description of scenarios and details.

# Development

The repository is a [pnpm](https://pnpm.io) workspace with the library, [benchmarks](bench), [examples](examples) and
the documentation [site](site). The library is written in TypeScript 7.

```shell
pnpm install                               # install dependencies of all packages
pnpm build                                 # build the library to lib
pnpm test                                  # run unit tests
pnpm typecheck                             # check types of sources and tests
pnpm bench                                 # run benchmarks, see bench/README.md
pnpm --filter tick-knock-site dev          # start the documentation site
```

# License

This software released under [MIT](LICENSE) license! Good luck, folks.

[Installing]: #installing
[Quick start]: #quick-start
[What's new in 5.0]: #whats-new-in-50
[Migrating from 4.x]: #migrating-from-4x
[Breaking changes]: #breaking-changes
[Moving to the typed API]: #moving-to-the-typed-api
[Documentation]: #documentation
[Examples]: #examples
[Performance]: #performance
[Development]: #development
[License]: #license
[Functional systems]: https://mayakwd.github.io/tick-knock/guide/built-in-systems#functional-systems
