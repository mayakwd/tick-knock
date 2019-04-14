import Entity from "../../src/ecs/Entity";
import Engine from "../../src/ecs/Engine";
import IterativeSystem from "../../src/ecs/IterativeSystem";
import {QueryBuilder} from "../../src";

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

  protected entityAdded = (entity: Entity) => {
    entity.get(Position)!.x = 100;
  };
}

describe("Iterative system", () => {
  it("Updating entities", () => {
    const engine = new Engine();
    const entity = new Entity().add(new Position());

    engine.addSystem(new MovementSystem());
    engine.addEntity(entity);
    engine.update(1);

    const position = entity.get(Position);
    expect(position).toBeDefined();
    expect(position!.x).toBe(110);
    expect(position!.y).toBe(10);
  })
});
