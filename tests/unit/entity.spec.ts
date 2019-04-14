import Entity from "../../src/ecs/Entity";
import getComponentId from "../../src/ecs/ComponentId";

class Position {
  public x: number = 0;
  public y: number = 0;

  constructor(x: number = 0, y: number = 0) {
    this.x = x;
    this.y = y;
  }
}

describe("Components id", () => {
  it("Getting component id without forcing of id creation returns undefined", () => {
    expect(getComponentId(
      class Test {
      }
    )).toBeUndefined();
  });

  it("Getting component id return equal values for same component twice", () => {
    class Test1 {
    }

    class Test2 {
    }

    expect(getComponentId(Test1, true))
      .toBe(getComponentId(Test1, true));

    expect(getComponentId(Test2, true))
      .toBe(getComponentId(Test2));
  });

  it("Getting components id returns different values", () => {
    class Test1 {
    }

    class Test2 {
    }

    const positionId = getComponentId(Test1, true);
    const viewId = getComponentId(Test2, true);

    expect(positionId).toBeDefined();
    expect(viewId).toBeDefined();

    expect(positionId == viewId).toBeFalsy();
  });
});

describe("Adding component", () => {
  it("Simple", () => {
    const entity = new Entity();
    let addedCount = 0;
    let removedCount = 0;

    expect(entity.has(Position)).toBe(false);

    const addedCallback = () => addedCount++;
    const removedCallback = () => removedCount++;
    entity.onComponentAdded.connect(addedCallback);
    entity.onComponentRemoved.connect(removedCallback);

    entity.add(new Position());

    entity.onComponentAdded.disconnect(addedCallback);
    entity.onComponentRemoved.disconnect(removedCallback);

    expect(entity.has(Position)).toBe(true);
    expect(addedCount).toBe(1);
    expect(removedCount).toBe(0);
  });
  it("Adding component twice, must override previous component", () => {
    const entity = new Entity();
    let addedCount = 0;
    let removedCount = 0;

    const position1 = new Position(0, 0);
    const position2 = new Position(1, 1);

    const addedCallback = () => addedCount++;
    const removedCallback = () => removedCount++;
    entity.onComponentAdded.connect(addedCallback);
    entity.onComponentRemoved.connect(removedCallback);

    entity.add(position1);
    entity.add(position2);

    entity.onComponentAdded.disconnect(addedCallback);
    entity.onComponentRemoved.disconnect(removedCallback);

    expect(entity.get(Position)).toBe(position2);
    expect(entity.getAll().length).toBe(1);
    expect(addedCount).toBe(2);
    expect(removedCount).toBe(1);
  });

  it("Adding non-valid components", () => {
    const entity = new Entity();
    expect(() => entity.add(undefined)).toThrow();
    expect(() => entity.add(null)).toThrow();
  })
});

describe("Removing component", () => {
  it("Simple", () => {
    const entity = new Entity();
    const position = new Position(1, 1);

    let addedCount = 0;
    let removedCount = 0;

    const addedCallback = () => addedCount++;
    const removedCallback = () => removedCount++;
    entity.onComponentAdded.connect(addedCallback);
    entity.onComponentRemoved.connect(removedCallback);

    entity.add(position);
    const removedComponent = entity.remove(Position);

    entity.onComponentAdded.disconnect(addedCallback);
    entity.onComponentRemoved.disconnect(removedCallback);

    expect(entity.getAll().length).toBe(0);
    expect(addedCount).toBe(1);
    expect(removedCount).toBe(1);
    expect(removedComponent).toBeDefined();
    expect(removedComponent).toBe(position);
  });

  it("Removing absent component", () => {
    const entity = new Entity();

    let addedCount = 0;
    let removedCount = 0;

    const addedCallback = () => addedCount++;
    const removedCallback = () => removedCount++;
    entity.onComponentAdded.connect(addedCallback);
    entity.onComponentRemoved.connect(removedCallback);

    const removedComponent = entity.remove(Position);

    entity.onComponentAdded.disconnect(addedCallback);
    entity.onComponentRemoved.disconnect(removedCallback);

    expect(entity.getAll().length).toBe(0);
    expect(addedCount).toBe(0);
    expect(removedCount).toBe(0);
    expect(removedComponent).toBeUndefined();
  });
});