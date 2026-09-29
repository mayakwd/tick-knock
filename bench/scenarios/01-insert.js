'use strict';
const {Position, Velocity, Rotation, Transform, addFillerQueries} = require('../components');

const COUNT = 1000;

module.exports = {
  name: 'insert',
  description: `create ${COUNT} entities with 4 components and add them to an engine with 10 queries`,
  setup(tk) {
    const engine = new tk.Engine();
    engine.addQuery(new tk.QueryBuilder().contains(Position, Velocity).build());
    addFillerQueries(tk, engine, 9, [Position, Velocity, Rotation, Transform]);
    return {tk, engine};
  },
  run({tk, engine}) {
    for (let i = 0; i < COUNT; i++) {
      engine.addEntity(new tk.Entity()
        .add(new Transform())
        .add(new Position())
        .add(new Rotation())
        .add(new Velocity()));
    }
  },
  reset({engine}) {
    engine.removeAllEntities();
  },
};
