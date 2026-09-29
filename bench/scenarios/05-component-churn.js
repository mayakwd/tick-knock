'use strict';
const {Position, Velocity, Rotation, Transform, addFillerQueries} = require('../components');

const COUNT = 10000;
const CHANGED = 1000;

module.exports = {
  name: 'component churn',
  description: `add and remove a component, that changes membership in queries, on ${CHANGED} of ${COUNT} entities (21 queries)`,
  setup(tk) {
    const engine = new tk.Engine();
    engine.addQuery(new tk.QueryBuilder().contains(Position, Velocity).build());
    addFillerQueries(tk, engine, 20, [Position, Velocity, Rotation]);
    const entities = [];
    for (let i = 0; i < COUNT; i++) {
      const entity = new tk.Entity().add(new Position()).add(new Rotation());
      entities.push(entity);
      engine.addEntity(entity);
    }
    return {entities: entities.slice(0, CHANGED)};
  },
  run({entities}) {
    for (const entity of entities) entity.add(new Velocity());
    for (const entity of entities) entity.remove(Velocity);
  },
};
