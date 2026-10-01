# Component

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
