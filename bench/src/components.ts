import {Sizes} from './Scenario';

/**
 * Plain components, used by libraries that support classes as components.
 */
export class Position {
  public constructor(public x: number = 0, public y: number = 0) {}
}

export class Velocity {
  public constructor(public x: number = 1, public y: number = 1) {}
}

export class Rotation {
  public constructor(public angle: number = 0) {}
}

export class Transform {
  public scale: number = 1;
}

export class Value {
  public constructor(public value: number = 0) {}
}

/**
 * Five distinct components with the same shape for "iterate large" scenario, as in ecs_bench_suite
 */
export class A extends Value {}

export class B extends Value {}

export class C extends Value {}

export class D extends Value {}

export class E extends Value {}

/**
 * Components for additional queries. Entities of scenarios never have them.
 */
export const fillers: ReadonlyArray<typeof Value> = Array.from({length: Sizes.fillerQueries}, () => class Filler extends Value {});

/**
 * Components that filler queries combine with filler components, so queries are related to scenario entities.
 */
export const fillerRelated: ReadonlyArray<typeof Position | typeof Velocity | typeof Rotation> = [Position, Velocity, Rotation];
