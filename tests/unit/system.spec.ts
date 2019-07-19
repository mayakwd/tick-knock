import {Engine, Entity, EntitySnapshot, IterativeSystem, QueryBuilder} from '../../src';

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
    let entities: ReadonlyArray<Entity>;

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

    // @ts-ignore
    expect(entities).toBeDefined();
    // @ts-ignore
    expect(entities.length).toBe(entitiesCount);

  });

  it('Adding and removing should properly construct EntitySnapshot ', () => {
    let onRemoved: { proxy?: boolean, entity?: boolean } = {proxy: undefined, entity: undefined};
    let onAdded: { proxy?: boolean, entity?: boolean } = {proxy: undefined, entity: undefined};

    class MovementSystem extends IterativeSystem {
      public constructor() {
        super(new QueryBuilder().contains(Position).build());
      }

      protected updateEntity(entity: Entity, dt: number): void {
      }

      protected entityAdded = (proxy: EntitySnapshot) => {
        let entity = proxy.entity;
        onAdded = {proxy: proxy.has(Position), entity: entity.has(Position)};
      };

      protected entityRemoved = (proxy: EntitySnapshot) => {
        let entity = proxy.entity;
        onRemoved = {proxy: proxy.has(Position), entity: entity.has(Position)};
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

    expect(onAdded).toEqual({proxy: true, entity: true});
    expect(onRemoved).toEqual({proxy: true, entity: false});
  });
});
