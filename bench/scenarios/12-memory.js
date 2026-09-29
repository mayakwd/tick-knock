'use strict';
const {Position, Velocity, Rotation} = require('../components');

const COUNT = 50000;

module.exports = {
  name: 'memory per entity',
  kind: 'memory',
  count: COUNT,
  description: `heap size per entity with 2 components, for ${COUNT} entities in an engine with 3 queries`,
  setup(tk) {
    const engine = new tk.Engine();
    engine.addQuery(new tk.QueryBuilder().contains(Position).build());
    engine.addQuery(new tk.QueryBuilder().contains(Position, Velocity).build());
    engine.addQuery(new tk.QueryBuilder().contains(Rotation).build());
    for (let i = 0; i < COUNT; i++) {
      engine.addEntity(new tk.Entity().add(new Position()).add(new Velocity()));
    }
    return engine;
  },
};
