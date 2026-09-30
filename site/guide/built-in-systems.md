# Built-in systems

Systems usually process entities of a query. In this part, you will see how to do it by hand, and how built-in
systems do it for you.

## Queries and Systems

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
> patient, [I'll tell you about](/guide/snapshot) it a bit later.
> I think it looks good and clear for understanding!

- 🤔 You can say: "we need to write too much boilerplate-code".
- And of course, Tick-Knock will help you to reduce boilerplate-code!


## Built-in query-based systems

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

### ReactionSystem

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

#### Typed reaction system

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

### IterativeSystem

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

#### Typed iterative system

The easiest way to write an iterative system is `IterativeSystem.of`. It builds the query from the specified components
and tags, and passes components to `updateEntity` right after the entity and delta time, with inferred types. It's also
the fastest way to iterate, see [Typed queries](/guide/query#typed-queries).

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


## Functional systems

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
