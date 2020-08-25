import {Engine, Entity, EntitySnapshot, IterativeSystem, Query, QueryBuilder, System} from '../../src';

class Position {
  public x: number = 0;
  public y: number = 0;

  public constructor(x: number = 0, y: number = 0) {
    this.x = x;
    this.y = y;
  }
}

class MovementSystem extends IterativeSystem {
  public constructor() {
    super(new QueryBuilder().contains(Position).build());
  }

  protected updateEntity(entity: Entity, dt: number): void {
    const position = entity.get(Position);
    if (position != null) {
      position.x += 10 * dt;
      position.y += 10 * dt;
    }
  }

  protected entityAdded = (entity: EntitySnapshot) => {
    entity.get(Position)!.x = 100;
  };
}

describe('Iterative system', () => {
  it('Updating entities', () => {
    const engine = new Engine();
    const entity = new Entity().add(new Position());

    engine.addSystem(new MovementSystem());
    engine.addEntity(entity);
    engine.update(1);

    const position = entity.get(Position);
    expect(position).toBeDefined();
    expect(position!.x).toBe(110);
    expect(position!.y).toBe(10);
  });

  it('Entities in prepare should be available', () => {
    let entities!: ReadonlyArray<Entity>;

    class TestSystem extends IterativeSystem {
      public constructor() {
        super(new QueryBuilder().contains(Position).build());
      }

      protected prepare() {
        entities = this.entities;
      }

      protected updateEntity(entity: Entity, dt: number): void {
      }
    }

    const engine = new Engine();
    const entitiesCount = 5;
    for (let i = 0; i < entitiesCount; i++) {
      engine.addEntity(new Entity().add(new Position()));
    }
    engine.addSystem(new TestSystem());

    expect(entities).toBeDefined();
    expect(entities.length).toBe(entitiesCount);

  });

  it('Adding and removing should properly construct EntitySnapshot ', () => {
    let onRemoved: { snapshot?: boolean, entity?: boolean } = {snapshot: undefined, entity: undefined};
    let onAdded: { snapshot?: boolean, entity?: boolean } = {snapshot: undefined, entity: undefined};

    class MovementSystem extends IterativeSystem {
      public constructor() {
        super(new QueryBuilder().contains(Position).build());
      }

      protected updateEntity(entity: Entity, dt: number): void {
      }

      protected entityAdded = (proxy: EntitySnapshot) => {
        let entity = proxy.entity;
        onAdded = {snapshot: proxy.has(Position), entity: entity.has(Position)};
      };

      protected entityRemoved = (snapshot: EntitySnapshot) => {
        let entity = snapshot.entity;
        onRemoved = {snapshot: snapshot.has(Position), entity: entity.has(Position)};
      };
    }

    const engine = new Engine();
    const entity = new Entity();
    const system = new MovementSystem();

    engine.addSystem(system);
    engine.addEntity(entity);
    engine.update(1);

    entity.add(new Position());
    entity.remove(Position);

    expect(onAdded).toEqual({snapshot: false, entity: true});
    expect(onRemoved).toEqual({snapshot: true, entity: false});
  });
});

describe('Failure on accessing engine if not attached to it', () => {
  it(`Expected that engine can't be accessed if system is not attached to it`, () => {
    class Message {}

    class TestSystem extends System {
      public update(dt: number) {
        this.engine.addEntity(new Entity());
      }
    }

    const system = new TestSystem();
    expect(() => system.update(0)).toThrowError();
  });

  it(`Expected that message can't be sent if system is not attached to the engine`, () => {
    class Message {}

    class TestSystem extends System {
      public update(dt: number) {
        this.dispatch(new Message());
      }
    }

    const system = new TestSystem();
    expect(() => system.update(0)).toThrowError();
  });

  it(`Expected that removing system from engine breaking the iteration`, () => {
    class Component {}

    let amountOfIterations = 0;

    class TestSystem extends IterativeSystem {
      public constructor() {
        super(new Query(entity => entity.has(Component)));
      }

      protected updateEntity(entity: Entity, dt: number) {
        // In case if iteration continues - after removing system from engine
        // then the line below should throw an exception
        this.engine.clear();
        amountOfIterations++;
      }
    }

    const engine = new Engine();
    engine.addSystem(new TestSystem());
    engine.addEntity(new Entity().add(new Component()));
    engine.addEntity(new Entity().add(new Component()));
    engine.addEntity(new Entity().add(new Component()));
    expect(() => {engine.update(0);}).not.toThrowError();
    expect(amountOfIterations).toBe(1);
  });
});

