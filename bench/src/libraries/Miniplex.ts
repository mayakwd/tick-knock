import {World} from 'miniplex';
import {Benchmark, ScenarioId, Sizes} from '../Scenario';
import {getPackageVersion, Library} from './Library';

interface Vector {
  x: number;
  y: number;
}

interface Value {
  value: number;
}

/**
 * Miniplex entities are plain objects, components are their properties
 */
interface Entity {
  position?: Vector;
  velocity?: Vector;
  rotation?: Value;
  transform?: Value;
  a?: Value;
  b?: Value;
  c?: Value;
  d?: Value;
  e?: Value;

  [filler: `filler${number}`]: Value | undefined;
}

type ValueKey = 'a' | 'b' | 'c' | 'd' | 'e';

/**
 * miniplex - ECS with plain objects as entities and properties as components.
 * @see https://github.com/hmans/miniplex
 */
export function createMiniplexLibrary(): Library {
  return {
    name: 'miniplex',
    version: getPackageVersion('miniplex'),
    scenarios: {
      [ScenarioId.Insert]: insert,
      [ScenarioId.IterateSmall]: iterateSmall,
      [ScenarioId.IterateLarge]: iterateLarge,
      [ScenarioId.ComponentChurn]: () => churn('velocity'),
      [ScenarioId.UnrelatedChurn]: () => churn('transform'),
      [ScenarioId.SpawnDespawn]: spawnDespawn,
      [ScenarioId.Memory]: memory,
    },
  };
}

/**
 * Creates a world with the main query and filler queries, as other libraries do.
 */
function createWorld(): World<Entity> {
  const world = new World<Entity>();
  const related: Array<keyof Entity> = ['position', 'velocity', 'rotation'];
  world.with('position', 'velocity').connect();
  for (let i = 0; i < Sizes.fillerQueries; i++) {
    world.with(related[i % related.length], `filler${i}`).connect();
  }
  return world;
}

function fullEntity(): Entity {
  return {transform: {value: 1}, position: {x: 0, y: 0}, rotation: {value: 0}, velocity: {x: 1, y: 1}};
}

function insert(): Benchmark {
  const world = createWorld();
  return {
    run() {
      for (let i = 0; i < Sizes.insert; i++) world.add(fullEntity());
    },
    reset() {
      world.clear();
    },
  };
}

function iterateSmall(): Benchmark {
  const world = createWorld();
  for (let i = 0; i < Sizes.iterateSmall; i++) world.add(fullEntity());
  const movable = world.with('position', 'velocity');
  return {
    run() {
      for (const {position, velocity} of movable) {
        position.x += velocity.x;
        position.y += velocity.y;
      }
    },
  };
}

function iterateLarge(): Benchmark {
  const world = new World<Entity>();
  const groups: ValueKey[][] = [['a'], ['a', 'b'], ['a', 'b', 'c'], ['a', 'b', 'c', 'd'], ['a', 'b', 'c', 'e']];
  const swap = (x: ValueKey, y: ValueKey) => {
    const query = world.with(x, y);
    return () => {
      for (const entity of query) {
        const first = entity[x];
        const second = entity[y];
        const value = first.value;
        first.value = second.value;
        second.value = value;
      }
    };
  };
  const systems = [swap('a', 'b'), swap('c', 'd'), swap('c', 'e')];
  for (const group of groups) {
    for (let i = 0; i < Sizes.iterateLargeGroup; i++) {
      const entity: Entity = {};
      for (const key of group) entity[key] = {value: i};
      world.add(entity);
    }
  }
  return {
    run() {
      for (const system of systems) system();
    },
  };
}

function churn(component: 'velocity' | 'transform'): Benchmark {
  const world = createWorld();
  const entities: Entity[] = [];
  for (let i = 0; i < Sizes.churnEntities; i++) {
    const entity = world.add({position: {x: 0, y: 0}, rotation: {value: 0}});
    if (i < Sizes.churnChanged) entities.push(entity);
  }
  return {
    run() {
      for (const entity of entities) world.addComponent(entity, component, {x: 1, y: 1, value: 1});
      for (const entity of entities) world.removeComponent(entity, component);
    },
  };
}

function spawnDespawn(): Benchmark {
  const world = createWorld();
  let entities: Entity[] = [];
  for (let i = 0; i < Sizes.churnEntities; i++) entities.push(world.add({position: {x: 0, y: 0}, velocity: {x: 1, y: 1}}));
  return {
    run() {
      const spawned: Entity[] = [];
      for (let i = 0; i < Sizes.churnChanged; i++) {
        spawned.push(world.add({position: {x: 0, y: 0}, velocity: {x: 1, y: 1}, rotation: {value: 0}}));
      }
      for (let i = 0; i < Sizes.churnChanged; i++) world.remove(entities[i]);
      entities = entities.slice(Sizes.churnChanged).concat(spawned);
    },
  };
}

function memory(): Benchmark {
  const world = new World<Entity>();
  world.with('position').connect();
  world.with('position', 'velocity').connect();
  world.with('rotation').connect();
  return {
    run() {
      for (let i = 0; i < Sizes.memoryEntities; i++) world.add({position: {x: 0, y: 0}, velocity: {x: 1, y: 1}});
    },
  };
}
