# Tick-Knock
> Simple Typescript ECS library

[![Build Status](https://travis-ci.org/mayakwd/tick-knock.svg?branch=master)](https://travis-ci.org/mayakwd/tick-knock)
[![Codecov Coverage](https://img.shields.io/codecov/c/github/mayakwd/tick-knock/develop.svg?style=flat-square)](https://codecov.io/gh/mayakwd/tick-knock/)

## Installing

- Yarn: `yarn add tick-knock`
- NPM: `npm i --save tick-knock`

## Usage

### Engine

Engine represents world. It contains entities as state of engine, systems that updates entities
and queries, which basically are matching predicates.

```typescript
const engine = new Engine();
engine
  .addSystem(new MovementSystem())
  .addSystem(new ViewSystem());
```

### System

You could use built-in IterativeSystem to update entities that matches query, or you could
implement your own system, by inheriting System class.

Samples:

```typescript
class MovementSystem extends IterativeSystem {
  public constructor() {
    super(
      new QueryBuilder()
        .contains(Position)
        .contains(Acceleration)
        .build()
      );
  }
  
  protected updateEntity(entity:Entity, dt:number) {
    const position = entity.get(Position)!;
    const acceleration = entity.get(Acceleration)!;
    
    position.x += acceleration.x * dt;
    position.y += acceleration.y * dt;
  }
}
```

```typescript
class ViewSystem extends IterativeSystem {
  private container:Container;
  
  public constructor(container:Container) {
    super(
      new QueryBuilder()
        .contains(Position)
        .contains(View)
        .build()
      );
    
    this.container = container;
  }
  
  public onAddedToEngine(engine:Engine) {
    super(engine);
    
    // For any matching entity that engine already contains entityAdded must be
    // called manually if needed.
    for (const entity of this.entities) {
      this.entityAdded(entity);
    }
  }

  protected updateEntity(entity:Entity, dt:number) {
    const position = entity.get(Position)!;
    const view = entity.get(View)!;
    
    view.x += position.x;
    view.y += position.y;
  }  
  
  entityAdded = (snapshot:EntitySnapshot) => {
    this.container.add(snapshot.get(View)!.view);
  };

  entityRemoved = (snapshot:EntitySnapshot) => {
    this.container.remove(snapshot.get(View)!.view);
  };
}

const container = ...
const engine = new Engine()
    .addSystem(new MovementSystem())
    .addSystem(new ViewSystem(container));
```

#### Query

Query represents entity matching mechanism. Based on predicate that tests all new entities
which was added/removed to/from engine it updates it's own list of entities.

Also if required component was added or removed from entity - query entities list will be
updated as well.

For simple queries which are required matching only existence of the components you could
use QueryBuilder.

The result query will match entities that contains `Position`, `Acceleration` and `View` components.
```typescript
const query = new QueryBuilder()
    .contains(Position, Acceleration) // multiple components could be defined
    .contains(View)
    .build();

engine.addQuery(query);
```

####

Query could be used via [IterativeSystem](#System) or explicitly out of systems.

```typescript
const query = new Query((entity:Entity) => {
  return entity.has(Position) && entity.get(Position)!.y > 100;
})

engine.addQuery(query);
```

Is such case if position were changed - you need to notify Engine about that your own,
because Engine not tracking changes inside components. To notify engine use `entity.invalidate()` method.

```typescript
updateEntity(entity:Entity, dt:number) {
  const position = entity.get(Position)!;
  position.y += 100 * dt;
  entity.invalidate();
}
```  

### Entity
Entity represents small part of engine state. All entities added to engine represents 
engine state.

Basically entity is a faceless container with unique id for components. 
```typescript
const entity = new Entity()
    .add(new View(new Sprite()))
    .add(new Position(100, 100))
    .add(new Acceleration());

engine.addEntity(entity);
``` 

### Component
Component is a way to associate data with entity. You should remember that only one unique
component could be associated with `Entity`.

For this case first position component will be replaced with the second one: 
```typescript
entity
  .add(new Position(1,1))
  .add(new Position(2,2))
  
console.log(entity.get(Position)); // Position[x=2, y=2]
``` 

Component could be represented by any class, it does not require to implement any interface
or inherit from anything.

```typescript
class Position {
  public x:number;
  public y:number;
  
  public constructor(x:number = 0, y:number = 0) {
    this.x = x;
    this.y = y;
  }
}

const entity = new Entity().add(new Position(1,1));
```

Under the hood all components gets a unique identifier. 
During matching process "Queries" can't recognize inherited component and its ancestor as family.

For example:
Query below would not recognize EnemyView as View, so you won't get it in query.entities.

```typescript
class View {}
class EnemyView extends View {}
const query = new QueryBuilder().contains(View).build();

...

const entity = new Entity()
   .add(new EnemyView);

engine.add(entity);
```

For such case you can easily specify "resolve class" by yourself.  

```typescript
const entity = new Entity()
    .add(new EnemyView(), View);
```   

In that case `EnemyView` component would be recognized as View. But you should be aware, only ancestor class could be used as "resolve class",
otherwise you'll get an exception. 


## Limitations

