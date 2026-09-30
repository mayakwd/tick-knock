import type * as BecsyModule from '@lastolivegames/becsy/index.js' with {'resolution-mode': 'import'};
import type {Entity, System as SystemType, World} from '@lastolivegames/becsy/index.js' with {'resolution-mode': 'import'};
import {Benchmark, ReactionCounter, ScenarioId, Sizes} from '../Scenario';
import {getPackageVersion, Library} from './Library';

// becsy is published as an ES module only, its main file is UMD and can't be required
const {System, Type, World: BecsyWorld}: typeof BecsyModule = require('@lastolivegames/becsy/index.js');

class Position {
  public static schema = {x: {type: Type.float64, default: 0}, y: {type: Type.float64, default: 0}};
  declare public x: number;
  declare public y: number;
}

class Velocity {
  public static schema = {x: {type: Type.float64, default: 1}, y: {type: Type.float64, default: 1}};
  declare public x: number;
  declare public y: number;
}

class Rotation {
  public static schema = {value: {type: Type.float64, default: 0}};
  declare public value: number;
}

class Transform {
  public static schema = {value: {type: Type.float64, default: 1}};
  declare public value: number;
}

/**
 * Creates a component with a single numeric field. becsy requires unique names of component classes.
 */
function valueComponent(name: string) {
  const component = class {
    public static schema = {value: {type: Type.float64, default: 0}};
    declare public value: number;
  };
  Object.defineProperty(component, 'name', {value: name});
  return component;
}

const [A, B, C, D, E] = ['A', 'B', 'C', 'D', 'E'].map(valueComponent);
const fillers = Array.from({length: Sizes.fillerQueries}, (_, i) => valueComponent(`Filler${i}`));

type ValueComponent = typeof A;
type ComponentType = new () => object;

/**
 * Limits of the world. becsy preallocates storage for all entities, so the limits are set to fit every scenario.
 */
const WORLD_LIMITS = {
  maxEntities: 100_000,
  maxLimboComponents: 100_000,
  maxShapeChangesPerFrame: 400_000,
  maxWritesPerFrame: 400_000,
};

/**
 * becsy - multithreading-ready ECS with class-based API, component fields are stored in typed arrays.
 * Entities can be changed only by systems while the world is executing, so every operation is performed by
 * a driver system during `world.execute()`.
 * @see https://github.com/LastOliveGames/becsy
 */
export function createBecsyLibrary(): Library {
  return {
    name: 'becsy',
    version: getPackageVersion('@lastolivegames/becsy'),
    scenarios: {
      [ScenarioId.Insert]: insert,
      [ScenarioId.IterateSmall]: iterateSmall,
      [ScenarioId.IterateLarge]: iterateLarge,
      [ScenarioId.ComponentChurn]: () => churn(Velocity),
      [ScenarioId.UnrelatedChurn]: () => churn(Transform),
      [ScenarioId.SpawnDespawn]: spawnDespawn,
      [ScenarioId.ReactiveSystem]: reactiveSystem,
      [ScenarioId.Memory]: memory,
    },
  };
}

/**
 * Operation performed by the driver system in the next execution of the world
 */
type Operation = (system: SystemType, entities: readonly Entity[]) => void;

/**
 * World with a driver system, that performs operations of the scenario
 */
interface DrivenWorld {
  world: World;

  /**
   * Performs the operation in the next execution of the world, and executes it
   */
  perform(operation: Operation): Promise<void>;
}

/**
 * Creates a world with the driver system and other systems of the scenario.
 *
 * @param systems Systems of the scenario
 * @param components Component types of the scenario
 * @param queries Component types of queries, that are kept up to date as in other libraries
 * @param options World options overriding default limits
 */
async function createWorld(
  systems: Array<new () => SystemType>,
  components: ComponentType[],
  queries: ComponentType[][] = [],
  options: Partial<typeof WORLD_LIMITS> = {},
): Promise<DrivenWorld> {
  let operation: Operation | undefined;

  class Queries extends System {
    public constructor() {
      super();
      for (const types of queries) this.query((q) => q.current.with(...types));
    }
  }

  class Driver extends System {
    // Access to all components, so the driver can create entities and change their components
    private readonly all = this.query((q) => q.current.with(Position).usingAll.write);

    public constructor() {
      super();
      // Operations are performed before other systems of the frame
      // becsy doesn't export the type of system classes, so it's taken from the signature of `before`
      this.schedule((s) => s.before(...([Queries, ...systems] as unknown as Parameters<typeof s.before>)));
    }

    public execute(): void {
      if (operation === undefined) return;
      const current = operation;
      operation = undefined;
      current(this, this.all.current);
    }
  }

  const world = await BecsyWorld.create({
    ...WORLD_LIMITS,
    ...options,
    // Position is always defined, because the driver uses it to find entities
    defs: [...new Set([Position, ...components]), Driver, Queries, ...systems],
  });
  return {
    world,
    async perform(next: Operation) {
      operation = next;
      await world.execute();
    },
  };
}

function mainQueries(): ComponentType[][] {
  const related = [Position, Velocity, Rotation];
  return [[Position, Velocity], ...fillers.map((filler, i) => [related[i % related.length], filler])];
}

const baseComponents = (): ComponentType[] => [Position, Velocity, Rotation, Transform, ...fillers];

async function insert(): Promise<Benchmark> {
  const {perform} = await createWorld([], baseComponents(), mainQueries());
  return {
    run() {
      return perform((system) => {
        for (let i = 0; i < Sizes.insert; i++) system.createEntity(Transform, Position, Rotation, Velocity);
      });
    },
    async reset() {
      await perform((system, entities) => {
        for (const entity of entities) entity.delete();
      });
      // Deleted entities are released after the next frames
      await perform(() => undefined);
    },
  };
}

