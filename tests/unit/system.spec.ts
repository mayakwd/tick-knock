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

  protected entityAdded = ({current}: EntitySnapshot) => {
    current.get(Position)!.x = 100;
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

      protected entityAdded = ({current, previous}: EntitySnapshot) => {
        onAdded = {snapshot: previous.has(Position), entity: current.has(Position)};
      };

      protected entityRemoved = ({current, previous}: EntitySnapshot) => {
        onRemoved = {snapshot: previous.has(Position), entity: current.has(Position)};
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

  it("Entities safe removal during iteration should not break the iteration ordering", () => {
    class Health {
      public constructor(public value: number) {
      }
    }

    class HealthTickSystem extends IterativeSystem {
      public constructor() {
        super(new QueryBuilder().contains(Health).build());
      }

      protected updateEntity(entity: Entity, dt: number): void {
        const health = entity.get(Health)!;
        health.value -= 1;
        if (health.value <= 0) {
          this.engine.removeEntity(entity, true);
        }
      }
    }

    const engine = new Engine();
    engine.addSystem(new HealthTickSystem());
    for (let i = 0; i < 5; i++) {
      engine.addEntity(new Entity().add(new Health(1)));
    }
    engine.update(1);
    expect(engine.entities.length).toBe(0);
  })

  it.each([true, false])(`Re-adding entities which were removed should work after the engine update cycle`, (safe) => {
    const engine = new Engine();
    const query = new QueryBuilder().contains(Position).build();
    engine.addQuery(query);

    for (let i = 0; i < 5; i++) {
      engine.addEntity(new Entity().add(new Position()));
    }

    const entities = query.entities.concat()
    for (let entity of entities) {
      engine.removeEntity(entity, safe);
    }
    for (let entity of entities) {
      engine.addEntity(entity);
    }
    engine.update(0);
    expect(engine.entities.length).toBe(5);
  })
});

describe('Failure on accessing engine if not attached to it', () => {
  it(`Expected that engine can't be accessed if system is not attached to it`, () => {
    class Message {
    }

    class TestSystem extends System {
      public update(dt: number) {
        this.engine.addEntity(new Entity());
      }
    }

    const system = new TestSystem();
    expect(() => system.update(0)).toThrowError();
  });

  it(`Expected that message can't be sent if system is not attached to the engine`, () => {
    class Message {
    }

    class TestSystem extends System {
      public update(dt: number) {
        this.dispatch(new Message());
      }
    }

    const system = new TestSystem();
    expect(() => system.update(0)).toThrowError();
  });

  it(`Expected that removing system from engine breaking the iteration`, () => {
    class Component {
    }

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
    expect(() => {
      engine.update(0);
    }).not.toThrowError();
    expect(amountOfIterations).toBe(1);
  });

  it(`Iterative system should iterate over entities after removing and subsequent adding it to the engine`, () => {
    class Component {
    }

    const engine = new Engine();
    const entity = new Entity().add(new Component());
    let iterationsCount = 0;
    const system = new class extends IterativeSystem {
      public constructor() {
        super((entity) => entity.has(Component));
      }

      protected updateEntity(entity: Entity, dt: number) {
        iterationsCount++;
      }
    }();
    engine.addEntity(entity);

    engine.addSystem(system);
    engine.update(1);

    engine.removeSystem(system);
    engine.update(1);

    engine.addSystem(system);
    engine.update(1);

    expect(iterationsCount).toBe(2);
  });

  it(`After removal request system must be deleted`, () => {
    const engine = new Engine();
    let iterationsCount = 0;
    const system = new class extends System {
      public update(dt: number) {
        iterationsCount++;
        this.requestRemoval();
      }
    };
    engine.addSystem(system);
    for (let i = 0; i < 5; i++) {
      engine.update(0);
    }
    expect(iterationsCount).toBe(1);
  });
});