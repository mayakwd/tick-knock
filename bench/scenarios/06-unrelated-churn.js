'use strict';
const {Position, Velocity, Rotation, Transform, addFillerQueries} = require('../components');

const COUNT = 10000;
const CHANGED = 1000;

module.exports = {
  name: 'unrelated churn',
  description: `add and remove a component, that no query depends on, on ${CHANGED} of ${COUNT} entities (21 queries)`,
  setup(tk) {
    const engine = new tk.Engine();
    engine.addQuery(new tk.QueryBuilder().contains(Position, Velocity).build());
    addFillerQueries(tk, engine, 20, [Position, Velocity, Rotation]);
    const entities = [];
    for (let i = 0; i < COUNT; i++) {
      const entity = new tk.Entity().add(new Position()).add(new Velocity());
      entities.push(entity);
      engine.addEntity(entity);
    }
    return {entities: entities.slice(0, CHANGED)};
  },
  run({entities}) {
    for (const entity of entities) entity.add(new Transform());
    for (const entity of entities) entity.remove(Transform);
  },
};
