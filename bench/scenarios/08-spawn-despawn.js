'use strict';
const {Position, Velocity, Rotation, addFillerQueries} = require('../components');

const COUNT = 10000;
const CHANGED = 1000;

module.exports = {
  name: 'spawn/despawn',
  description: `add ${CHANGED} new entities and remove ${CHANGED} oldest ones, keeping ${COUNT} entities in engine (11 queries)`,
  setup(tk) {
    const engine = new tk.Engine();
    engine.addQuery(new tk.QueryBuilder().contains(Position, Velocity).build());
    addFillerQueries(tk, engine, 10, [Position, Velocity, Rotation]);
    const entities = [];
    for (let i = 0; i < COUNT; i++) {
      const entity = new tk.Entity().add(new Position()).add(new Velocity());
      entities.push(entity);
      engine.addEntity(entity);
    }
    return {tk, engine, entities};
  },
  run(state) {
    const {tk, engine, entities} = state;
    for (let i = 0; i < CHANGED; i++) {
      const entity = new tk.Entity().add(new Position()).add(new Velocity()).add(new Rotation());
      entities.push(entity);
      engine.addEntity(entity);
    }
    for (let i = 0; i < CHANGED; i++) {
      engine.removeEntity(entities[i]);
    }
    state.entities = entities.slice(CHANGED);
  },
};
