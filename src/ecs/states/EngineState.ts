import {Engine} from "../Engine";
import {System} from "../System";

/**
 * Represents a state for a EngineStateMachine.
 * Contains system providers, that are used to add Systems to the Engine when this state is activated.
 */
export class EngineState {
  private providers: SystemProvider[] = [];
  private systems?: System[];

  /**
   * Adds an instance of the system with priority.
   * Priority will be set during state activation
   * @param system System instance
   * @param priority Priority in the updating loop, lower value means earlier update
   */
  public addInstance(system: System, priority: number = 0): EngineState {
    this.providers[this.providers.length] = new InstanceProvider(system, priority);
    return this;
  }

  /**
   * Adds a system factory with priority.
   * Priority will be set during state activation
   *
   * @param factory {@link SystemFactory} Factory that will be used to create an instance of the System
   * @param priority Priority in the updating loop, lower value means earlier update
   */
  public addFactory(factory: SystemFactory, priority: number = 0): EngineState {
    this.providers[this.providers.length] = new FactoryProvider(factory, priority);
    return this;
  }

  /**
   * @ignore
   */
  public transitIn(engine: Engine): void {
    this.systems = [];
    for (let provider of this.providers) {
      let system = this.systems[this.systems.length] = provider.get();
      engine.addSystem(system);
    }
  }

  /**
   * @ignore
   */
  public transitOut(engine: Engine): void {
    if (this.systems) {
      for (let system of this.systems) {
        engine.removeSystem(system);
      }
    }
    this.systems = undefined;
  }
}

/**
 * Alias for system factory. Function that should return instance of the system
 */
export type SystemFactory = () => System;

interface SystemProvider {
  get(): System;
}

class InstanceProvider implements SystemProvider {
  private readonly system: System;
  private readonly priority: number;

  constructor(system: System, priority: number) {
    this.system = system;
    this.priority = priority;
  }

  get(): System {
    this.system.priority = this.priority;
    return this.system;
  }
}

class FactoryProvider implements SystemProvider {
  private readonly factory: SystemFactory;
  private readonly priority: number;

  constructor(factory: SystemFactory, priority: number) {
    this.factory = factory;
    this.priority = priority;
  }

  get(): System {
    const system = this.factory();
    system.priority = this.priority;
    return system;
  }
}
