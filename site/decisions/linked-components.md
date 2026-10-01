# Linked components or an array?

**Short answer:** if every item is added, processed and removed on its own, use linked components. If items are
always handled together, an array in a component is simpler.

## Several components of the same class

An entity can have only one component of a class: adding a second `Slow` replaces the first one. Linked components
solve it: they are added with `append`, and an entity can have any number of them.

```typescript
class Slow extends LinkedComponent {
  public constructor(public readonly factor: number, public seconds: number) {
    super();
  }
}

creep.append(new Slow(0.5, 1.5));
creep.append(new Slow(0.7, 3));
```

`iterate` visits all of them, and `pick` removes one:

```typescript
entity.iterate(Slow, (slow) => {
  slow.seconds -= dt;
  if (slow.seconds <= 0) entity.pick(slow);
});
```

Queries treat linked components as usual ones: an entity with at least one `Slow` matches a query of `Slow`, and leaves
it when the last one is removed. A system of `[Slow]` runs only for slowed creeps.

## An array in a component

The outline of an asteroid in [Asteroids](/tutorials/asteroids) is an array of numbers. It's created once, drawn at
once, and never changes item by item, so an array is the right choice.

## How to choose

- Items come from different sources, at different times — linked components.
- Items expire or are removed one by one — linked components.
- Queries should react to the presence of at least one item — linked components.
- Items are always read and written together — an array.
