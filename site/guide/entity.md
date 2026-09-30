# Entity

It is a general-purpose object, which can be marked with tags and can contain different components.

- So it can be considered as a container that can represent any in-game entity, like an enemy, bomb, configuration, game
  state, etc.
- Entity can contain only one component or tag of each type. You can't add two `Position` components to the entity, the
  second one will replace the first one. The only exception is [Linked Component](/guide/linked-components).

**This is how it works:**

```typescript
const entity = new Entity()
  .add(new Position(100, 100))
  .add(new Position(200, 200))
  .add(HERO);

console.log(entity.get(Position)); // Position(x = 200, y = 200)
```

> Looks easy? Yes, it is!
