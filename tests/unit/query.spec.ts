import {Engine, Entity, Query, QueryBuilder} from '../../src';

class Position {
  public x: number = 0;
  public y: number = 0;

  constructor(x: number = 0, y: number = 0) {
    this.x = x;
    this.y = y;
  }
}

class View {}

class Move {}

class Stay {}

describe('Query builder', () => {
  it('Building query', () => {
    const query = new QueryBuilder()
      .contains(Position)
      .contains(View)
      .build();
    expect(query).toBeDefined();
    expect(query.entities).toBeDefined();
    expect(query.isEmpty).toBeTruthy();
  });

  it('Expected that built query matches defined pattern', () => {
    const query = new QueryBuilder()
      .contains(Position)
      .contains(View)
      .build();
    const entities = [
      new Entity().add(new Position()).add(new View()),
      new Entity().add(new Position()).add(new View()),
    ];
    query.matchEntities(entities);
    expect(query.length).toBe(2);
  });

  it(`Expected that adding the same component to the builder twice will use only it only once for construction of predicate `, () => {
    const builder = new QueryBuilder()
      .contains(Position)
      .contains(Position)
      .contains(View);
    expect(builder.getComponents().size).toBe(2);
  });

  it(`Expected that adding the same tag to the builder twice will use only it only once for construction of predicate `, () => {
    const TAG = 1;
    const builder = new QueryBuilder()
      .contains(TAG)
      .contains(TAG);
    expect(builder.getTags().size).toBe(1);
  });

  it(`Expected that query build with QueryBuilder matches entities with provided conditions`, () => {
    const TAG = 1;
    const query = new QueryBuilder().contains(Position, TAG).build();
    query.matchEntities([
      new Entity().add(new Position()).add(TAG),
      new Entity(),
      new Entity().add(new Position()),
      new Entity().add(TAG),
    ]);
    expect(query.length).toBe(1);
  });
});

