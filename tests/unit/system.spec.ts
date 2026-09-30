import {Engine, Entity, EntitySnapshot, IterativeSystem, Query, QueryBuilder, ReactionSystem, System, without} from '../../src';

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
    super(new QueryBuilder().with(Position).build());
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
        super(new QueryBuilder().with(Position).build());
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
        super(new QueryBuilder().with(Position).build());
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

  it("Entities removed during iteration are removed after the update and don't break the iteration ordering", () => {
    class Health {
      public constructor(public value: number) {
      }
    }

    class HealthTickSystem extends IterativeSystem {
      public constructor() {
        super(new QueryBuilder().with(Health).build());
      }

      protected updateEntity(entity: Entity, dt: number): void {
        const health = entity.get(Health)!;
        health.value -= 1;
        if (health.value <= 0) {
          this.engine.removeEntity(entity);
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

  it(`Re-adding entities which were removed should work after the engine update cycle`, () => {
    const engine = new Engine();
    const query = new QueryBuilder().with(Position).build();
    engine.addQuery(query);

    for (let i = 0; i < 5; i++) {
      engine.addEntity(new Entity().add(new Position()));
    }

    const entities = query.entities.concat()
    for (let entity of entities) {
      engine.removeEntity(entity);
    }
    for (let entity of entities) {
      engine.addEntity(entity);
    }
    engine.update(0);
    expect(engine.entities.length).toBe(5);
  })

  it('Entities removed and added back during the update stay in the engine', () => {
    const engine = new Engine();
    const entity = new Entity().add(new Position());
    engine.addEntity(entity).iterative([Position], (current) => {
      engine.removeEntity(current);
      engine.addEntity(current);
    });
    engine.update(0);
    expect(engine.entities).toEqual([entity]);
  })

  it('Entities removed during the update are removed after all systems are updated', () => {
    const engine = new Engine();
    const entity = new Entity().add(new Position());
    const seen: boolean[] = [];
    engine
      .addEntity(entity)
      .iterative([Position], (current) => engine.removeEntity(current))
      .iterative([Position], (current) => seen.push(engine.getEntityById(current.id) === undefined));
    engine.update(0);
    // The second system still sees the entity in its query, but the entity can't be found by id anymore
    expect(seen).toEqual([true]);
    expect(engine.entities).toEqual([]);
  })

  it('Entities removed outside of the update are removed immediately', () => {
    const engine = new Engine();
    const query = new QueryBuilder().with(Position).build();
    const entity = new Entity().add(new Position());
    engine.addQuery(query).addEntity(entity).removeEntity(entity);
    expect(query.isEmpty).toBeTruthy();
    expect(engine.entities).toEqual([]);
  })

  it('Removing entities during update neither skips remaining entities nor updates removed ones', () => {
    const engine = new Engine();
    const updated: Entity[] = [];
    const entities = [0, 1, 2, 3].map(() => new Entity().add(new Position()));

    class RemovingSystem extends IterativeSystem {
      public constructor() {
        super(new QueryBuilder().with(Position));
      }

      protected updateEntity(entity: Entity): void {
        updated.push(entity);
        if (entity === entities[0]) this.engine.removeEntity(entity);
        if (entity === entities[1]) entities[2].remove(Position);
      }
    }

    engine.addSystem(new RemovingSystem());
    entities.forEach((entity) => engine.addEntity(entity));
    engine.update(1);
    expect(updated).toEqual([entities[0], entities[1], entities[3]]);
  });
});

describe('Typed iterative system', () => {
  class Velocity {
    public constructor(public x: number = 1, public y: number = 1) {}
  }

  const FROZEN = 'frozen';

  class TypedMovementSystem extends IterativeSystem.of(Position, Velocity) {
    public updated: Entity[] = [];

    public constructor(private readonly speed: number) {
      super();
    }

    protected updateEntity(entity: Entity, dt: number, position: Position, velocity: Velocity): void {
      this.updated.push(entity);
      position.x += velocity.x * dt * this.speed;
      position.y += velocity.y * dt * this.speed;
    }
  }

  it('Passes components of the entity to updateEntity', () => {
    const engine = new Engine();
    const system = new TypedMovementSystem(2);
    engine.addSystem(system);
    const entity = new Entity().add(new Position()).add(new Velocity(1, 3));
    engine.addEntity(entity).addEntity(new Entity().add(new Position()));
    engine.update(1);
    expect(system.updated).toEqual([entity]);
    expect(entity.get(Position)).toEqual(new Position(2, 6));
  });

  it('Skips tags and uses them for matching', () => {
    class FrozenSystem extends IterativeSystem.of(FROZEN, Position) {
      public positions: Position[] = [];

      protected updateEntity(entity: Entity, dt: number, position: Position): void {
        this.positions.push(position);
      }
    }

    const engine = new Engine();
    const system = new FrozenSystem();
    engine.addSystem(system);
    const frozen = new Entity().add(new Position(1)).add(FROZEN);
    engine.addEntity(frozen).addEntity(new Entity().add(new Position(2)));
    engine.update(1);
    expect(system.positions).toEqual([frozen.get(Position)]);
  });

  it('Checks types of components', () => {
    class Health {
      public value: number = 100;
    }

    class WrongOrderSystem extends IterativeSystem.of(Position, Health) {
      // @ts-expect-error components are passed in the order they were specified
      protected updateEntity(entity: Entity, dt: number, health: Health, position: Position): void {}
    }

    expect(WrongOrderSystem).toBeDefined();
  });

  it('Stops updating entities if the system is removed during update', () => {
    const engine = new Engine();
    const updated: Entity[] = [];

    class RemovingSystem extends IterativeSystem.of(Position) {
      protected updateEntity(entity: Entity): void {
        updated.push(entity);
        this.engine.removeSystem(this);
      }
    }

    engine.addSystem(new RemovingSystem());
    engine.addEntity(new Entity().add(new Position())).addEntity(new Entity().add(new Position()));
    engine.update(1);
    expect(updated.length).toBe(1);
  });
});

describe('Typed reaction system', () => {
  class View {
    public constructor(public name: string = 'view') {}
  }

  const VISIBLE = 'visible';

  class ViewSystem extends ReactionSystem.of(View, Position, VISIBLE) {
    public log: Array<[string, Entity, View, Position]> = [];

    protected entityAdded = ({current}: EntitySnapshot, view: View, position: Position) => {
      this.log.push(['added', current, view, position]);
    };

    protected entityRemoved = ({current}: EntitySnapshot, view: View, position: Position) => {
      this.log.push(['removed', current, view, position]);
    };
  }

  function setup() {
    const engine = new Engine();
    const system = new ViewSystem();
    engine.addSystem(system);
    const view = new View();
    const position = new Position(1, 2);
    const entity = new Entity().add(view).add(position).add(VISIBLE);
    return {engine, system, entity, view, position};
  }

  it('Passes components of the added entity', () => {
    const {engine, system, entity, view, position} = setup();
    engine.addEntity(entity);
    expect(system.log).toEqual([['added', entity, view, position]]);
  });

  it('Passes removed component to entityRemoved', () => {
    const {engine, system, entity, view, position} = setup();
    engine.addEntity(entity);
    entity.remove(View);
    expect(system.log[1]).toEqual(['removed', entity, view, position]);
  });

  it('Passes components when the entity is removed from engine or loses a tag', () => {
    const {engine, system, entity, view, position} = setup();
    engine.addEntity(entity);
    entity.remove(VISIBLE);
    entity.add(VISIBLE);
    engine.removeEntity(entity);
    expect(system.log).toEqual([
      ['added', entity, view, position],
      ['removed', entity, view, position],
      ['added', entity, view, position],
      ['removed', entity, view, position],
    ]);
  });

  it('Passes the old component, when it is replaced', () => {
    const {engine, system, entity, view, position} = setup();
    engine.addEntity(entity);
    const replacement = new View('replacement');
    entity.add(replacement);
    expect(system.log.slice(1)).toEqual([['removed', entity, view, position], ['added', entity, replacement, position]]);
  });

  it('Checks types of components', () => {
    class WrongSystem extends ReactionSystem.of(View, Position) {
      // @ts-expect-error components are passed in the order they were specified
      protected entityAdded = (snapshot: EntitySnapshot, position: Position, view: View) => {};
    }

    expect(WrongSystem).toBeDefined();
  });
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
    expect(() => system.update(0)).toThrow();
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
    expect(() => system.update(0)).toThrow();
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
    }).not.toThrow();
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
describe('Systems with exclusions', () => {
  const DESTROYED = 'destroyed';

  it('Iterative system skips entities with excluded tags', () => {
    class MoveSystem extends IterativeSystem.of(Position, without(DESTROYED)) {
      protected updateEntity(entity: Entity, dt: number, position: Position): void {
        position.x += dt;
      }
    }

    const engine = new Engine().addSystem(new MoveSystem());
    const alive = new Entity().add(new Position(0, 0));
    const destroyed = new Entity().add(new Position(0, 0)).add(DESTROYED);
    engine.addEntity(alive).addEntity(destroyed);
    engine.update(1);

    expect(alive.get(Position)!.x).toBe(1);
    expect(destroyed.get(Position)!.x).toBe(0);
  });

  it('Reaction system is notified when an entity gets an excluded tag, and receives its components', () => {
    const removed: Position[] = [];

    class IndexSystem extends ReactionSystem.of(Position, without(DESTROYED)) {
      protected entityRemoved = (snapshot: EntitySnapshot, position: Position) => {
        removed.push(position);
      };
    }

    const engine = new Engine().addSystem(new IndexSystem());
    const entity = new Entity().add(new Position(1, 2));
    engine.addEntity(entity);
    entity.add(DESTROYED);

    expect(removed).toEqual([entity.get(Position)]);
  });

  it('Functional systems accept exclusions', () => {
    const engine = new Engine();
    const updated: Entity[] = [];
    engine.iterative([Position, without(DESTROYED)], (entity) => updated.push(entity));
    const alive = new Entity().add(new Position());
    engine.addEntity(alive).addEntity(new Entity().add(new Position()).add(DESTROYED));
    engine.update(1);

    expect(updated).toEqual([alive]);
  });
});
