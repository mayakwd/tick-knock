# Tick-Knock

> Small and powerful, type-safe and easy-to-use Entity-Component-System (ECS)
> library written in TypeScript

[![Build Status](https://github.com/mayakwd/tick-knock/actions/workflows/build.yml/badge.svg)](https://github.com/mayakwd/tick-knock/actions/workflows/build.yml)

😊 [Buy me a coffee](https://www.buymeacoffee.com/rdolivaw)

# Table of contents

- [Installing]
- [What's new in 5.0]
- [Migrating from 4.x]
    - [Breaking changes]
    - [Moving to the typed API]
- [How it works?]
- [Inside the Tick-Knock]
    - [Engine]
        - [Subscription]
    - [Component]
    - [Linked Component]
    - [Tag]
    - [Entity]
    - [System]
    - [Query]
        - [QueryBuilder]
        - [Typed queries]
        - [Queries and Systems]
        - [Built-in query-based systems]
            - [ReactionSystem]
            - [IterativeSystem]
            - [Remove the system as it's done]
            - [Functional systems]
    - [Snapshot]
    - [Linked Components How-To]
- [Examples]
- [Performance]
- [Restrictions]
    - [Shared and Local Queries]
    - [Queries with complex logic and Entity invalidation]
- [Development]
- [License]

# Installing

- PNPM: `pnpm add tick-knock`
- Yarn: `yarn add tick-knock`
- NPM: `npm i --save tick-knock`

# What's new in 5.0

- **Faster.** Queries store entities and their components in dense arrays, so iteration, adding and removing entities
  and component changes are several times faster, and entities take ~4x less memory. See [Performance].
- **Typed queries.** `QueryBuilder` infers types of components, and `Query.forEach` passes them to the callback:

  ```typescript
  const movable = new QueryBuilder().contains(Position, Velocity).build(); // Query<[Position, Velocity]>
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

// 5.0
const query = new QueryBuilder().contains(Position, Velocity).build();
query.forEach((entity, position, velocity) => {
  position.x += velocity.x;
});
```

# How it works?

Tick-Knock was inspired by several ECS libraries, mostly by [Ash ECS](https://www.richardlord.net/ash/).

The main approach was re-imagined to make it lightweight, easy-to-use, and less boiler-plate based.

# Inside the Tick-Knock

In this part, you will learn all basics of Tick-Knock step by step.

## Engine

Engine is a "world" where entities, systems, and queries interact with each other.

Since the Engine is the initial entry point for development with Tick-Knock, it is from this point that the creation of
your world starts. Usually, the Engine exists in just one instance, and it does nothing but orchestrating everything
added to it.

To begin with, you can add the most usual "inhabitants" to it.

```typescript
const engine = new Engine();
const entity = new Entity()
  .add(new Hero())
  .add(new Health(10));
engine.addEntity(entity);
```

Or you can take it out:

```typescript
engine.removeEntity(entity);
```

If the engine is being updated, for example when a system removes an entity, the entity is removed after all systems
have been updated. Removing entities never breaks iteration of other systems, but until the end of the update the
removed entity stays in queries. If you need an entity to leave some queries immediately, remove the components these
queries depend on. Outside of the update entities are removed immediately.

The second main "inhabitant" is System. It is responsible for processing Entities and their components. We will learn
about them in detail later.

```typescript
engine.addSystem(new ViewSystem(), 1);
engine.addSystem(new PhysicsSystem(), 2);
```

As you may have noticed, we pass two parameters: system instance, and the second is update priority. The higher the
priority number is, the later the system will be processed.

Instead of the priority you can pass options with the priority and an identifier. The identifier allows you to find or
remove the system later:

```typescript
engine.addSystem(new ViewSystem(), {priority: 1, id: 'view'});
engine.getSystemById('view');
engine.removeSystem('view');
```

The third type of resident is Query, which is responsible for mapping entities within the Engine and returns a list of
already filtered and ready-to-use entities.

```typescript
const heroesQuery = new Query((entity) => entity.has(Hero));
engine.addQuery(heroesQuery);
```

The main task of the engine is to start the world update process and to report on the ongoing changes to Queries.  
These changes can be: additions to and removal of entities from the Engine, and changes in the components of specific
Entities.

To perform the update step, we must call the `update` method and pass as a parameter the time elapsed since the previous
update.  
Every time we start an update, the systems take turns, in order of priority, executing their own update methods.

```typescript
// Half a second has passed from the previous step.
engine.update(0.5); 
```

### Subscription

An additional - one of the Engine's responsibilities - transferring the messages from systems to the user. This can be
very useful when, for example, you want to report that the round in your game is over.

```typescript
engine.subscribe(GameOver, (message: GameOver) => {
  if (message.win) {
    this.showWinMessage();
  } else {
    this.showLoseMessage();
  }
});
```

You can use not only class type as an argument but any value. For example, it could be a string or number.

```typescript
const GAME_OVER = 'gameOver';
engine.subscribe(GAME_OVER, () => {
  this.showGameOver();
});
```

> **Details of implementation**
>
> When the `dispatch` method is called in the system, then to get the right listeners, the compliance of
> the `messageType` for each subscription will be checked.
> - If `typeof subscription.messageType` is a `'function'`, then the matching will be performed using `instanceof`.
> - Otherwise, the matching will be done through strict equality `message === subscription.messageType`.

## Component

It is a data object, its purpose - to represent a single aspect of your entity. For example, position, velocity,
acceleration.

- ❕ Any class could be considered as the component. There are no restrictions.
- ❗ For proper understanding, it needs to be noticed that the component should be a data class, without any logic.
  Otherwise, you'll lose the benefits of the ECS pattern.

**Let's write your first component:**

```typescript
class Position {
  public constructor(
    public x: number = 0,
    public y: number = 0
  ) {}
}
```

> Yes, this is a component! 🎉

## Linked component

It is still a data class, but it is made to solve the problem when you need to have multiple components of the same
type.

Let's assume that you have a Damage component in your game. Several enemies attack the Hero simultaneously by adding the
Damage component to it. What will happen? Only the last Damage component will be added to the Hero Entity because every
previous one will be removed.

To solve this problem - you need to implement ILinkedComponent interface in your Damage component and "append" instead
of "add" the Damage component to the entity. That will do the job. After that, in DamageSystem you can find all damage
sources:

```typescript
class Damage extends LinkedComponent {
  public constructor(
    public readonly value: number
  ) {
    super()
  }
}

hero.append(new Damage(100));
hero.append(new Damage(5));

class DamageSystem extends IterativeSystem.of(Damage, Health) {
  protected updateEntity(entity: Entity, dt: number, damage: Damage, health: Health) {
    while (entity.has(Damage)) {
      health.value -= entity.withdraw(Damage)!.value;
    }
  }
}
```

## Tag

It also can be called a "label". It's a simplistic way to help you not "inflate" your code with classes without data.
For instance, you want to mark your entity as Dead. There are two ways:

- To create a component class: `class Dead {}`
- Or to create a tag - that can be represented as a `string` or `number`.

Using tags is much easier and consumes less memory if you do not have additional component data.

**Example:**

```typescript
const ENEMY = 'enemy';
const HERO = 100500;
```

> Keep it simple! 😄

## Entity

It is a general-purpose object, which can be marked with tags and can contain different components.

- So it can be considered as a container that can represent any in-game entity, like an enemy, bomb, configuration, game
  state, etc.
- Entity can contain only one component or tag of each type. You can't add two `Position` components to the entity, the
  second one will replace the first one. The only exception is [Linked Component].

**This is how it works:**

```typescript
const entity = new Entity()
  .add(new Position(100, 100))
  .add(new Position(200, 200))
  .add(HERO);

console.log(entity.get(Position)); // Position(x = 200, y = 200)
```

> Looks easy? Yes, it is!

## System

Systems are logic bricks in your application. If you want to manipulate entities, their components, and tags - it is the
right place.

Please, keep in mind that the complexity of the system mustn't be too high. When you find that your system is doing too
much in the "update" method, you need to split it into several systems.

Responsibility of the system should cover no more than one logical aspect.

The system always has the following functionality:

- Priority and an optional identifier, which are set when the system is added to the engine:
  `engine.addSystem(system, {priority, id})`.
- Reference to the `engine` will give you access to the engine itself and its entities. But be aware - you can't access
  an engine if the system is not connected to it. Otherwise, you'll get an error.
- Methods `onAddedToEngine` and `onRemovedFromEngine` will be called in the cases described by their naming.
- With the method `dispatch`, you can easily send a message outside of the system. It will be delivered through the
  engine [Subscription](#subscription) pipe. There are the same restrictions as for the engine. If the system is not
  attached to the engine, then an attempt to send a message will throw an error.
- And last but not least, the heart of your system - method `update`. It will be called whenever `Engine.update` is
  being invoked. Update method - the right place to put your logic.

**Example:**
It's time to write our first and straightforward system. It will iterate through all the entities that are in the
Engine, check if they have Position and Velocity components.  
And if they do, then move our object.

```typescript
class Velocity {
  public constructor(
    public x: number = 0,
    public y: number = 0
  ) {}
}

class PhysicsSystem extends System {
  public constructor() {
    super();
  }

  public update(dt: number): void {
    const {entities} = this.engine;
    for (const entity of entities) {
      if (entity.hasAll(Position, Velocity)) {
        const position = entity.get(Position)!;
        const velocity = entity.get(Velocity)!;
        position.x += velocity.x * dt;
        position.y += velocity.y * dt;
      }
    }
  }
}
```

> There you go!
> 🎁 In real life, you don't have to iterate through every entity in every system. It's completely uncomfortable and not
> optimal. In this library, there is a mechanism that can prepare a list of the entities that you need according to the
> criteria you set - it's called Query.

## Query

So what the "Query" is? It's a matching mechanism that can tell you which entities in the Engine are suitable for your
needs.

For example, you want to write a system that is responsible for displaying sprites on your screen. To do this, you
always need a current list of entities, each of which has three components - View, Position, Rotation, and you want to
exclude those marked with the HIDDEN tag.

**Let's write our first Query.**

```typescript
const displayListQuery = new Query((entity: Entity) => {
  return entity.hasAll(View, Position, Rotation) && !entity.has(HIDDEN);
});
```

> That's all!

After the Query is added to the Engine, it keeps track of entities that meet the described requirements, in the order
they started matching the query. `query.entities` returns an array of these entities at the moment of the call: it's
rebuilt after the query changes, so read it again instead of keeping a reference to it.
Besides, you can always find out when a new entity has appeared in the Query, or an old entity has left it.

```typescript
displayListQuery.onEntityAdded.connect(({current}: EntitySnapshot) => {
  console.log("We've got a rookie here!");
  container.addChild(current.get(View)!.view);
});
displayListQuery.onEntityRemoved.connect(({previous}: EntitySnapshot) => {
  container.removeChild(previous.get(View)!.view);
  console.log("Good bye, friend!");
});
```

### QueryBuilder

Query builder is super simple. It has not much power, but you can use it for creating queries that must contain specific
Components.

```typescript
const query = new QueryBuilder()
  .contains(ComponentA, ComponentB)
  .contains(TAG)
  .build();
```

And what if some entities must not get into the query? For example, frozen entities shouldn't move, and destroyed ones
shouldn't collide anymore. Exclude them with `without`:

```typescript
const movable = new QueryBuilder()
  .contains(Position, Velocity)
  .without(Frozen, DESTROYED)
  .build();
```

An entity leaves the query as soon as it gets an excluded component or tag, and joins it again when the component or tag
is removed. The same exclusion can be listed together with components, wherever they are listed:
`IterativeSystem.of(Position, Velocity, without(Frozen))`, `ReactionSystem.of(Collider, without(DESTROYED))` or
`engine.iterative([Position, without(Frozen)], ...)`.

> 💡 Prefer `QueryBuilder` whenever it's enough. Engine knows which components and tags such queries depend on, so
> adding or removing unrelated components doesn't touch them at all. Queries with predicates are checked on every
> change of every entity.

### Typed queries

`QueryBuilder` infers types of components it contains, so the query can pass them to you together with the entity.
Components are passed in the order they were specified, tags are only used for matching.

```typescript
const movable = new QueryBuilder()
  .contains(Position, Velocity)
  .contains(MOVABLE)
  .build(); // Query<[Position, Velocity]>

movable.forEach((entity, position, velocity) => {
  position.x += velocity.x;
  position.y += velocity.y;
});
```

It's not only convenient, but also fast: the query stores components of its entities next to each other in memory, so it
doesn't need to look up components in every entity. Iterating with `forEach` is several times faster than
calling `entity.get` for every entity of `query.entities`.

It's safe to add and remove entities and components during iteration: entities removed from the query are skipped, and
entities added to the query are visited in the next iteration.

- Queries created from a predicate don't know their components, so `forEach` passes only the entity.
- `Query` without type arguments means a query with unknown components, any typed query can be assigned to it. Don't
  annotate a variable with `Query`, if you want to keep types of components: `const query = builder.build()`.

### Queries and Systems

Now let's see how we can use Query on systems?

Let's write `ViewSystem`, which will be responsible for displaying our Entity on the screen.  
When entities get to the list, the system will add them to the screen, and when they leave the list, the system will
remove them from the screen.

**Example:**

```typescript
const query = new Query((entity: Entity) => {
  return entity.hasAll(View, Position, Rotation) && !entity.has(HIDDEN);
});

class ViewSystem extends System {
  public constructor(
    private readonly container: Container
  ) { super(); }

  public onAddedToEngine(): void {
    // To make query work - we need to add it to the engine
    this.engine.addQuery(query);
    // And we need to add to the display list all entities that already 
    // exists in the Engine`s world and matches our Query 
    this.prepare();
    // We want to know if new entities were added or removed
    query.onEntityAdded.connect(this.onEntityAdded);
    query.onEntityRemoved.connect(this.onEntityRemoved);
  }

  public onRemovedFromEngine(): void {
    // There is no reason to update query after system was removed 
    // from the engine
    this.engine.removeQuery(query);
    // No reason for further listening of the updates
    query.onEntityAdded.disconnect(this.onEntityAdded);
    query.onEntityRemoved.disconnect(this.onEntityRemoved);
  }

  // We only want to update positions of the views on the screen,
  // so there is no need for "dt" parameter, it can be omitted
  public update(): void {
    for (const entity of query.entities) {
      this.updatePosition(entity);
    }
  }

  private prepare(): void {
    for (const entity of query.entities) {
      this.addView(entity);
    }
  }

  private addView(entity: Entity): void {
    // Let's add new view to the screen
    this.container.addChild(entity.get(View)!.view);
    // Don't forget to update it's position on the screen
    this.updatePosition(entity);
  }

  private updatePosition(entity: Entity): void {
    const {view} = entity.get(View)!;
    const {x, y} = entity.get(Position)!;
    const {rotation} = entity.get(Rotation)!;
    view.position.set(x, y);
    view.rotation.set(rotation);
  }

  private onEntityAdded = ({current}: EntitySnapshot) => {
    this.addView(current);
  };

  private onEntityRemoved = ({previous}: EntitySnapshot) => {
    // Let's remove the view from the screen, because Entity no longer 
    // meets the requirements (might be it lost the View component 
    // or it was hidden)
    this.container.removeChild(previous.get(View)!.view);
  };
}
```

> 😎 I'm sure you saw the reference to `EntitySnapshot` and wondering, "what the heck is that?". Please, be
> patient, [I'll tell you about][Snapshot] it a bit later.
> I think it looks good and clear for understanding!

- 🤔 You can say: "we need to write too much boilerplate-code".
- And of course, Tick-Knock will help you to reduce boilerplate-code!

### Built-in query-based systems

In favor of reducing the time to write the boilerplate code - Tick-Knock provides two built-in systems. Each of them
already knows how to work with Query, process the information coming from it, and allow access to this Query's entities.

Built-in systems can be created in several ways:

- With `.of(...componentsOrTags)`, for example `IterativeSystem.of(Position, Velocity)`. It's the preferred way: the
  query is built from the components and tags, and components are passed to the system with inferred types.
- With a Query itself.
- With a query predicate - Query will be automatically created on top of it. This feature was introduced to reduce the
  size of the boilerplate code. Predicate queries don't know their components, so the system receives only entities.
- With a QueryBuilder.

All of them have the following features:

- A getter `entities`, which returns the entities of the Query at the moment of the call.
- Properties `entityAdded` and `entityRemoved`, you need to define them as arrow functions if you want to track Query
  changes.
- The query is added to the engine together with the system, and it's removed from the engine and cleared when the
  system is removed.

#### ReactionSystem

ReactionSystem can be considered as the system that has the ability to react to changes in Query. It is a basic built-in
system. Exactly it will be used in most cases when developing your application.

Let's try to rewrite our ViewSystem, taking ReactionSystem as a basis, and take advantage of all the conveniences it
provides.

**Example:**

```typescript
class ViewSystem extends ReactionSystem {
  public constructor(private readonly container: Container) {
    super((entity: Entity) => {
      return entity.hasAll(View, Position, Rotation) && !entity.has(HIDDEN);
    });
  }

  public update(): void {
    for (const entity of this.entities) {
      this.updatePosition(entity);
    }
  }

  protected prepare(): void {
    for (const entity of this.entities) {
      this.addView(entity);
    }
  }

  private addView(entity: Entity): void {
    this.updatePosition(entity);
    this.container.addChild(entity.get(View)!.view);
  }

  private updatePosition(entity: Entity): void {
    const {view} = entity.get(View)!;
    const {x, y} = entity.get(Position)!;
    const {rotation} = entity.get(Rotation)!;
    view.position.set(x, y);
    view.rotation.set(rotation);
  }

  protected entityAdded = ({current}: EntitySnapshot) => {
    this.addView(current);
  };

  protected entityRemoved = ({previous}: EntitySnapshot) => {
    this.container.removeChild(previous.get(View)!.view);
  };
}
```

> Now it's pretty simpler! 🎉

##### Typed reaction system

`ReactionSystem.of` builds the query from the specified components and tags, and passes components to `entityAdded`
and `entityRemoved` right after the snapshot, with inferred types. In `entityRemoved` you get components the entity had
before it was removed from the query, even if the component itself was removed.

```typescript
class ViewSystem extends ReactionSystem.of(View, Position, VISIBLE) {
  public constructor(private readonly container: Container) {
    super();
  }

  protected entityAdded = (snapshot: EntitySnapshot, {view}: View, {x, y}: Position) => {
    view.position.set(x, y);
    this.container.addChild(view);
  };

  protected entityRemoved = (snapshot: EntitySnapshot, {view}: View) => {
    this.container.removeChild(view);
  };
}
```

#### IterativeSystem

This system has the same advantages as the ReactionSystem because it is inherited from the last one. 😅 All it brings is
a built-in iteration cycle for our Query inside the update method.

**So, let's upgrade our `ViewSystem` a bit.**

```typescript
class ViewSystem extends IterativeSystem {
  // almost everything remains the same, so I'll skip most of the code.
  // The only difference regarding example with ReactionSystem - that we 
  // don't need to override `update` method. 
  // Instead of it we need to override updateEntity method.
  // Also, we can safely omit the dt parameter because we do not use it.
  protected updateEntity(entity: Entity) {
    this.updatePosition(entity);
  }
}
```

##### Typed iterative system

The easiest way to write an iterative system is `IterativeSystem.of`. It builds the query from the specified components
and tags, and passes components to `updateEntity` right after the entity and delta time, with inferred types. It's also
the fastest way to iterate, see [Typed queries].

```typescript
class MovementSystem extends IterativeSystem.of(Position, Velocity) {
  protected updateEntity(entity: Entity, dt: number, position: Position, velocity: Velocity) {
    position.x += velocity.x * dt;
    position.y += velocity.y * dt;
  }
}

class ViewPositionSystem extends IterativeSystem.of(View, Position, VISIBLE) {
  protected updateEntity(entity: Entity, dt: number, {view}: View, {x, y}: Position) {
    view.position.set(x, y);
  }
}
```

Entities removed from the query during the update are skipped, entities added to the query are updated in the next
update.

#### Remove the system as it's done

It's possible to request removal of the system when you don't need it anymore. For example, the system is only
needed to render the playing field, and trying to run it at every update cycle is wasteful.

Fortunately, you can request deletion right from the system:

```typescript
class RenderBoardSystem extends System {
  public update(dt: number): void {
    // Your render board code
    this.requestRemoval();
  }
}
```

That's it. Your system will be removed right after its update, and the next systems are updated as usual.

#### Functional systems

Small systems without their own state don't need a class. `Engine.iterative` and `Engine.reactive` create systems from
functions, types of components are inferred from the list of components:

```typescript
engine
  .iterative([Position, Velocity], (entity, dt, position, velocity) => {
    position.x += velocity.x * dt;
    position.y += velocity.y * dt;
  })
  .iterative([Health, Damage, ALIVE], (entity, dt, health, damage) => {
    health.value -= damage.value;
  }, {priority: 10, id: 'damage'})
  .reactive([View, Position], {
    added: (snapshot, {view}, {x, y}) => {
      view.position.set(x, y);
      container.addChild(view);
    },
    removed: (snapshot, {view}) => container.removeChild(view),
  });
```

Functional systems are as fast as class-based ones, and they can be mixed in the same engine. Use classes when a system
has its own state, dependencies or needs lifecycle methods.

> 💡 Data shared between systems, like a configuration of the world, doesn't need to be an entity: functional systems
> can read it from the closure, and class-based systems can receive it in the constructor.

## Snapshot

As you may have noticed, when we are tracking changes in Query, we get in `entityAdded` and `entityRemoved` not `Entity`
but `EntitySnapshot`.
**So what is a snapshot?**
It is a container that displays the difference between the current state of Entity and its previous state:

- `current` is the entity itself in its current state.
- `previous` is a read-only copy of the entity as it was before the change.

Compare them to understand which components have been added and which have been removed.

> 💡 `previous` is restored lazily, when it's accessed for the first time, so it costs nothing if you don't use it.
> Snapshots are reused by queries, so don't keep them after the handler has returned: a kept snapshot reflects the
> entity at the moment of access, not at the moment of the change.

> ❗ It is important to note that changes in the same entity components' data will not be reflected in the snapshot, even
> if a manual invalidation of the entity has been triggered.

Snapshots are very handy when you need to get a component or tag in Entity, but now it is missing. Let's take a closer
look at it with our `ViewSystem` example.
**Example:**

```typescript
class ViewSystem extends IterativeSystem {
  // ...
  protected entityAdded = ({current}: EntitySnapshot) => {
    // When entity added to the Query that means that it has `View` 
    // component - one hundred percent! So we just need its current 
    // state. 
    this.container.addChild(current.get(View)!.view);
    this.updatePosition(current);
  };

  protected entityRemoved = ({previous}: EntitySnapshot) => {
    // But when entity removed - we can't be sure that current state 
    // of the entity has `View` component. So we need to get it from
    // the previous state. Previous state has it one hundred percent.
    this.container.removeChild(previous.get(View)!.view);
  };
  // ...
}
```

## How to work with linked components?

Tick-knock provides an extended API for working with linked components since version 4.0.0.

- Method `withdraw` removes the first LinkedComponent component of the provided type or existing standard component
- Method `pick` removes provided LinkedComponent component instance or existing standard component.

  **Example**
  You have a system responsible for checking boons (buffs) expiration, and you wish to remove expired boons from the
  hero:
  ```ts
  enum BoonType {
    PROTECTION,
    AEGIS,
    REGENERATION
  }

  class Boon extends LinkedComponent {
    public constructor(
        public readonly type: BoonType,
        public value: number,
        public duration: number
    ) { super(); }
  }

  class BoonExpirationTestSystem extends IterativeSystem.of(Boon) {
    protected updateEntity(entity: Entity, dt: number) {
      // Let's update all boons
      entity.iterate(Boon, (boon) => {
          // Let's reduce boon remaining duration
          boon.duration -= dt;
          // If boon is expired
          if (boon.duration <= 0) {
             // Then we need to remove it from the Entity
             // But `entity.remove` will remove all boons, so we need to cherry-pick
             entity.pick(boon);
          } 
      });
    }
  }
  ```
- Method `iterate` iterates over instances of LinkedComponent and performs the `action` over each. Works for standard
  components (action will be called for a single instance in this case).
  > 🎈 It's safe to `pick` only current entity during iteration.
- Method `find` searches a component instance of the specified class. Works for standard components (predicate will be
  called for a single instance in this case).
- Method `getAll` returns a generator that can be used for iteration over all instances of specific type components.
- Method `lengthOf` returns the number of existing components of the specified class.

Now you know the basics. Now let's look at some examples to help you understand when linked components are helpful and
how to work with them.

### Real world example

We want to get a system that handles "Regeneration" buff on the hero. There can be more than one sources of
regeneration, so we must handle all of them at the same time.

Regeneration has two effects:

- Instantly healing heroes by constant amount of health points
- Regenerates some amount of health over the time.

Thus, our system should do the following:

- Heal the hero on the adding every new Regeneration buff.
- Heal the hero over the time.
- Manages regeneration expiration.

```ts
class Regeneration extends LinkedComponent {
  public constructor(
    public instantHealValue: number,
    public healPerSecond: number,
    public duration: number
  ) { super(); }
}

class RegenerationSystem extends IterativeSystem.of(Hero, Regeneration) {
  protected updateEntity(entity: Entity, dt: number, hero: Hero) {
    // Let's update all regeneration components on our hero and apply their effects 
    entity.iterate(Regeneration, (it) => {
      // We need to heal hero
      const healthPointsToAdd = Math.ceil(it.healPerSecond * dt);
      hero.health += healthPointsToAdd;
      // And then reduce regeneration duration
      it.duration -= dt;
      // If it's expired
      if (it.duration <= 0) {
        // Then we need to remove it from the Entity
        // But `entity.remove` will remove all regenerations, so we need to cherry-pick
        entity.pick(it);
      }
    });
  }

  protected entityAdded = ({current}: EntitySnapshot) => {
    // When new entity appears in the query, that means that it has Hero and Regeneration
    // so we want to instantly heal the hero by existing Regeneration buffs
    current.iterate(Regeneration, (regeneration) => {
      this.instantlyHealHero(current, regeneration);
    });
    // Also, if any additional Regeneration buff will appear in the entity, we will handle 
    // them as well and instantly heal the hero
    current.onComponentAdded.connect(this.instantlyHealHero);
  }

  protected entityRemoved = ({current}: EntitySnapshot) => {
    // We don't want to know if any new components were added to the entity when it left 
    // the query already.
    current.onComponentAdded.disconnect(this.instantlyHealHero);
  }

  private instantlyHealHero = (entity: Entity, regeneration: any) => {
    // We need to filter components, because this function will called on every added 
    // component (not only Regeneration)
    if (!(regeneration instanceof Regeneration)) return;

    const hero = entity.get(Hero)!;
    hero.health += regeneration.instantHealValue;
  }

}
```

# Examples

The [examples](examples) folder contains small games built with tick-knock: Snake in the terminal and Asteroids in the
browser.

```shell
pnpm --filter tick-knock-examples snake
pnpm --filter tick-knock-examples asteroids
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

# Development

The repository is a [pnpm](https://pnpm.io) workspace with the library, [benchmarks](bench) and [examples](examples).
The library is written in TypeScript 7.

```shell
pnpm install      # install dependencies of all packages
pnpm build        # build the library to lib
pnpm test         # run unit tests
pnpm typecheck    # check types of sources and tests
pnpm bench        # run benchmarks, see bench/README.md
```

# License

This software released under [MIT](LICENSE) license! Good luck, folks.

[Restrictions]: #restrictions

[Development]: #development

[What's new in 5.0]: #whats-new-in-50
[Migrating from 4.x]: #migrating-from-4x
[Breaking changes]: #breaking-changes
[Moving to the typed API]: #moving-to-the-typed-api

[Remove the system as it's done]: #remove-the-system-as-its-done

[Examples]: #examples

[Performance]: #performance

[Functional systems]: #functional-systems

[Typed queries]: #typed-queries

[Shared and Local Queries]: #shared-and-local-queries

[Queries with complex logic and Entity invalidation]: #queries-with-complex-logic-and-entity-invalidation

[Snapshot]: #snapshot

[IterativeSystem]: #iterativesystem

[ReactionSystem]: #reactionsystem

[Built-in query-based systems]: #built-in-query-based-systems

[Queries and Systems]: #queries-and-systems

[QueryBuilder]: #querybuilder

[Query]: #query

[System]: #system

[Entity]: #entity

[Tag]: #tag

[Component]: #component

[Linked Component]: #linked-component

[Linked Components How-To]: #how-to-work-with-linked-components

[Installing]: #installing

[How it works?]: #how-it-works

[Inside the Tick-Knock]: #inside-the-tick-knock

[Subscription]: #subscription

[Engine]: #engine

[License]: #license
