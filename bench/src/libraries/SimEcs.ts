import {buildWorld, createSystem, IPreptimeWorld, IRuntimeWorld, ISystem, queryComponents, Read, Write} from 'sim-ecs';
import {A, B, C, D, E, Position, Rotation, Transform, Value, Velocity} from '../components';
import {Benchmark, ScenarioId, Sizes} from '../Scenario';
import {getPackageVersion, Library} from './Library';

/**
 * sim-ecs - ECS with scheduling, which must be fully specified before running.
 * Entities are created in the preparation world, systems and queries work in the runtime world.
 * So only scenarios that fit this model are implemented.
 * @see https://github.com/NSSTC/sim-ecs
 */
export function createSimEcsLibrary(): Library {
  return {
    name: 'sim-ecs',
    version: getPackageVersion('sim-ecs'),
    scenarios: {
      [ScenarioId.Insert]: insert,
      [ScenarioId.IterateSmall]: iterateSmall,
      [ScenarioId.IterateLarge]: iterateLarge,
      [ScenarioId.Memory]: memory,
    },
  };
}

/**
 * Prepares a runtime world, that executes systems synchronously, the same way other libraries do
 */
async function prepareRun(world: IPreptimeWorld): Promise<IRuntimeWorld> {
  const runWorld = await world.prepareRun({executionFunction: (fn: Function) => fn()});
  await runWorld.transitionActions.flushCommands();
  return runWorld;
}

function buildPreptimeWorld(systems: ReadonlyArray<ISystem<any>>, components: ReadonlyArray<new (...args: any[]) => object>): IPreptimeWorld {
  return buildWorld()
    .withDefaultScheduling((root) => root.addNewStage((stage) => {
      systems.forEach((system) => stage.addSystem(system));
    }))
    .withComponents(...components)
    .build();
}

function insert(): Benchmark {
  const world = buildWorld().withComponents(Transform, Position, Rotation, Velocity).build();
  return {
    run() {
      for (let i = 0; i < Sizes.insert; i++) {
        world.buildEntity().withAll(Transform, Position, Rotation, Velocity).build();
      }
    },
    reset() {
      world.clearEntities();
    },
  };
}

async function iterateSmall(): Promise<Benchmark> {
  const MovementSystem = createSystem({
    query: queryComponents({position: Write(Position), velocity: Read(Velocity)}),
  }).withRunFunction(({query}) => {
    for (const {position, velocity} of query.iter()) {
      position.x += velocity.x;
      position.y += velocity.y;
    }
  }).build();

  const world = buildPreptimeWorld([MovementSystem], [Transform, Position, Rotation, Velocity]);
  for (let i = 0; i < Sizes.iterateSmall; i++) {
    world.buildEntity().withAll(Transform, Position, Rotation, Velocity).build();
  }
  const runWorld = await prepareRun(world);
  return {
    run() {
      return runWorld.step();
    },
  };
}

async function iterateLarge(): Promise<Benchmark> {
  const createSwapSystem = (x: typeof Value, y: typeof Value) => createSystem({
    query: queryComponents({first: Write(x), second: Write(y)}),
  }).withRunFunction(({query}) => {
    for (const {first, second} of query.iter()) {
      const value = first.value;
      first.value = second.value;
      second.value = value;
    }
  }).build();

  const world = buildPreptimeWorld([createSwapSystem(A, B), createSwapSystem(C, D), createSwapSystem(C, E)], [A, B, C, D, E]);
  const groups = [[A], [A, B], [A, B, C], [A, B, C, D], [A, B, C, E]];
  for (const group of groups) {
    for (let i = 0; i < Sizes.iterateLargeGroup; i++) {
      world.buildEntity().withAll(...group).build();
    }
  }
  const runWorld = await prepareRun(world);
  return {
    run() {
      return runWorld.step();
    },
  };
}

function memory(): Benchmark {
  const world = buildWorld().withComponents(Position, Velocity, Rotation).build();
  return {
    run() {
      for (let i = 0; i < Sizes.memoryEntities; i++) {
        world.buildEntity().withAll(Position, Velocity).build();
      }
    },
  };
}
