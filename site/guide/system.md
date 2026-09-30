# System

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
  engine [Subscription](/guide/messages) pipe. There are the same restrictions as for the engine. If the system is not
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

## Remove the system as it's done

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
