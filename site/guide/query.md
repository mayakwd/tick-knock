# Query

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

## QueryBuilder

Query builder is super simple. It has not much power, but you can use it for creating queries that must contain specific
Components.

```typescript
const query = new QueryBuilder()
  .with(ComponentA, ComponentB)
  .with(TAG)
  .build();
```

> 💡 Prefer `QueryBuilder` whenever it's enough. Engine knows which components and tags such queries depend on, so
> adding or removing unrelated components doesn't touch them at all. Queries with predicates are checked on every
> change of every entity.

## Excluding entities

And what if some entities must not get into the query? For example, frozen entities shouldn't move, and destroyed ones
shouldn't collide anymore. Exclude them with `without`:

```typescript
const movable = new QueryBuilder()
  .with(Position, Velocity)
  .without(Frozen, DESTROYED)
  .build();
```

An entity leaves the query as soon as it gets an excluded component or tag, and joins it again when the component or tag
is removed. The same exclusion can be listed together with components, wherever they are listed:

```typescript
class MovementSystem extends IterativeSystem.of(Position, Velocity, without(Frozen)) {
  protected updateEntity(entity: Entity, dt: number, position: Position, velocity: Velocity) {
    position.x += velocity.x * dt;
  }
}
```

Exclusions are not passed to systems and callbacks: they only decide whether an entity matches the query.

## Typed queries

`QueryBuilder` infers types of components it contains, so the query can pass them to you together with the entity.
Components are passed in the order they were specified, tags are only used for matching.

```typescript
const movable = new QueryBuilder()
  .with(Position, Velocity)
  .with(MOVABLE)
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
