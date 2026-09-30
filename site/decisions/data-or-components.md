# Data or components?

**Short answer:** kinds of things are data, and every entity owns its state. Data is turned into components when an
entity is created, and systems work only with components.

## The trap

A game has kinds of things: towers, enemies, weapons. It's natural to describe them in a table, and it's tempting to
give an entity only its kind, and let systems look up everything else:

```typescript
// Systems read characteristics of every tower from the table by its kind
const {range, interval} = TOWERS[tower.kind];
```

It works until the first upgrade, buff or item. All towers of a kind are the same, so one tower can't become stronger.
Systems depend on the table and on kinds, so a new kind may require changes in systems. And the table becomes the state
of the game, that nobody can change.

## Kinds are templates

In the [Tower defense](/tutorials/tower-defense), the table describes levels of every kind of tower. It's used only
when a tower is built or upgraded: the level is turned into components of the tower.

```typescript
entity
  .add(new Tower(kind, cell, level))
  .add(new Weapon(range, interval, projectileSpeed));
entity.remove(Damage);
for (const description of damage) entity.append(new Damage(description));
```

From that moment, the tower owns its characteristics:

- An upgrade replaces components of the tower with components of the next level.
- A buff could change the weapon of one tower, and nothing else.
- Systems read the weapon of every tower, and don't know about kinds.

## Descriptions can be components

A description in the table and a component can share the same shape. `Damage` of the tower defense implements
`DamageDescription`, and levels describe their damage with it:

```typescript
{cost: 130, range: 110, interval: 0.7, projectileSpeed: 360, damage: [
  {type: 'physical', amount: 3},
  {type: 'frost', amount: 0.65, duration: 2.5, splash: 40},
]}
```

A component is created from a description with `new Damage(description)`, and copied from a tower to a projectile and
from a projectile to a creep the same way. There are no parallel hierarchies of "config" and "runtime" classes, and a
new kind of tower is a new combination of existing damage, that doesn't need new code.

> ❗ Create a component for every entity. Don't add objects from the table to entities: they would be shared by all
> entities, and changing one of them would change all.

## What stays data

Things that don't change during the game and don't belong to any entity: the map, the list of waves, the description of
levels. Keep them in modules, and read them when entities are created or changed.
