import {Component, Entity, Query, System, World} from 'ape-ecs';
import {Benchmark, ReactionCounter, ScenarioId, Sizes} from '../Scenario';
import {getPackageVersion, Library} from './Library';

class Position extends Component {
  public static properties = {x: 0, y: 0};
}

class Velocity extends Component {
  public static properties = {x: 1, y: 1};
}

class Rotation extends Component {
  public static properties = {angle: 0};
}

class Transform extends Component {
  public static properties = {scale: 1};
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
 * Ape-ECS uses class name as a component type, so every filler class gets its own type name
 */
const fillers = Array.from({length: Sizes.fillerQueries}, (_, i) => class extends Value {
  public static typeName = `Filler${i}`;
});

const FRAME = 'frame';

/**
 * Ape-ECS - ECS with entity references, queries and change tracking.
 * Ape-ECS updates queries lazily, on `world.tick()` or before systems run. Scenarios that change entities call
 * `world.updateIndexes()` at the end of the operation, so queries are updated as in other libraries.
 * @see https://github.com/fritzy/ape-ecs
 */
export function createApeEcsLibrary(): Library {
  return {
    name: 'Ape-ECS',
    version: getPackageVersion('ape-ecs'),
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

function typeOf(component: typeof Component): string {
  return component.typeName ?? component.name;
}

/**
 * Creates a world with the main query and filler queries, as other libraries do.
 */
function createWorld(): World {
  const world = new World();
  for (const component of [Position, Velocity, Rotation, Transform, ...fillers]) world.registerComponent(component);
  const related = [Position, Velocity, Rotation];
  world.createQuery().fromAll(typeOf(Position), typeOf(Velocity)).persist();
  fillers.forEach((filler, i) => world.createQuery().fromAll(typeOf(related[i % related.length]), typeOf(filler)).persist());
  return world;
}

/**
 * Creates an entity with components, every component is accessible by its type name as `entity.c[type]`
 */
function spawn(world: World, components: ReadonlyArray<typeof Component>): Entity {
  const c: Record<string, {type: string}> = {};
  for (const component of components) c[typeOf(component)] = {type: typeOf(component)};
  return world.createEntity({c});
}

function insert(): Benchmark {
  const world = createWorld();
  let entities: Entity[] = [];
  return {
    run() {
      for (let i = 0; i < Sizes.insert; i++) entities.push(spawn(world, [Transform, Position, Rotation, Velocity]));
      world.updateIndexes();
    },
    reset() {
      for (const entity of entities) entity.destroy();
      world.updateIndexes();
      entities = [];
    },
  };
}

function iterateSmall(): Benchmark {
  class MovementSystem extends System {
    private query!: Query;

    public init(): void {
      this.query = this.createQuery().fromAll(typeOf(Position), typeOf(Velocity)).persist();
    }

    public update(): void {
      for (const entity of this.query.execute()) {
        const position = entity.c.Position;
        const velocity = entity.c.Velocity;
        position.x += velocity.x;
        position.y += velocity.y;
      }
    }
  }

  const world = createWorld();
  world.registerSystem(FRAME, MovementSystem);
  for (let i = 0; i < Sizes.iterateSmall; i++) spawn(world, [Transform, Position, Rotation, Velocity]);
  return {
    run() {
      world.runSystems(FRAME);
    },
  };
}

function iterateLarge(): Benchmark {
  const createSystem = (x: string, y: string) => class extends System {
    private query!: Query;

    public init(): void {
      this.query = this.createQuery().fromAll(x, y).persist();
    }

    public update(): void {
      for (const entity of this.query.execute()) {
        const first = entity.c[x];
        const second = entity.c[y];
        const value = first.value;
        first.value = second.value;
        second.value = value;
      }
    }
  };

  const world = new World();
  for (const component of [A, B, C, D, E]) world.registerComponent(component);
  world.registerSystem(FRAME, createSystem('A', 'B'));
  world.registerSystem(FRAME, createSystem('C', 'D'));
  world.registerSystem(FRAME, createSystem('C', 'E'));
  const groups = [[A], [A, B], [A, B, C], [A, B, C, D], [A, B, C, E]];
  for (const group of groups) {
    for (let i = 0; i < Sizes.iterateLargeGroup; i++) spawn(world, group);
  }
  return {
    run() {
      world.runSystems(FRAME);
    },
  };
}

function churn(component: typeof Component): Benchmark {
  const world = createWorld();
  const entities: Entity[] = [];
  for (let i = 0; i < Sizes.churnEntities; i++) {
    const entity = spawn(world, [Position, Rotation]);
    if (i < Sizes.churnChanged) entities.push(entity);
  }
  const type = typeOf(component);
  return {
    run() {
      for (const entity of entities) entity.addComponent({type, key: type});
      world.updateIndexes();
      for (const entity of entities) entity.removeComponent(type);
      world.updateIndexes();
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
      for (let i = 0; i < Sizes.churnChanged; i++) entities[i].destroy();
      world.updateIndexes();
      entities = entities.slice(Sizes.churnChanged).concat(spawned);
    },
  };
}

/**
 * Reactions are implemented with a persisted query that tracks added and removed entities. Ape-ECS destroys removed
 * components, so values of removed components are not available and only removals are counted.
 */
function reactiveSystem(): Benchmark {
  const counter = new ReactionCounter();

  class ReactiveSystem extends System {
    private query!: Query;

    public init(): void {
      this.query = this.createQuery().fromAll(typeOf(Position), typeOf(Velocity)).persist(true, true);
    }

    public update(): void {
      for (const entity of this.query.added) {
        counter.added++;
        counter.sum += entity.c.Position.x;
      }
      counter.removed += this.query.removed.size;
    }
  }

  const world = new World();
  world.registerComponent(Position);
  world.registerComponent(Velocity);
  world.registerSystem(FRAME, ReactiveSystem);
  const entities: Entity[] = [];
  for (let i = 0; i < Sizes.churnEntities; i++) {
    const entity = spawn(world, [Position]);
    if (i < Sizes.churnChanged) entities.push(entity);
  }
  const type = typeOf(Velocity);
  return {
    run() {
      for (const entity of entities) entity.addComponent({type, key: type});
      world.runSystems(FRAME);
      world.tick();
      for (const entity of entities) entity.removeComponent(type);
      world.runSystems(FRAME);
      world.tick();
    },
    verify() {
      counter.verify();
    },
  };
}

function memory(): Benchmark {
  const world = new World();
  for (const component of [Position, Velocity, Rotation]) world.registerComponent(component);
  world.createQuery().fromAll(typeOf(Position)).persist();
  world.createQuery().fromAll(typeOf(Position), typeOf(Velocity)).persist();
  world.createQuery().fromAll(typeOf(Rotation)).persist();
  return {
    run() {
      for (let i = 0; i < Sizes.memoryEntities; i++) spawn(world, [Position, Velocity]);
      world.updateIndexes();
    },
  };
}
