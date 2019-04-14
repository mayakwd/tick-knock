import Engine from "./Engine";

export default abstract class System {
  public priority: number = 0;

  protected constructor() {}

  public update(dt: number) {}

  public onAddedToEngine(engine: Engine) {}

  public onRemovedFromEngine(engine: Engine) {}
}
