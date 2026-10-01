# Introduction

Tick-Knock is a small and powerful, type-safe and easy-to-use Entity-Component-System (ECS) library written in
TypeScript.

## How it works?

Tick-Knock was inspired by several ECS libraries, mostly by [Ash ECS](https://www.richardlord.net/ash/).

The main approach was re-imagined to make it lightweight, easy-to-use, and less boiler-plate based.

An application built with Tick-Knock consists of a few simple parts:

- [Components](/guide/component) are plain data classes: position, velocity, health.
- [Tags](/guide/tag) are labels without data: `'enemy'`, `'dead'`.
- [Entities](/guide/entity) are containers of components and tags: a hero, a bullet, a tower.
- [Queries](/guide/query) keep lists of entities that have the components you need.
- [Systems](/guide/system) are the logic: they process entities of queries every update.
- The [Engine](/guide/engine) holds all of them together and updates systems in order of their priority.

```typescript
import {Engine, Entity} from 'tick-knock';

class Health {
  public constructor(public value: number) {}
}

class Poison {
  public constructor(public damagePerSecond: number) {}
}

const engine = new Engine();

// A system made from a function, types of components are inferred
engine.iterative([Health, Poison], (entity, dt, health, poison) => {
  health.value -= poison.damagePerSecond * dt;
});

engine.addEntity(new Entity().add(new Health(100)).add(new Poison(5)));

// One second has passed
engine.update(1);
```

## Where to go next

- In this part, you will learn all basics of Tick-Knock step by step, starting from the [Engine](/guide/engine).
- [Tutorials](/tutorials/) build small games from scratch and explain every step.
- [Decisions](/decisions/) answer questions that appear in every project: component or tag, which system to choose,
  where to keep the game state.
- [Examples](/examples/) are playable games with their sources.
