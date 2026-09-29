'use strict';
const {Position, Velocity, addFillerQueries} = require('../components');

const COUNT = 10000;
const CHANGED = 1000;
const STUNNED = 'stunned';

module.exports = {
  name: 'tag churn',
  description: `add and remove a tag, that changes membership in a query, on ${CHANGED} of ${COUNT} entities (21 queries)`,
  setup(tk) {
    const engine = new tk.Engine();
    engine.addQuery(new tk.QueryBuilder().contains(Position, STUNNED).build());
    addFillerQueries(tk, engine, 20, [Position, Velocity]);
    const entities = [];
    for (let i = 0; i < COUNT; i++) {
      const entity = new tk.Entity().add(new Position()).add(new Velocity());
      entities.push(entity);
      engine.addEntity(entity);
    }
    return {entities: entities.slice(0, CHANGED)};
  },
  run({entities}) {
    for (const entity of entities) entity.add(STUNNED);
    for (const entity of entities) entity.remove(STUNNED);
  },
};