async function iterateSmall(): Promise<Benchmark> {
  class MovementSystem extends System {
    private readonly movable = this.query((q) => q.current.with(Velocity).and.with(Position).write);

    public execute(): void {
      for (const entity of this.movable.current) {
        const position = entity.write(Position);
        const velocity = entity.read(Velocity);
        position.x += velocity.x;
        position.y += velocity.y;
      }
    }
  }

  const {world, perform} = await createWorld([MovementSystem], baseComponents(), mainQueries());
  await perform((system) => {
    for (let i = 0; i < Sizes.iterateSmall; i++) system.createEntity(Transform, Position, Rotation, Velocity);
  });
  return {
    run() {
      return world.execute();
    },
  };
}

async function iterateLarge(): Promise<Benchmark> {
  // Systems write the same components, so becsy requires their order to be specified
  const createSystem = (x: ValueComponent, y: ValueComponent, previous?: new () => SystemType) => class extends System {
    private readonly entities = this.query((q) => q.current.with(x, y).write);

    public constructor() {
      super();
      if (previous !== undefined) {
        this.schedule((s) => s.after(...([previous] as unknown as Parameters<typeof s.after>)));
      }
    }

    public execute(): void {
      for (const entity of this.entities.current) {
        const first = entity.write(x);
        const second = entity.write(y);
        const value = first.value;
        first.value = second.value;
        second.value = value;
      }
    }
  };

  const first = createSystem(A, B);
  const second = createSystem(C, D, first);
  const systems = [first, second, createSystem(C, E, second)];
  const {world, perform} = await createWorld(systems, [A, B, C, D, E]);
  const groups = [[A], [A, B], [A, B, C], [A, B, C, D], [A, B, C, E]];
  await perform((system) => {
    for (const group of groups) {
      for (let i = 0; i < Sizes.iterateLargeGroup; i++) system.createEntity(...group);
    }
  });
  return {
    run() {
      return world.execute();
    },
  };
}

async function churn(component: ComponentType): Promise<Benchmark> {
  const {perform} = await createWorld([], baseComponents(), mainQueries());
  const changed: Entity[] = [];
  await perform((system) => {
    for (let i = 0; i < Sizes.churnEntities; i++) {
      const entity = system.createEntity(Position, Rotation);
      if (i < Sizes.churnChanged) changed.push(entity.hold());
    }
  });
  return {
    // Queries are updated between frames, so adding and removing are separate frames:
    // in one frame the entity would never enter or leave queries
    async run() {
      await perform(() => {
        for (const entity of changed) entity.add(component);
      });
      await perform(() => {
        for (const entity of changed) entity.remove(component);
      });
    },
  };
}

async function spawnDespawn(): Promise<Benchmark> {
  const {perform} = await createWorld([], baseComponents(), mainQueries());
  let entities: Entity[] = [];
  await perform((system) => {
    for (let i = 0; i < Sizes.churnEntities; i++) entities.push(system.createEntity(Position, Velocity).hold());
  });
  return {
    run() {
      return perform((system) => {
        const spawned: Entity[] = [];
        for (let i = 0; i < Sizes.churnChanged; i++) spawned.push(system.createEntity(Position, Velocity, Rotation).hold());
        for (let i = 0; i < Sizes.churnChanged; i++) entities[i].delete();
        entities = entities.slice(Sizes.churnChanged).concat(spawned);
      });
    },
  };
}

/**
 * Reactions are implemented with a reactive query. Queries report changes when their system is executed,
 * so the world is executed after adding and after removing.
 */
async function reactiveSystem(): Promise<Benchmark> {
  const counter = new ReactionCounter();

  class ReactiveSystem extends System {
    private readonly movable = this.query((q) => q.added.and.removed.with(Position, Velocity));

    public execute(): void {
      for (const entity of this.movable.added) {
        counter.added++;
        counter.sum += entity.read(Position).x;
      }
      this.accessRecentlyDeletedData();
      for (const entity of this.movable.removed) {
        counter.removed++;
        counter.sum += entity.read(Velocity).x;
      }
    }
  }

  const {perform} = await createWorld([ReactiveSystem], [Position, Velocity]);
  const changed: Entity[] = [];
  await perform((system) => {
    for (let i = 0; i < Sizes.churnEntities; i++) {
      const entity = system.createEntity(Position);
      if (i < Sizes.churnChanged) changed.push(entity.hold());
    }
  });
  return {
    async run() {
      await perform(() => {
        for (const entity of changed) entity.add(Velocity);
      });
      await perform(() => {
        for (const entity of changed) entity.remove(Velocity);
      });
    },
    verify() {
      counter.verify();
    },
  };
}

/**
 * becsy preallocates storage when the world is created, so the world is created inside the measured run
 * with limits that just fit the scenario.
 */
function memory(): Benchmark {
  let world: DrivenWorld | undefined;
  return {
    async run() {
      world = await createWorld([], [Position, Velocity, Rotation], [[Position], [Position, Velocity], [Rotation]], {
        maxEntities: Sizes.memoryEntities + 1,
        maxLimboComponents: Sizes.memoryEntities,
        maxShapeChangesPerFrame: Sizes.memoryEntities * 3,
        maxWritesPerFrame: Sizes.memoryEntities * 3,
      });
      await world.perform((system) => {
        for (let i = 0; i < Sizes.memoryEntities; i++) system.createEntity(Position, Velocity);
      });
    },
  };
}
