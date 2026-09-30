/**
 * Identifiers of benchmark scenarios.
 */
export enum ScenarioId {
  Insert = 'insert',
  IterateSmall = 'iterate-small',
  IterateLarge = 'iterate-large',
  ComponentChurn = 'component-churn',
  UnrelatedChurn = 'unrelated-churn',
  TagChurn = 'tag-churn',
  SpawnDespawn = 'spawn-despawn',
  ReactiveSystem = 'reactive-system',
  LinkedComponents = 'linked-components',
  Messages = 'messages',
  Memory = 'memory',
}

/**
 * Speed scenarios are measured in operations per second, memory scenarios in bytes per entity.
 */
export type ScenarioKind = 'speed' | 'memory';

/**
 * Scenario description, shared by all libraries.
 */
export interface Scenario {
  readonly id: ScenarioId;
  readonly name: string;
  readonly description: string;
  readonly kind: ScenarioKind;
}

/**
 * Sizes of the scenarios. Every library must use the same sizes, so results are comparable.
 */
export const Sizes = {
  /** Amount of entities created by one operation of {@link ScenarioId.Insert} */
  insert: 1000,
  /** Amount of entities in {@link ScenarioId.IterateSmall} */
  iterateSmall: 1000,
  /** Amount of entities in each of five groups of {@link ScenarioId.IterateLarge} */
  iterateLargeGroup: 10000,
  /** Amount of entities in the world for churn scenarios */
  churnEntities: 10000,
  /** Amount of entities changed by one operation of churn scenarios */
  churnChanged: 1000,
  /** Amount of additional queries in the world, that make scenarios closer to real projects */
  fillerQueries: 10,
  /** Amount of linked components appended to every entity in {@link ScenarioId.LinkedComponents} */
  linkedPerEntity: 4,
  /** Amount of messages dispatched by one operation of {@link ScenarioId.Messages} */
  messages: 10000,
  /** Amount of message types in {@link ScenarioId.Messages} */
  messageTypes: 10,
  /** Amount of entities created in {@link ScenarioId.Memory} */
  memoryEntities: 50000,
} as const;

/**
 * List of all scenarios in the order they are reported.
 */
export const scenarios: ReadonlyArray<Scenario> = [
  {
    id: ScenarioId.Insert,
    name: 'insert',
    kind: 'speed',
    description: `create ${Sizes.insert} entities with 4 components in a world with ${Sizes.fillerQueries + 1} queries`,
  },
  {
    id: ScenarioId.IterateSmall,
    name: 'iterate small',
    kind: 'speed',
    description: `one update of a system, that adds Velocity to Position of ${Sizes.iterateSmall} entities with 4 components`,
  },
  {
    id: ScenarioId.IterateLarge,
    name: 'iterate large',
    kind: 'speed',
    description: `one update of 3 systems, that swap component values of ${Sizes.iterateLargeGroup * 5 / 1000}k entities ` +
      '(ecs_bench_suite "schedule")',
  },
  {
    id: ScenarioId.ComponentChurn,
    name: 'component churn',
    kind: 'speed',
    description: `add and remove a component, that changes query membership, on ${Sizes.churnChanged} of ` +
      `${Sizes.churnEntities} entities (${Sizes.fillerQueries + 1} queries)`,
  },
  {
    id: ScenarioId.UnrelatedChurn,
    name: 'unrelated churn',
    kind: 'speed',
    description: `add and remove a component, that no query depends on, on ${Sizes.churnChanged} of ` +
      `${Sizes.churnEntities} entities (${Sizes.fillerQueries + 1} queries)`,
  },
  {
    id: ScenarioId.TagChurn,
    name: 'tag churn',
    kind: 'speed',
    description: `add and remove a tag, that changes query membership, on ${Sizes.churnChanged} of ` +
      `${Sizes.churnEntities} entities (${Sizes.fillerQueries + 1} queries)`,
  },
  {
    id: ScenarioId.SpawnDespawn,
    name: 'spawn/despawn',
    kind: 'speed',
    description: `create ${Sizes.churnChanged} entities and remove ${Sizes.churnChanged} oldest ones, keeping ` +
      `${Sizes.churnEntities} entities in the world (${Sizes.fillerQueries + 1} queries)`,
  },
  {
    id: ScenarioId.ReactiveSystem,
    name: 'reactive system',
    kind: 'speed',
    description: `a system reacts on entities added to and removed from its query, toggle a component on ` +
      `${Sizes.churnChanged} of ${Sizes.churnEntities} entities`,
  },
  {
    id: ScenarioId.LinkedComponents,
    name: 'linked components',
    kind: 'speed',
    description: `append ${Sizes.linkedPerEntity} linked components to each of ${Sizes.insert} entities, ` +
      'iterate over them, then withdraw all',
  },
  {
    id: ScenarioId.Messages,
    name: 'messages',
    kind: 'speed',
    description: `dispatch ${Sizes.messages} messages of ${Sizes.messageTypes} types, every type has a subscriber`,
  },
  {
    id: ScenarioId.Memory,
    name: 'memory per entity',
    kind: 'memory',
    description: `memory per entity with 2 components, for ${Sizes.memoryEntities} entities in a world with 3 queries`,
  },
];

/**
 * Benchmark of the scenario, created by a library.
 *
 * Speed scenarios measure the time of {@link run}, {@link reset} is invoked after every run and is not measured.
 * Memory scenarios measure the memory growth caused by a single {@link run}.
 */
export interface Benchmark {
  run(): void | Promise<void>;

  reset?(): void | Promise<void>;

  /**
   * Checks that the first run did what the scenario requires.
   * @throws Error if the result of the run is wrong
   */
  verify?(): void;
}

/**
 * Counts events of {@link ScenarioId.ReactiveSystem} and verifies that every changed entity
 * was reported as added and removed.
 */
export class ReactionCounter {
  public added: number = 0;
  public removed: number = 0;
  /**
   * Sum of component values read in handlers, so reading components is not optimized away
   */
  public sum: number = 0;

  public verify(): void {
    if (this.added !== Sizes.churnChanged || this.removed !== Sizes.churnChanged) {
      throw new Error(`Expected ${Sizes.churnChanged} added and removed entities, got ${this.added} and ${this.removed}`);
    }
  }
}

/**
 * Creates a benchmark. Setup time is not measured.
 */
export type BenchmarkFactory = () => Benchmark | Promise<Benchmark>;

/**
 * Finds scenario by its identifier.
 * @throws Error if scenario is not found
 */
export function getScenario(id: string): Scenario {
  const scenario = scenarios.find((value) => value.id === id);
  if (scenario === undefined) {
    throw new Error(`Unknown scenario "${id}"`);
  }
  return scenario;
}