describe('Query matching', () => {
  const position = new Position();
  const view = new View();
  const move = new Move();
  const stay = new Stay();

  function getQuery() {
    return new QueryBuilder()
      .contains(Position, View)
      .build();
  }

  it('Query not matching entity with only position component', () => {
    const engine = new Engine();
    const entity = new Entity().add(position);
    const query = getQuery();
    engine.addQuery(query);
    engine.addEntity(entity);
    expect(query.entities).toBeDefined();
    expect(query.isEmpty).toBeTruthy();
  });

  it('Query not matching entity with only view component', () => {
    const engine = new Engine();
    const entity = new Entity().add(view);
    const query = getQuery();
    engine.addQuery(query);
    engine.addEntity(entity);

    expect(query.entities).toBeDefined();
    expect(query.isEmpty).toBeTruthy();
  });

  it('Query matching entity with view and position components', () => {
    const engine = new Engine();
    const entity = new Entity().add(position).add(view);
    const query = getQuery();
    engine.addQuery(query);
    engine.addEntity(entity);

    expect(query.entities).toBeDefined();
    expect(query.isEmpty).toBeFalsy();
    expect(query.entities[0]).toBe(entity);
  });

  it('Adding component to entity adding it to query', () => {
    const engine = new Engine();
    const entity = new Entity().add(position);
    const query = getQuery();
    engine.addQuery(query);
    engine.addEntity(entity);

    expect(query.entities).toBeDefined();
    expect(query.isEmpty).toBeTruthy();

    entity.add(view);

    expect(query.entities.length).toBe(1);
  });

  it('Removing component removes entity from query', () => {
    const engine = new Engine();
    const entity = new Entity().add(position).add(view);
    const query = getQuery();
    engine.addQuery(query);
    engine.addEntity(entity);

    expect(query.entities).toBeDefined();
    expect(query.entities.length).toBe(1);
    expect(query.entities[0]).toBe(entity);

    entity.remove(View);

    expect(query.isEmpty).toBeTruthy();
  });

  it('Removing not matching with query components not removes entity from query', () => {
    const engine = new Engine();
    const entity = new Entity()
      .add(position)
      .add(view)
      .add(move);

    const query = getQuery();
    engine.addQuery(query);
    engine.addEntity(entity);

    expect(query.entities).toBeDefined();
    expect(query.entities.length).toBe(1);
    expect(query.entities[0]).toBe(entity);

    entity.remove(Move);

    expect(query.entities.length).toBe(1);
    expect(query.entities[0]).toBe(entity);

    entity.add(stay);

    expect(query.entities.length).toBe(1);
    expect(query.entities[0]).toBe(entity);

    entity.remove(View);

    expect(query.isEmpty).toBeTruthy();
  });

  it('Removing entity from engine removes entity from query', () => {
    const engine = new Engine();
    const entity = new Entity().add(position).add(view);
    const query = getQuery();
    engine.addQuery(query);
    engine.addEntity(entity);

    expect(query.entities).toBeDefined();
    expect(query.entities.length).toBe(1);
    expect(query.entities[0]).toBe(entity);

    engine.removeEntity(entity);

    expect(query.isEmpty).toBeTruthy();
  });

  it('Removing query from engine clears query and not updating it anymore', () => {
    const engine = new Engine();
    const entity = new Entity().add(position).add(view);
    const query = getQuery();
    engine.addQuery(query);
    engine.addEntity(entity);

    expect(query.entities).toBeDefined();
    expect(query.entities.length).toBe(1);
    expect(query.entities[0]).toBe(entity);

    engine.removeQuery(query);
    expect(query.isEmpty).toBeTruthy();

    engine.removeEntity(entity);
    engine.addEntity(entity);

    expect(query.isEmpty).toBeTruthy();
  });

  it('Entity invalidation should add entity to query with custom predicate', () => {
    const engine = new Engine();
    const entity = new Entity().add(new Position(0, 0));
    const query = new Query((entity: Entity) => {
      return entity.has(Position) && entity.get(Position)!.y > 100;
    });
    engine.addQuery(query);
    engine.addEntity(entity);

    expect(query.entities.length).toBe(0);
    entity.get(Position)!.y = 150;
    entity.invalidate();
    expect(query.entities.length).toBe(1);
  });

  it('Entity invalidation should remove entity from query with custom predicate', () => {
    const engine = new Engine();
    const entity = new Entity().add(new Position(0, 0));
    const query = new Query((entity: Entity) => {
      return entity.has(Position) && entity.get(Position)!.y === 0;
    });
    engine.addQuery(query);
    engine.addEntity(entity);

    expect(query.entities.length).toBe(1);
    entity.get(Position)!.y = 150;
    entity.invalidate();
    expect(query.entities.length).toBe(0);
  });

  it('Entity invalidation should add entity to query with custom predicate', () => {
    const engine = new Engine();
    const entity = new Entity().add(new Position(0, 150));
    const query = new Query((entity: Entity) => {
      return entity.has(Position) && entity.get(Position)!.y === 0;
    });
    engine.addQuery(query);
    engine.addEntity(entity);

    expect(query.entities.length).toBe(0);
    entity.get(Position)!.y = 0;
    entity.invalidate();
    expect(query.entities.length).toBe(1);
  });

  it('Removing and adding components to entity should properly update custom query', () => {
    const engine = new Engine();
    const entity = new Entity().add(new Position(0, 0));
    const query = new Query((entity: Entity) => {
      return entity.has(Position) && !entity.has(View);
    });
    engine.addQuery(query);
    engine.addEntity(entity);

    expect(query.length).toBe(1);
    entity.add(new View());
    expect(query.length).toBe(0);
    entity.remove(View);
    expect(query.length).toBe(1);
  });

  it('Adding and removing entity that not related to query, must not affect it', () => {
    const engine = new Engine();
    const entity1 = new Entity().add(new Position(0, 0));
    const entity2 = new Entity();
    const query = new Query((entity: Entity) => {
      return entity.has(Position);
    });
    engine.addQuery(query);
    engine.addEntity(entity1);
    expect(query.length).toBe(1);
    engine.addEntity(entity2);
    expect(query.length).toBe(1);
    engine.removeEntity(entity2);
    expect(query.length).toBe(1);
  });

  it(`countBy returns the number of elements that tested by predicate successfully`, () => {
    const initialEntitiesAmount = 10;
    const entitiesWithViewAmount = 4;

    const query = new Query((entity: Entity) => {
      return entity.has(Position);
    });

    const entities = [];
    for (let i = 0; i < initialEntitiesAmount; i++) {
      const entity = new Entity().add(new Position());
      if (i < entitiesWithViewAmount) {
        entity.add(new View());
      }
      entities.push(entity);
    }
    query.matchEntities(entities);
    expect(query.countBy((entity: Entity) => entity.hasAll(View, Position))).toBe(entitiesWithViewAmount);
  });

  it(`countBy returns zero for empty query`, () => {
    const query = new Query((entity: Entity) => {
      return entity.has(Position);
    });
    expect(query.countBy((entity: Entity) => entity.hasAll(Position))).toBe(0);
  });

  it(`'first' getter returns first element from the query`, () => {
    const query = new Query((entity: Entity) => {
      return entity.has(Position);
    });
    const entities = [new Entity().add(new Position()), new Entity().add(new Position())];
    const firstElement = entities[0];
    query.matchEntities(entities);
    expect(query.first).toBe(firstElement);
  });

  it(`'first' getter returns undefined if the query is empty`, () => {
    const query = new Query((entity: Entity) => {
      return entity.has(Position);
    });
    expect(query.first).toBeUndefined();
  });

  it(`'last' getter returns last element from the query`, () => {
    const query = new Query((entity: Entity) => {
      return entity.has(Position);
    });
    const entities = [new Entity().add(new Position()), new Entity().add(new Position())];
    const lastElement = entities[1];
    query.matchEntities(entities);
    expect(query.last).toBe(lastElement);
  });

  it(`'last' getter returns undefined if the query is empty`, () => {
    const query = new Query((entity: Entity) => {
      return entity.has(Position);
    });
    expect(query.last).toBeUndefined();
  });

  it(`'find' returns first element that is accepted by predicate`, () => {
    const query = new Query((entity: Entity) => {
      return entity.has(Position);
    });
    const entities = [
      new Entity().add(new Position()),
      new Entity().add(new Position()).add(new View()),
      new Entity().add(new Position()).add(new View()),
    ];
    const targetEntity = entities[1];
    query.matchEntities(entities);
    expect(query.find((value) => value.has(View))).toBe(targetEntity);
  });

  it(`'find' returns undefined when no suitable elements found`, () => {
    const query = new Query((entity: Entity) => {
      return entity.has(Position);
    });
    query.matchEntities([
      new Entity().add(new Position()),
      new Entity().add(new Position()),
      new Entity().add(new Position()),
    ]);
    expect(query.find((value) => value.has(View))).toBeUndefined();
  });

  it(`'filter' returns all suitable elements`, () => {
    const query = new Query((entity: Entity) => {
      return entity.has(Position);
    });
    const TAG = 'tag';
    const entities = [
      new Entity().add(new Position()),
      new Entity().add(new Position()).add(TAG),
      new Entity().add(new Position()).add(TAG),
    ];
    query.matchEntities(entities);
    const filteredItems = query.filter((value) => value.has(TAG));
    expect(filteredItems.length).toBe(2);
    expect(filteredItems[0]).toBe(entities[1]);
    expect(filteredItems[1]).toBe(entities[2]);
  });

  it(`'filter' returns empty array when no suitable elements found`, () => {
    const query = new Query((entity: Entity) => {
      return entity.has(Position);
    });
    const TAG = 'tag';
    const entities = [
      new Entity().add(TAG),
      new Entity().add(TAG),
      new Entity().add(TAG),
    ];
    query.matchEntities(entities);
    const filteredItems = query.filter((value) => value.has(Position));
    expect(filteredItems.length).toBe(0);
  });
});
