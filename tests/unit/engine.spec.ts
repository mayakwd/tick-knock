import Engine from "../../src/ecs/Engine";
import Entity from "../../src/ecs/Entity";
import IterativeSystem from "../../src/ecs/IterativeSystem";
import {QueryBuilder} from "../../src";

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

describe("System manipulation", () => {
  it("Engine system creating", () => {
    const engine = new Engine();
    expect(engine.systems).toBeDefined();
    expect(engine.systems.length).toBe(0);
    expect(engine.entities).toBeDefined();
    expect(engine.entities.length).toBe(0);
    expect(engine.queries).toBeDefined();
    expect(engine.queries.length).toBe(0);
  });

  it("Adding system", () => {
    const engine = new Engine();
    const system = new TestSystem1();

    engine.addSystem(system);

    expect(engine.systems.length).toBe(1);
    expect(engine.getSystem(TestSystem1)).toBe(system);
  });

  it("Adding and removing multiple system with priority", () => {
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

  it("Adding multiple systems with same priority must added in same order", () => {
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

  it("Remove system", () => {
    const engine = new Engine();
    const system = new TestSystem1();

    engine.addSystem(system);

    expect(engine.systems.length).toBe(1);
    expect(engine.getSystem(TestSystem1)).toBe(system);

    engine.removeSystem(system);

    expect(engine.systems.length).toBe(0);
    expect(engine.getSystem(TestSystem1)).toBeUndefined();
  });

  it("Engine updating", () => {
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
});
