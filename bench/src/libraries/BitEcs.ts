import {addComponent, addEntity, commitRemovals, createWorld, observe, onAdd, onRemove, query, removeComponent, removeEntity, World} from 'bitecs';
import {Benchmark, ReactionCounter, ScenarioId, Sizes} from '../Scenario';
import {getPackageVersion, Library} from './Library';

/**
 * Struct of arrays component with a single numeric field
 */
interface ValueComponent {
  value: number[];
}

interface VectorComponent {
  x: number[];
  y: number[];
}

type ComponentRef = object;

function vector(): VectorComponent {
  return {x: [], y: []};
}

function value(): ValueComponent {
  return {value: []};
}

/**
 * bitecs - struct of arrays ECS, components are stored in arrays indexed by entity id.
 * bitecs removes entities from queries lazily, on the next query call. Scenarios that change entities call
 * `commitRemovals` at the end of the operation, so queries are updated as in other libraries.
 * @see https://github.com/NateTheGreatt/bitECS
 */
export function createBitEcsLibrary(): Library {
  return {
    name: 'bitecs',
    version: getPackageVersion('bitecs'),
    scenarios: {
      [ScenarioId.Insert]: insert,
      [ScenarioId.IterateSmall]: iterateSmall,
      [ScenarioId.IterateLarge]: iterateLarge,
      [ScenarioId.ComponentChurn]: () => churn(false),
      [ScenarioId.UnrelatedChurn]: () => churn(true),
      [ScenarioId.SpawnDespawn]: spawnDespawn,
      [ScenarioId.ReactiveSystem]: reactiveSystem,
      [ScenarioId.Memory]: memory,
    },
  };
}

/**
 * Components of a world, that has the main query and filler queries, as other libraries do.
 */
interface BaseWorld {
  world: World;
  Position: VectorComponent;
  Velocity: VectorComponent;
  Rotation: ValueComponent;
  Transform: ValueComponent;
}

function createBaseWorld(): BaseWorld {
  const world = createWorld();
  const components = {world, Position: vector(), Velocity: vector(), Rotation: value(), Transform: value()};
  const related = [components.Position, components.Velocity, components.Rotation];
  // Queries are registered on the first call
  query(world, [components.Position, components.Velocity]);
  for (let i = 0; i < Sizes.fillerQueries; i++) {
    query(world, [related[i % related.length], value()]);
  }
  return components;
}

function spawn(world: World, components: ReadonlyArray<ComponentRef>): number {
  const eid = addEntity(world);
  for (const component of components) addComponent(world, eid, component);
  return eid;
}

function setVector(component: VectorComponent, eid: number, x: number, y: number): void {
  component.x[eid] = x;
  component.y[eid] = y;
}

function insert(): Benchmark {
  const {world, Position, Velocity, Rotation, Transform} = createBaseWorld();
  let entities: number[] = [];
  return {
    run() {
      for (let i = 0; i < Sizes.insert; i++) {
        const eid = spawn(world, [Transform, Position, Rotation, Velocity]);
        setVector(Position, eid, 0, 0);
        setVector(Velocity, eid, 1, 1);
        Rotation.value[eid] = 0;
        Transform.value[eid] = 1;
        entities.push(eid);
      }
    },
    reset() {
      for (const eid of entities) removeEntity(world, eid);
      commitRemovals(world);
      entities = [];
    },
  };
}

function iterateSmall(): Benchmark {
  const {world, Position, Velocity, Rotation, Transform} = createBaseWorld();
  for (let i = 0; i < Sizes.iterateSmall; i++) {
    const eid = spawn(world, [Transform, Position, Rotation, Velocity]);
    setVector(Position, eid, 0, 0);
    setVector(Velocity, eid, 1, 1);
  }
  return {
    run() {
      const entities = query(world, [Position, Velocity]);
      for (let i = 0; i < entities.length; i++) {
        const eid = entities[i];
        Position.x[eid] += Velocity.x[eid];
        Position.y[eid] += Velocity.y[eid];
      }
    },
  };
}

function iterateLarge(): Benchmark {
  const world = createWorld();
  const [A, B, C, D, E] = [value(), value(), value(), value(), value()];
  const groups = [[A], [A, B], [A, B, C], [A, B, C, D], [A, B, C, E]];
  for (const group of groups) {
    for (let i = 0; i < Sizes.iterateLargeGroup; i++) {
      const eid = spawn(world, group);
      for (const component of group) component.value[eid] = i;
    }
  }
  const swap = (x: ValueComponent, y: ValueComponent) => {
    const entities = query(world, [x, y]);
    for (let i = 0; i < entities.length; i++) {
      const eid = entities[i];
      const temp = x.value[eid];
      x.value[eid] = y.value[eid];
      y.value[eid] = temp;
    }
  };
  return {
    run() {
      swap(A, B);
      swap(C, D);
      swap(C, E);
    },
  };
}

function churn(unrelated: boolean): Benchmark {
  const {world, Position, Velocity, Rotation, Transform} = createBaseWorld();
  const changed: number[] = [];
  for (let i = 0; i < Sizes.churnEntities; i++) {
    const eid = spawn(world, [Position, Rotation]);
    if (i < Sizes.churnChanged) changed.push(eid);
  }
  const component = unrelated ? Transform : Velocity;
  return {
    run() {
      for (const eid of changed) addComponent(world, eid, component);
      for (const eid of changed) removeComponent(world, eid, component);
      commitRemovals(world);
    },
  };
}

function spawnDespawn(): Benchmark {
  const {world, Position, Velocity, Rotation} = createBaseWorld();
  let entities: number[] = [];
  for (let i = 0; i < Sizes.churnEntities; i++) entities.push(spawn(world, [Position, Velocity]));
  return {
    run() {
      const spawned: number[] = [];
      for (let i = 0; i < Sizes.churnChanged; i++) spawned.push(spawn(world, [Position, Velocity, Rotation]));
      for (let i = 0; i < Sizes.churnChanged; i++) removeEntity(world, entities[i]);
      commitRemovals(world);
      entities = entities.slice(Sizes.churnChanged).concat(spawned);
    },
  };
}

/**
 * Reactions are implemented with observers of entities that start and stop matching the query
 */
function reactiveSystem(): Benchmark {
  const world = createWorld();
  const Position = vector();
  const Velocity = vector();
  const counter = new ReactionCounter();
  observe(world, onAdd(Position, Velocity), (eid: number) => {
    counter.added++;
    counter.sum += Position.x[eid];
  });
  observe(world, onRemove(Position, Velocity), (eid: number) => {
    counter.removed++;
    counter.sum += Velocity.x[eid];
  });
  const changed: number[] = [];
  for (let i = 0; i < Sizes.churnEntities; i++) {
    const eid = spawn(world, [Position]);
    setVector(Position, eid, 1, 1);
    if (i < Sizes.churnChanged) changed.push(eid);
  }
  return {
    run() {
      for (const eid of changed) {
        addComponent(world, eid, Velocity);
        setVector(Velocity, eid, 1, 1);
      }
      for (const eid of changed) removeComponent(world, eid, Velocity);
      commitRemovals(world);
    },
    verify() {
      counter.verify();
    },
  };
}

function memory(): Benchmark {
  const world = createWorld();
  const Position = vector();
  const Velocity = vector();
  query(world, [Position]);
  query(world, [Position, Velocity]);
  query(world, [value()]);
  return {
    run() {
      for (let i = 0; i < Sizes.memoryEntities; i++) {
        const eid = spawn(world, [Position, Velocity]);
        setVector(Position, eid, 0, 0);
        setVector(Velocity, eid, 1, 1);
      }
    },
  };
}
