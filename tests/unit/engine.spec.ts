import {Engine, Entity, IterativeSystem, Query, QueryBuilder} from '../../src';

class Component {
}

abstract class TestSystem extends IterativeSystem {
  private readonly arr?: number[];

  protected constructor(arr?: number[]) {
    super(new QueryBuilder().contains(Component).build());
    this.arr = arr;
  }

  public update(dt: number) {
    super.update(dt);
    if (this.arr) {
      this.arr.push(this.priority);
    }
  }

  protected updateEntity(entity: Entity, dt: number): void {
  }
}

class TestSystem1 extends TestSystem {
  public constructor(arr?: number[]) {
    super(arr);
  }
}

class TestSystem2 extends TestSystem {
  public constructor(arr?: number[]) {
    super(arr);
  }
}

class TestSystem3 extends TestSystem {
  public constructor(arr?: number[]) {
    super(arr);
  }
}

describe('System manipulation', () => {
  it('Engine system creating', () => {
    const engine = new Engine();
    expect(engine.systems).toBeDefined();
    expect(engine.systems.length).toBe(0);
    expect(engine.entities).toBeDefined();
    expect(engine.entities.length).toBe(0);
    expect(engine.queries).toBeDefined();
    expect(engine.queries.length).toBe(0);
  });

  it('Adding system', () => {
    const engine = new Engine();
    const system = new TestSystem1();

    engine.addSystem(system);

    expect(engine.systems.length).toBe(1);
    expect(engine.getSystem(TestSystem1)).toBe(system);
  });

  it('Adding and removing multiple system with priority', () => {
    const engine = new Engine();
    const system1 = new TestSystem1();
    const system2 = new TestSystem2();
    const system3 = new TestSystem3();

    engine.addSystem(system1, 200);
    engine.addSystem(system2, 300);
    engine.addSystem(system3, 100);

    expect(engine.systems.length).toBe(3);
    expect(engine.getSystem(TestSystem1)).toBe(system1);
    expect(engine.getSystem(TestSystem2)).toBe(system2);
    expect(engine.getSystem(TestSystem3)).toBe(system3);
    expect(engine.systems).toEqual([system3, system1, system2]);

    engine.removeAllSystems();

    expect(engine.systems.length).toBe(0);
  });

  it('Adding multiple systems with same priority must added in same order', () => {
    const engine = new Engine();
    const system1 = new TestSystem1();
    const system2 = new TestSystem2();
    const system3 = new TestSystem3();

    engine.addSystem(system1);
    engine.addSystem(system2);
    engine.addSystem(system3);

    expect(engine.systems.length).toBe(3);
    expect(engine.systems).toEqual([system1, system2, system3]);
  });

  it('Remove system', () => {
    const engine = new Engine();
    const system = new TestSystem1();

    engine.addSystem(system);

    expect(engine.systems.length).toBe(1);
    expect(engine.getSystem(TestSystem1)).toBe(system);

    engine.removeSystem(system);

    expect(engine.systems.length).toBe(0);
    expect(engine.getSystem(TestSystem1)).toBeUndefined();
  });

  it('Engine updating', () => {
    const engine = new Engine();
    const arr: number[] = [];
    const system1 = new TestSystem1(arr);
    const system2 = new TestSystem2(arr);
    const system3 = new TestSystem3(arr);

    engine.addSystem(system1, 1);
    engine.addSystem(system2, 2);
    engine.addSystem(system3, 3);

    engine.update(1);
    expect(arr).toEqual([1, 2, 3]);
  });

  it('Engine#clear should remove entities, systems, remove and clear queries', () => {
    class TestSystem extends IterativeSystem {
      public constructor() {
        super(new Query(entity => true));
      }

      protected updateEntity(entity: Entity, dt: number): void {
      }
    }

    const engine = new Engine();
    const query = new Query(entity => entity.has(Component));
    const system = new TestSystem();

    engine.addQuery(query);
    engine.addSystem(system);
    engine.addEntity(new Entity().add(new Component()));

    expect(query.isEmpty).toBeFalsy();

    engine.clear();
    expect(engine.systems.length).toBe(0);
    expect(engine.queries.length).toBe(0);
    expect(engine.entities.length).toBe(0);
    expect(query.isEmpty).toBeTruthy();

    engine.addEntity(new Entity().add(new Component()));
    expect(query.isEmpty).toBeTruthy();
  });

  it('Expected that removing all entities will fire onEntityRemoved', () => {
    const engine = new Engine();
    const entitiesCount = 2;
    let removedCount = 0;
    for (let i = 0; i < entitiesCount; i++) {
      engine.addEntity(new Entity());
    }
    engine.onEntityRemoved.connect(() => removedCount++);
    engine.removeAllEntities();
    expect(engine.entities.length).toBe(0);
    expect(removedCount).toBe(entitiesCount);
  });
});
