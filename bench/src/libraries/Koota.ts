import {cacheQuery, createWorld, trait, World} from 'koota';
import {Benchmark, ReactionCounter, ScenarioId, Sizes} from '../Scenario';
import {getPackageVersion, Library} from './Library';

interface Vector {
  x: number;
  y: number;
}

interface Value {
  value: number;
}

/**
 * Traits created with a callback store their data as objects (array of structures), the same way other object-based
 * libraries do. Koota also supports struct of arrays traits, which are not used here.
 */
const Position = trait((): Vector => ({x: 0, y: 0}));
const Velocity = trait((): Vector => ({x: 1, y: 1}));
const Rotation = trait((): Value => ({value: 0}));
const Transform = trait((): Value => ({value: 1}));
const [A, B, C, D, E] = Array.from({length: 5}, () => trait((): Value => ({value: 0})));
const fillers = Array.from({length: Sizes.fillerQueries}, () => trait((): Value => ({value: 0})));

type ValueTrait = typeof A;

/**
 * Koota - ECS by Poimandres, entities are numbers, traits are stored per world.
 * Iteration uses `useStores`, which is the fastest way to iterate recommended by koota.
 * Reactions are implemented with query events, which are dispatched after the trait is removed, so values of removed
 * traits are not available and only removals are counted.
 * @see https://github.com/pmndrs/koota
 */
export function createKootaLibrary(): Library {
  return {
    name: 'koota',
    version: getPackageVersion('koota'),
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
 * Creates a world with the main query and filler queries, as other libraries do.
 */
function createBaseWorld(): World {
  const world = createWorld();
  createBaseWorldQueries(world);
  return world;
}

function insert(): Benchmark {
  const world = createBaseWorld();
  return {
    run() {
      for (let i = 0; i < Sizes.insert; i++) world.spawn(Transform, Position, Rotation, Velocity);
    },
    reset() {
      world.reset();
      createBaseWorldQueries(world);
    },
  };
}

/**
 * Registers the queries again after the world is reset
 */
function createBaseWorldQueries(world: World): void {
  const related = [Position, Velocity, Rotation];
  world.query(Position, Velocity);
  fillers.forEach((filler, i) => world.query(related[i % related.length], filler));
}

function iterateSmall(): Benchmark {
  const world = createBaseWorld();
  for (let i = 0; i < Sizes.iterateSmall; i++) world.spawn(Transform, Position, Rotation, Velocity);
  const movable = cacheQuery(Position, Velocity);
  return {
    run() {
      world.query(movable).useStores(([positions, velocities], entities) => {
        for (let i = 0; i < entities.length; i++) {
          const id = entities[i].id();
          const position = positions[id];
          const velocity = velocities[id];
          position.x += velocity.x;
          position.y += velocity.y;
        }
      });
    },
  };
}

function iterateLarge(): Benchmark {
  const world = createWorld();
  const groups = [[A], [A, B], [A, B, C], [A, B, C, D], [A, B, C, E]];
  for (const group of groups) {
    for (let i = 0; i < Sizes.iterateLargeGroup; i++) world.spawn(...group);
  }
  const swap = (x: ValueTrait, y: ValueTrait) => {
    const query = cacheQuery(x, y);
    return () => world.query(query).useStores(([xs, ys], entities) => {
      for (let i = 0; i < entities.length; i++) {
        const id = entities[i].id();
        const first = xs[id];
        const second = ys[id];
        const value = first.value;
        first.value = second.value;
        second.value = value;
      }
    });
  };
  const systems = [swap(A, B), swap(C, D), swap(C, E)];
  return {
    run() {
      for (const system of systems) system();
    },
  };
}

function churn(component: typeof Velocity | typeof Transform): Benchmark {
  const world = createBaseWorld();
  const entities = Array.from({length: Sizes.churnEntities}, () => world.spawn(Position, Rotation)).slice(0, Sizes.churnChanged);
  return {
    run() {
      for (const entity of entities) entity.add(component);
      for (const entity of entities) entity.remove(component);
    },
  };
}

function spawnDespawn(): Benchmark {
  const world = createBaseWorld();
  let entities = Array.from({length: Sizes.churnEntities}, () => world.spawn(Position, Velocity));
  return {
    run() {
      const spawned = Array.from({length: Sizes.churnChanged}, () => world.spawn(Position, Velocity, Rotation));
      for (let i = 0; i < Sizes.churnChanged; i++) entities[i].destroy();
      entities = entities.slice(Sizes.churnChanged).concat(spawned);
    },
  };
}

function reactiveSystem(): Benchmark {
  const world = createWorld();
  const counter = new ReactionCounter();
  world.onQueryAdd([Position, Velocity], (entity) => {
    counter.added++;
    counter.sum += entity.get(Position)!.x;
  });
  world.onQueryRemove([Position, Velocity], () => {
    counter.removed++;
  });
  const entities = Array.from({length: Sizes.churnEntities}, () => world.spawn(Position)).slice(0, Sizes.churnChanged);
  return {
    run() {
      for (const entity of entities) entity.add(Velocity);
      for (const entity of entities) entity.remove(Velocity);
    },
    verify() {
      counter.verify();
    },
  };
}

function memory(): Benchmark {
  const world = createWorld();
  world.query(Position);
  world.query(Position, Velocity);
  world.query(Rotation);
  return {
    run() {
      for (let i = 0; i < Sizes.memoryEntities; i++) world.spawn(Position, Velocity);
    },
  };
}
