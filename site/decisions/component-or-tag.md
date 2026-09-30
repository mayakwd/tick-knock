# Component or tag?

**Short answer:** if there is data, it's a component. If it's only a label, it's a tag.

## Tags are labels

A tag is a string or a number. It marks an entity as something, and queries can filter by it:

```typescript
const HEAD = 'head';
const FOOD = 'food';

const food = new QueryBuilder().contains(Cell, FOOD).build();
```

In [Snake](/tutorials/snake) the head, segments and food all have a `Cell`, and tags tell them apart. They don't
have any data of their own, so classes like `class Food {}` would add nothing but code.

## Components hold data

As soon as the label needs data, it becomes a component. In [Bullet hell](/tutorials/bullet-hell) enemies were first
just enemies, but rendering needed to know the kind of every enemy to draw it, so `Enemy` is a component with the kind:

```typescript
class Enemy {
  public constructor(public readonly kind: EnemyKind) {}
}
```

## When a tag becomes a component

- The label needs data: the kind, the owner, the time.
- A system needs to receive it as a typed parameter.
- The label is temporary, and needs to know when it ends. `Invulnerable` in the bullet hell has the remaining time,
  so it's a component.

## When a component should be a tag

- The class is empty, and you only check `entity.has(SomeClass)`.

> 💡 Tags are cheaper in memory, and queries built by `QueryBuilder` index them, so changing tags is as fast as
> changing components.
