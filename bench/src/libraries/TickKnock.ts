import * as fs from 'fs';
import * as path from 'path';
import type * as TickKnockModule from '../../../lib';
import {A, B, C, D, E, fillerRelated, fillers, Position, Rotation, Transform, Velocity} from '../components';
import {Benchmark, ScenarioId, Sizes} from '../Scenario';
import {Library} from './Library';

type TickKnock = typeof TickKnockModule;
type Engine = TickKnockModule.Engine;
type Entity = TickKnockModule.Entity;
type ValueClass = typeof A;

/**
 * Creates adapter for the tick-knock build located at `modulePath`.
 * Build can be either current sources compiled to `lib`, or a published version.
 *
 * @param name Name of the build in the report
 * @param modulePath Path to the directory with `index.js` of the build
 */
export function createTickKnockLibrary(name: string, modulePath: string): Library {
  const tk: TickKnock = require(modulePath);
  const scenarios: Library['scenarios'] = {
    [ScenarioId.Insert]: () => insert(tk),
    [ScenarioId.IterateSmall]: () => iterateSmall(tk),
    [ScenarioId.IterateLarge]: () => iterateLarge(tk),
    [ScenarioId.ComponentChurn]: () => churn(tk, Velocity, (entity) => entity.add(new Velocity())),
    [ScenarioId.UnrelatedChurn]: () => churn(tk, Transform, (entity) => entity.add(new Transform())),
    [ScenarioId.TagChurn]: () => churn(tk, STUNNED, (entity) => entity.add(STUNNED)),
    [ScenarioId.SpawnDespawn]: () => spawnDespawn(tk),
    [ScenarioId.ReactiveSystem]: () => reactiveSystem(tk),
    [ScenarioId.LinkedComponents]: () => linkedComponents(tk),
    [ScenarioId.Messages]: () => messages(tk),
    [ScenarioId.Memory]: () => memory(tk),
  };
  // Columns are available since 5.0.0
  if (typeof tk.Query.prototype.column === 'function') {
    scenarios[ScenarioId.IterateLargeColumns] = () => iterateLargeColumns(tk);
  }
  return {name, version: readVersion(modulePath), scenarios};
}

const STUNNED = 'stunned';

function readVersion(modulePath: string): string {
  const packagePath = path.join(modulePath, '..', 'package.json');
  return JSON.parse(fs.readFileSync(packagePath, 'utf8')).version;
}

/**
 * Creates an engine with the main query and filler queries, as other libraries do.
 *
 * @param tk tick-knock module
 * @param mainQuery Components and tags of the main query
 */
function createEngine(tk: TickKnock, mainQuery: Array<TickKnockModule.Class<unknown> | string> = [Position, Velocity]): Engine {
  const engine = new tk.Engine();
  engine.addQuery(new tk.QueryBuilder().contains(...mainQuery).build());
  fillers.forEach((filler, index) => {
    engine.addQuery(new tk.QueryBuilder().contains(fillerRelated[index % fillerRelated.length], filler).build());
  });
  return engine;
}

function addEntities(engine: Engine, count: number, create: () => Entity): Entity[] {
  const entities: Entity[] = [];
  for (let i = 0; i < count; i++) {
    const entity = create();
    entities.push(entity);
    engine.addEntity(entity);
  }
  return entities;
}

function insert(tk: TickKnock): Benchmark {
  const engine = createEngine(tk);
  return {
    run() {
      for (let i = 0; i < Sizes.insert; i++) {
        engine.addEntity(new tk.Entity()
          .add(new Transform())
          .add(new Position())
          .add(new Rotation())
          .add(new Velocity()));
      }
    },
    reset() {
      engine.removeAllEntities();
    },
  };
}

function iterateSmall(tk: TickKnock): Benchmark {
  class MovementSystem extends tk.IterativeSystem {
    public constructor() {
      super(new tk.QueryBuilder().contains(Position, Velocity));
    }

    protected updateEntity(entity: Entity): void {
      const position = entity.get(Position)!;
      const velocity = entity.get(Velocity)!;
      position.x += velocity.x;
      position.y += velocity.y;
    }
  }

  const engine = new tk.Engine().addSystem(new MovementSystem());
  addEntities(engine, Sizes.iterateSmall, () => new tk.Entity()
    .add(new Transform())
    .add(new Position())
    .add(new Rotation())
    .add(new Velocity()));
  return {
    run() {
      engine.update(1);
    },
  };
}

/**
 * Creates the world of ecs_bench_suite "schedule" scenario with systems created by `createSystem`.
 */
function createScheduleEngine(tk: TickKnock, createSystem: (x: ValueClass, y: ValueClass) => TickKnockModule.System): Engine {
  const engine = new tk.Engine()
    .addSystem(createSystem(A, B))
    .addSystem(createSystem(C, D))
    .addSystem(createSystem(C, E));
  const groups = [[A], [A, B], [A, B, C], [A, B, C, D], [A, B, C, E]];
  for (const group of groups) {
    addEntities(engine, Sizes.iterateLargeGroup, () => {
      const entity = new tk.Entity();
      group.forEach((Component) => entity.add(new Component()));
      return entity;
    });
  }
  return engine;
}

function iterateLarge(tk: TickKnock): Benchmark {
  class SwapSystem extends tk.IterativeSystem {
    public constructor(private readonly x: ValueClass, private readonly y: ValueClass) {
      super(new tk.QueryBuilder().contains(x, y));
    }

    protected updateEntity(entity: Entity): void {
      const x = entity.get(this.x)!;
      const y = entity.get(this.y)!;
      const value = x.value;
      x.value = y.value;
      y.value = value;
    }
  }

  const engine = createScheduleEngine(tk, (x, y) => new SwapSystem(x, y));
  return {
    run() {
      engine.update(1);
    },
  };
}

