'use strict';
// Components shared by scenarios

class Position {
  constructor(x = 0, y = 0) {
    this.x = x;
    this.y = y;
  }
}

class Velocity {
  constructor(x = 1, y = 1) {
    this.x = x;
    this.y = y;
  }
}

class Rotation {
  constructor(angle = 0) {
    this.angle = angle;
  }
}

class Transform {
  constructor() {
    this.scale = 1;
  }
}

class Value {
  constructor(value = 0) {
    this.value = value;
  }
}

// Five distinct components with the same shape, as in ecs_bench_suite
class A extends Value {}
class B extends Value {}
class C extends Value {}
class D extends Value {}
class E extends Value {}

// Components that are used by filler queries, so that engine has realistic amount of queries
const Filler = Array.from({length: 20}, (_, i) => ({[`Filler${i}`]: class extends Value {}})[`Filler${i}`]);

/**
 * Adds `count` queries that do not match the main scenario entities, but depend on components they have.
 */
function addFillerQueries(tk, engine, count, related) {
  for (let i = 0; i < count; i++) {
    engine.addQuery(new tk.QueryBuilder().contains(related[i % related.length], Filler[i]).build());
  }
}

module.exports = {Position, Velocity, Rotation, Transform, A, B, C, D, E, Filler, addFillerQueries};
