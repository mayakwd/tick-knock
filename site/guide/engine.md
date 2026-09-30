# Engine

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