function iterateLargeColumns(tk: TickKnock): Benchmark {
  class SwapSystem extends tk.System {
    private readonly query: TickKnockModule.Query;

    public constructor(private readonly x: ValueClass, private readonly y: ValueClass) {
      super();
      this.query = new tk.QueryBuilder().contains(x, y).build();
    }

    public onAddedToEngine(): void {
      this.engine.addQuery(this.query);
    }

    public update(): void {
      const xs = this.query.column(this.x);
      const ys = this.query.column(this.y);
      for (let i = 0; i < xs.length; i++) {
        const x = xs[i];
        const y = ys[i];
        const value = x.value;
        x.value = y.value;
        y.value = value;
      }
    }
  }

  const engine = createScheduleEngine(tk, (x, y) => new SwapSystem(x, y));
  return {
    run() {
      engine.update(1);
    },
  };
}

/**
 * Adds and removes the component or tag on the part of entities
 */
function churn(tk: TickKnock, componentOrTag: TickKnockModule.Class<unknown> | string, add: (entity: Entity) => void): Benchmark {
  const engine = createEngine(tk, typeof componentOrTag === 'string' ? [Position, componentOrTag] : [Position, Velocity]);
  const entities = addEntities(engine, Sizes.churnEntities, () => new tk.Entity()
    .add(new Position())
    .add(new Rotation()))
    .slice(0, Sizes.churnChanged);
  return {
    run() {
      for (const entity of entities) add(entity);
      for (const entity of entities) entity.remove(componentOrTag);
    },
  };
}

function spawnDespawn(tk: TickKnock): Benchmark {
  const engine = createEngine(tk);
  let entities = addEntities(engine, Sizes.churnEntities, () => new tk.Entity()
    .add(new Position())
    .add(new Velocity()));
  return {
    run() {
      const spawned = addEntities(engine, Sizes.churnChanged, () => new tk.Entity()
        .add(new Position())
        .add(new Velocity())
        .add(new Rotation()));
      for (let i = 0; i < Sizes.churnChanged; i++) {
        engine.removeEntity(entities[i]);
      }
      entities = entities.slice(Sizes.churnChanged).concat(spawned);
    },
  };
}

function reactiveSystem(tk: TickKnock): Benchmark {
  class CounterSystem extends tk.ReactionSystem {
    public added: number = 0;
    public removed: number = 0;

    public constructor() {
      super(new tk.QueryBuilder().contains(Position, Velocity));
    }

    public update(): void {}

    protected entityAdded = ({current}: TickKnockModule.EntitySnapshot) => {
      this.added += current.get(Position)!.x;
    };

    protected entityRemoved = ({previous}: TickKnockModule.EntitySnapshot) => {
      this.removed += previous.get(Velocity)!.x;
    };
  }

  const engine = new tk.Engine().addSystem(new CounterSystem());
  const entities = addEntities(engine, Sizes.churnEntities, () => new tk.Entity().add(new Position(1)))
    .slice(0, Sizes.churnChanged);
  return {
    run() {
      for (const entity of entities) entity.add(new Velocity());
      for (const entity of entities) entity.remove(Velocity);
    },
  };
}

function linkedComponents(tk: TickKnock): Benchmark {
  class Damage extends tk.LinkedComponent {
    public constructor(public value: number) {
      super();
    }
  }

  const engine = new tk.Engine();
  engine.addQuery(new tk.QueryBuilder().contains(Damage).build());
  const entities = addEntities(engine, Sizes.insert, () => new tk.Entity());
  let total = 0;
  return {
    run() {
      for (const entity of entities) {
        for (let i = 0; i < Sizes.linkedPerEntity; i++) entity.append(new Damage(i));
      }
      for (const entity of entities) {
        entity.iterate(Damage, (damage) => {
          total += damage.value;
        });
      }
      for (const entity of entities) {
        while (entity.withdraw(Damage) !== undefined) {
          // Withdraw all linked components
        }
      }
    },
  };
}

function messages(tk: TickKnock): Benchmark {
  class Message {
    public constructor(public value: number) {}
  }

  class MessengerSystem extends tk.System {
    public update(): void {}

    public send(message: unknown): void {
      this.dispatch(message);
    }
  }

  const types = Array.from({length: Sizes.messageTypes}, () => class extends Message {});
  const system = new MessengerSystem();
  const engine = new tk.Engine().addSystem(system);
  let total = 0;
  types.forEach((type) => engine.subscribe(type, (message: Message) => {
    total += message.value;
  }));
  const list = Array.from({length: Sizes.messages}, (_, i) => new types[i % types.length](i));
  return {
    run() {
      for (let i = 0; i < list.length; i++) system.send(list[i]);
    },
  };
}

function memory(tk: TickKnock): Benchmark {
  const engine = new tk.Engine();
  engine.addQuery(new tk.QueryBuilder().contains(Position).build());
  engine.addQuery(new tk.QueryBuilder().contains(Position, Velocity).build());
  engine.addQuery(new tk.QueryBuilder().contains(Rotation).build());
  return {
    run() {
      for (let i = 0; i < Sizes.memoryEntities; i++) {
        engine.addEntity(new tk.Entity().add(new Position()).add(new Velocity()));
      }
    },
  };
}
