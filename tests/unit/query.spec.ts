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

  it('Entity invalidation should add entity to query with custom predicate', () => {
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
});
