import {Component, ComponentClass, Engine, Entity, World} from 'geotic';
import {Benchmark, ReactionCounter, ScenarioId, Sizes} from '../Scenario';
import {getPackageVersion, Library} from './Library';

class Position extends Component {
  public static properties = {x: 0, y: 0};
}

class Velocity extends Component {
  public static properties = {x: 1, y: 1};
}

class Rotation extends Component {
  public static properties = {value: 0};
}

class Transform extends Component {
  public static properties = {value: 1};
}

class Value extends Component {
  public static properties = {value: 0};
}

class A extends Value {}

class B extends Value {}

class C extends Value {}

class D extends Value {}

class E extends Value {}

/**
 * geotic accesses components by camel cased class names, so every filler class gets its own name
 */
const fillers: ComponentClass[] = Array.from({length: Sizes.fillerQueries}, (_, i) => {
  const filler = class extends Value {};
  Object.defineProperty(filler, 'name', {value: `Filler${i}`});
  return filler;
});

/**
 * Accessor names of components, as geotic generates them
 */
const keys = new Map<ComponentClass, string>([[A, 'a'], [B, 'b'], [C, 'c'], [D, 'd'], [E, 'e']]);

/**
 * geotic - ECS for roguelikes, components are class instances with events and lifecycle methods.
 * Query events are dispatched after the component is removed, so values of removed components are not available
 * and only removals are counted.
 * @see https://github.com/ddmills/geotic
 */
export function createGeoticLibrary(): Library {
  return {
    name: 'geotic',
    version: getPackageVersion('geotic'),
    scenarios: {
      [ScenarioId.Insert]: insert,
      [ScenarioId.IterateSmall]: iterateSmall,
      [ScenarioId.IterateLarge]: iterateLarge,
      [ScenarioId.ComponentChurn]: () => churn(Velocity, 'velocity'),
      [ScenarioId.UnrelatedChurn]: () => churn(Transform, 'transform'),
      [ScenarioId.SpawnDespawn]: spawnDespawn,
      [ScenarioId.ReactiveSystem]: reactiveSystem,
      [ScenarioId.Memory]: memory,
    },
  };
}

function createEngine(components: ComponentClass[]): World {
  const engine = new Engine();
  components.forEach((component) => engine.registerComponent(component));
  return engine.createWorld();
}

/**
 * Creates a world with the main query and filler queries, as other libraries do.
 */
function createBaseWorld(): World {
  const world = createEngine([Position, Velocity, Rotation, Transform, ...fillers]);
  const related = [Position, Velocity, Rotation];
  world.createQuery({all: [Position, Velocity]});
  fillers.forEach((filler, i) => world.createQuery({all: [related[i % related.length], filler]}));
  return world;
}

function spawn(world: World, components: ReadonlyArray<ComponentClass>): Entity {
  const entity = world.createEntity();
  for (const component of components) entity.add(component);
  return entity;
}

function insert(): Benchmark {
  const world = createBaseWorld();
  return {
    run() {
      for (let i = 0; i < Sizes.insert; i++) spawn(world, [Transform, Position, Rotation, Velocity]);
    },
    reset() {
      world.destroyEntities();
    },
  };
}

function iterateSmall(): Benchmark {
  const world = createBaseWorld();
  for (let i = 0; i < Sizes.iterateSmall; i++) spawn(world, [Transform, Position, Rotation, Velocity]);
  const movable = world.createQuery({all: [Position, Velocity]});
  return {
    run() {
      for (const entity of movable.get()) {
        const {position, velocity} = entity;
        position.x += velocity.x;
        position.y += velocity.y;
      }
    },
  };
}

function iterateLarge(): Benchmark {
  const world = createEngine([A, B, C, D, E]);
  const swap = (x: ComponentClass, y: ComponentClass) => {
    const query = world.createQuery({all: [x, y]});
    const [first, second] = [keys.get(x)!, keys.get(y)!];
    return () => {
      for (const entity of query.get()) {
        const a = entity[first];
        const b = entity[second];
        const value = a.value;
        a.value = b.value;
        b.value = value;
      }
    };
  };
  const systems = [swap(A, B), swap(C, D), swap(C, E)];
  const groups = [[A], [A, B], [A, B, C], [A, B, C, D], [A, B, C, E]];
  for (const group of groups) {
    for (let i = 0; i < Sizes.iterateLargeGroup; i++) spawn(world, group);
  }
  return {
    run() {
      for (const system of systems) system();
    },
  };
}

function churn(component: ComponentClass, key: string): Benchmark {
  const world = createBaseWorld();
  const entities = Array.from({length: Sizes.churnEntities}, () => spawn(world, [Position, Rotation])).slice(0, Sizes.churnChanged);
  return {
    run() {
      for (const entity of entities) entity.add(component);
      for (const entity of entities) entity.remove(entity[key]);
    },
  };
}

function spawnDespawn(): Benchmark {
  const world = createBaseWorld();
  let entities = Array.from({length: Sizes.churnEntities}, () => spawn(world, [Position, Velocity]));
  return {
    run() {
      const spawned = Array.from({length: Sizes.churnChanged}, () => spawn(world, [Position, Velocity, Rotation]));
      for (let i = 0; i < Sizes.churnChanged; i++) entities[i].destroy();
      entities = entities.slice(Sizes.churnChanged).concat(spawned);
    },
  };
}

function reactiveSystem(): Benchmark {
  const world = createEngine([Position, Velocity]);
  const counter = new ReactionCounter();
  const movable = world.createQuery({all: [Position, Velocity]});
  movable.onEntityAdded((entity) => {
    counter.added++;
    counter.sum += entity.position.x;
  });
  movable.onEntityRemoved(() => {
    counter.removed++;
  });
  const entities = Array.from({length: Sizes.churnEntities}, () => spawn(world, [Position])).slice(0, Sizes.churnChanged);
  return {
    run() {
      for (const entity of entities) entity.add(Velocity);
      for (const entity of entities) entity.remove(entity.velocity);
    },
    verify() {
      counter.verify();
    },
  };
}

function memory(): Benchmark {
  const world = createEngine([Position, Velocity, Rotation]);
  world.createQuery({all: [Position]});
  world.createQuery({all: [Position, Velocity]});
  world.createQuery({all: [Rotation]});
  return {
    run() {
      for (let i = 0; i < Sizes.memoryEntities; i++) spawn(world, [Position, Velocity]);
    },
  };
}
