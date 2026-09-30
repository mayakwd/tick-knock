# Tag

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
