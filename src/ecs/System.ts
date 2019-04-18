import {Engine} from "./Engine";

/**
 * Engine system
 * Represents logic container for updating engine state
 */
export abstract class System {
  /**
   * Gets a priority of the system
   * It should be initialized before adding to the system
   */
  public priority: number = 0;

  /**
   * Updates system
   *
   * @param dt Delta time in seconds
   */
  public update(dt: number) {}

  /**
   * Callback that will be invoked when system being added to engine
   * @param engine
   */
  public onAddedToEngine(engine: Engine) {}

  /**
   * Callback that will be invoked after removing system from engine
   * @param engine
   */
  public onRemovedFromEngine(engine: Engine) {}
}
