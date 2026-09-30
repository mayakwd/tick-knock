---
layout: home

hero:
  name: Tick-Knock
  text: Entity-Component-System for TypeScript
  tagline: Small and powerful, type-safe and easy-to-use. Queries and systems infer types of components, so you write game logic, not boilerplate.
  actions:
    - theme: brand
      text: Get started
      link: /guide/
    - theme: alt
      text: Tutorials
      link: /tutorials/
    - theme: alt
      text: Examples
      link: /examples/

features:
  - icon: 🧩
    title: Typed from the start
    details: Queries and systems infer types of components, so <code>forEach</code> and <code>updateEntity</code> receive components ready to use.
  - icon: ⚡
    title: Fast
    details: Queries keep components of their entities in dense arrays, so iterating, adding and removing entities are fast, and entities are light.
  - icon: 🪶
    title: Small
    details: No dependencies and no code generation. Components are plain classes, tags are strings or numbers.
  - icon: 🎮
    title: Learn by building games
    details: Four tutorials build Snake, Asteroids, a bullet hell and a tower defense step by step.
---

## A taste of it

```typescript
import {Engine, Entity, IterativeSystem} from 'tick-knock';

class Position {
  public constructor(public x = 0, public y = 0) {}
}

class Velocity {
  public constructor(public x = 0, public y = 0) {}
}

class MovementSystem extends IterativeSystem.of(Position, Velocity) {
  protected updateEntity(entity: Entity, dt: number, position: Position, velocity: Velocity) {
    position.x += velocity.x * dt;
    position.y += velocity.y * dt;
  }
}

const engine = new Engine();
engine.addSystem(new MovementSystem());
engine.addEntity(new Entity().add(new Position()).add(new Velocity(10, 0)));
engine.update(1 / 60);
```

<GameDemo game="asteroids" />
