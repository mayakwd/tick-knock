import {Query} from "./Query";
import {Engine} from "./Engine";
import {Entity} from "./Entity";
import {System} from "./System";

export abstract class IterativeSystem extends System {
  private readonly query: Query;

  protected constructor(query: Query) {
    super();
    this.query = query;
  }

  public onAddedToEngine(engine: Engine) {
    engine.addQuery(this.query);
    this.query.onEntityAdded.connect(this.entityAdded);
    this.query.onEntityRemoved.connect(this.entityRemoved);
  }

  public update(dt: number) {
    this.updateEntities(dt);
  }

  public onRemovedFromEngine(engine: Engine) {
    engine.removeQuery(this.query);

    this.query.onEntityAdded.disconnect(this.entityAdded);
    this.query.onEntityRemoved.disconnect(this.entityRemoved);

    this.query.clear();
  }

  protected updateEntities(dt: number) {
    for (let entity of this.query.entities) {
      this.updateEntity(entity, dt);
    }
  }

  protected abstract updateEntity(entity: Entity, dt: number): void;

  protected entityAdded = (entity: Entity) => {};

  protected entityRemoved = (entity: Entity) => {};
}
