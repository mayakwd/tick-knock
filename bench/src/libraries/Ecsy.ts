import {Component, ComponentConstructor, Entity, System, SystemQueries, Types, World} from 'ecsy';
import {Benchmark, ReactionCounter, ScenarioId, Sizes} from '../Scenario';
import {getPackageVersion, Library} from './Library';

class Position extends Component<Position> {
  public static schema = {x: {type: Types.Number, default: 0}, y: {type: Types.Number, default: 0}};
  public x!: number;
  public y!: number;
}

class Velocity extends Component<Velocity> {
  public static schema = {x: {type: Types.Number, default: 1}, y: {type: Types.Number, default: 1}};
  public x!: number;
  public y!: number;
}

class Rotation extends Component<Rotation> {
  public static schema = {angle: {type: Types.Number, default: 0}};
  public angle!: number;
}

class Transform extends Component<Transform> {
  public static schema = {scale: {type: Types.Number, default: 1}};
  public scale!: number;
}

class Value extends Component<Value> {
  public static schema = {value: {type: Types.Number, default: 0}};
  public value!: number;
}

class A extends Value {}

class B extends Value {}

class C extends Value {}

class D extends Value {}

class E extends Value {}

const fillers = Array.from({length: Sizes.fillerQueries}, () => class Filler extends Value {});

type ValueClass = typeof A;
type AnyComponent = ComponentConstructor<any>;

/**
 * ECSY - ECS by Mozilla with components pooling.
 * @see https://github.com/ecsyjs/ecsy
 */
export function createEcsyLibrary(): Library {
  return {
    name: 'ecsy',
    version: getPackageVersion('ecsy'),
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
 * Registers a system that doesn't do anything, but has queries, so the world keeps them up to date
 */
function registerQueries(world: World, queries: SystemQueries): void {
  world.registerSystem(class extends System {
    public static queries = queries;

    public execute(): void {}
  });
}

/**
 * Creates a world with the main query and filler queries, as other libraries do.
 */
function createWorld(): World {
  const world = new World();
  const components: AnyComponent[] = [Position, Velocity, Rotation, Transform, ...fillers];
  for (const component of components) world.registerComponent(component);
  const related: AnyComponent[] = [Position, Velocity, Rotation];
  const queries: SystemQueries = {main: {components: [Position, Velocity]}};
  fillers.forEach((filler, i) => {
    queries[`filler${i}`] = {components: [related[i % related.length], filler]};
  });
  registerQueries(world, queries);
  return world;
}

function spawn(world: World, components: ReadonlyArray<AnyComponent>): Entity {
  const entity = world.createEntity();
  for (const component of components) entity.addComponent(component);
  return entity;
}

function insert(): Benchmark {
  const world = createWorld();
  let entities: Entity[] = [];
  return {
    run() {
      for (let i = 0; i < Sizes.insert; i++) entities.push(spawn(world, [Transform, Position, Rotation, Velocity]));
    },
    reset() {
      for (const entity of entities) entity.remove(true);
      entities = [];
    },
  };
}

function iterateSmall(): Benchmark {
  class MovementSystem extends System {
    public static queries = {movable: {components: [Position, Velocity]}};

    public execute(): void {
      for (const entity of this.queries.movable.results) {
        const position = entity.getMutableComponent(Position)!;
        const velocity = entity.getComponent(Velocity)!;
        position.x += velocity.x;
        position.y += velocity.y;
      }
    }
  }

  const world = createWorld().registerSystem(MovementSystem);
  for (let i = 0; i < Sizes.iterateSmall; i++) spawn(world, [Transform, Position, Rotation, Velocity]);
  return {
    run() {
      world.execute(1, 0);
    },
  };
}

function iterateLarge(): Benchmark {
  const createSystem = (x: ValueClass, y: ValueClass) => class extends System {
    public static queries = {entities: {components: [x, y]}};

    public execute(): void {
      for (const entity of this.queries.entities.results) {
        const first = entity.getMutableComponent(x)!;
        const second = entity.getMutableComponent(y)!;
        const value = first.value;
        first.value = second.value;
        second.value = value;
      }
    }
  };

  const world = new World();
  for (const component of [A, B, C, D, E]) world.registerComponent(component);
  world.registerSystem(createSystem(A, B)).registerSystem(createSystem(C, D)).registerSystem(createSystem(C, E));
  const groups = [[A], [A, B], [A, B, C], [A, B, C, D], [A, B, C, E]];
  for (const group of groups) {
    for (let i = 0; i < Sizes.iterateLargeGroup; i++) spawn(world, group);
  }
  return {
    run() {
      world.execute(1, 0);
    },
  };
}

function churn(component: AnyComponent): Benchmark {
  const world = createWorld();
  const entities: Entity[] = [];
  for (let i = 0; i < Sizes.churnEntities; i++) {
    const entity = spawn(world, [Position, Rotation]);
    if (i < Sizes.churnChanged) entities.push(entity);
  }
  return {
    run() {
      for (const entity of entities) entity.addComponent(component);
      for (const entity of entities) entity.removeComponent(component, true);
    },
  };
}

function spawnDespawn(): Benchmark {
  const world = createWorld();
  let entities: Entity[] = [];
  for (let i = 0; i < Sizes.churnEntities; i++) entities.push(spawn(world, [Position, Velocity]));
  return {
    run() {
      const spawned: Entity[] = [];
      for (let i = 0; i < Sizes.churnChanged; i++) spawned.push(spawn(world, [Position, Velocity, Rotation]));
      for (let i = 0; i < Sizes.churnChanged; i++) entities[i].remove(true);
      entities = entities.slice(Sizes.churnChanged).concat(spawned);
    },
  };
}

/**
 * Reactions are implemented with reactive queries. ECSY collects events until the system is executed, and keeps
 * removed components until the end of the frame, so the world is executed after adding and after removing.
 */
function reactiveSystem(): Benchmark {
  const counter = new ReactionCounter();

  class ReactiveSystem extends System {
    public static queries = {movable: {components: [Position, Velocity], listen: {added: true, removed: true}}};

    public execute(): void {
      for (const entity of this.queries.movable.added!) {
        counter.added++;
        counter.sum += entity.getComponent(Position)!.x;
      }
      for (const entity of this.queries.movable.removed!) {
        counter.removed++;
        counter.sum += entity.getRemovedComponent(Velocity)!.x;
      }
    }
  }

  const world = new World().registerComponent(Position).registerComponent(Velocity).registerSystem(ReactiveSystem);
  const entities: Entity[] = [];
  for (let i = 0; i < Sizes.churnEntities; i++) {
    const entity = spawn(world, [Position]);
    if (i < Sizes.churnChanged) entities.push(entity);
  }
  return {
    run() {
      for (const entity of entities) entity.addComponent(Velocity);
      world.execute(1, 0);
      for (const entity of entities) entity.removeComponent(Velocity);
      world.execute(1, 0);
    },
    verify() {
      counter.verify();
    },
  };
}

function memory(): Benchmark {
  const world = new World();
  const components: AnyComponent[] = [Position, Velocity, Rotation];
  for (const component of components) world.registerComponent(component);
  registerQueries(world, {
    position: {components: [Position]},
    movable: {components: [Position, Velocity]},
    rotation: {components: [Rotation]},
  });
  return {
    run() {
      for (let i = 0; i < Sizes.memoryEntities; i++) spawn(world, [Position, Velocity]);
    },
  };
}
