# Linked components

It is still a data class, but it is made to solve the problem when you need to have multiple components of the same
type.

Let's assume that you have a Damage component in your game. Several enemies attack the Hero simultaneously by adding the
Damage component to it. What will happen? Only the last Damage component will be added to the Hero Entity because every
previous one will be removed.

To solve this problem - you need to implement ILinkedComponent interface in your Damage component and "append" instead
of "add" the Damage component to the entity. That will do the job. After that, in DamageSystem you can find all damage
sources:

```typescript
class Damage extends LinkedComponent {
  public constructor(
    public readonly value: number
  ) {
    super()
  }
}

hero.append(new Damage(100));
hero.append(new Damage(5));

class DamageSystem extends IterativeSystem.of(Damage, Health) {
  protected updateEntity(entity: Entity, dt: number, damage: Damage, health: Health) {
    while (entity.has(Damage)) {
      health.value -= entity.withdraw(Damage)!.value;
    }
  }
}
```

## How to work with linked components?

Tick-knock provides an extended API for working with linked components since version 4.0.0.

- Method `withdraw` removes the first LinkedComponent component of the provided type or existing standard component
- Method `pick` removes provided LinkedComponent component instance or existing standard component.

  **Example**
  You have a system responsible for checking boons (buffs) expiration, and you wish to remove expired boons from the
  hero:
  ```ts
  enum BoonType {
    PROTECTION,
    AEGIS,
    REGENERATION
  }

  class Boon extends LinkedComponent {
    public constructor(
        public readonly type: BoonType,
        public value: number,
        public duration: number
    ) { super(); }
  }

  class BoonExpirationTestSystem extends IterativeSystem.of(Boon) {
    protected updateEntity(entity: Entity, dt: number) {
      // Let's update all boons
      entity.iterate(Boon, (boon) => {
          // Let's reduce boon remaining duration
          boon.duration -= dt;
          // If boon is expired
          if (boon.duration <= 0) {
             // Then we need to remove it from the Entity
             // But `entity.remove` will remove all boons, so we need to cherry-pick
             entity.pick(boon);
          } 
      });
    }
  }
  ```
- Method `iterate` iterates over instances of LinkedComponent and performs the `action` over each. Works for standard
  components (action will be called for a single instance in this case).
  > 🎈 It's safe to `pick` only current entity during iteration.
- Method `find` searches a component instance of the specified class. Works for standard components (predicate will be
  called for a single instance in this case).
- Method `getAll` returns a generator that can be used for iteration over all instances of specific type components.
- Method `lengthOf` returns the number of existing components of the specified class.

Now you know the basics. Now let's look at some examples to help you understand when linked components are helpful and
how to work with them.

### Real world example

We want to get a system that handles "Regeneration" buff on the hero. There can be more than one sources of
regeneration, so we must handle all of them at the same time.

Regeneration has two effects:

- Instantly healing heroes by constant amount of health points
- Regenerates some amount of health over the time.

Thus, our system should do the following:

- Heal the hero on the adding every new Regeneration buff.
- Heal the hero over the time.
- Manages regeneration expiration.

```ts
class Regeneration extends LinkedComponent {
  public constructor(
    public instantHealValue: number,
    public healPerSecond: number,
    public duration: number
  ) { super(); }
}

class RegenerationSystem extends IterativeSystem.of(Hero, Regeneration) {
  protected updateEntity(entity: Entity, dt: number, hero: Hero) {
    // Let's update all regeneration components on our hero and apply their effects 
    entity.iterate(Regeneration, (it) => {
      // We need to heal hero
      const healthPointsToAdd = Math.ceil(it.healPerSecond * dt);
      hero.health += healthPointsToAdd;
      // And then reduce regeneration duration
      it.duration -= dt;
      // If it's expired
      if (it.duration <= 0) {
        // Then we need to remove it from the Entity
        // But `entity.remove` will remove all regenerations, so we need to cherry-pick
        entity.pick(it);
      }
    });
  }

  protected entityAdded = ({current}: EntitySnapshot) => {
    // When new entity appears in the query, that means that it has Hero and Regeneration
    // so we want to instantly heal the hero by existing Regeneration buffs
    current.iterate(Regeneration, (regeneration) => {
      this.instantlyHealHero(current, regeneration);
    });
    // Also, if any additional Regeneration buff will appear in the entity, we will handle 
    // them as well and instantly heal the hero
    current.onComponentAdded.connect(this.instantlyHealHero);
  }

  protected entityRemoved = ({current}: EntitySnapshot) => {
    // We don't want to know if any new components were added to the entity when it left 
    // the query already.
    current.onComponentAdded.disconnect(this.instantlyHealHero);
  }

  private instantlyHealHero = (entity: Entity, regeneration: any) => {
    // We need to filter components, because this function will called on every added 
    // component (not only Regeneration)
    if (!(regeneration instanceof Regeneration)) return;

    const hero = entity.get(Hero)!;
    hero.health += regeneration.instantHealValue;
  }

}
```
