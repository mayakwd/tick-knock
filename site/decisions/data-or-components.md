# Data or components?

**Short answer:** kinds of things are data, and every entity owns its state. Data is turned into components when an
entity is created, and systems work only with components.

## The trap

A game has kinds of things: towers, enemies, weapons. It's natural to describe them in a table, and it's tempting to
give an entity only its kind, and let systems look up everything else:

```typescript
// Systems read characteristics of every tower from the table by its kind
const {range, damage} = TOWERS[tower.kind];
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
  .add(new Weapon(range, interval, damage, projectileSpeed));
if (splash !== undefined) entity.add(new Splash(splash));
```

From that moment, the tower owns its characteristics:

- An upgrade replaces components of the tower with components of the next level.
- A buff could change the weapon of one tower, and nothing else.
- Systems read the weapon of every tower, and don't know about kinds.

## Behaviour is composed from components

Effects are optional components: `Splash`, `SlowOnHit`, `PoisonOnHit`. A tower has the effects of its level, and a
level can have any combination of them. Systems check which effects an entity has, instead of switching on its kind,
so a new kind of tower is a new combination of existing components, and often doesn't need new code.

## What stays data

Things that don't change during the game and don't belong to any entity: the map, the list of waves, the description of
levels. Keep them in modules, and read them when entities are created or changed.
