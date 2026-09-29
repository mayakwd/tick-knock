'use strict';
// Shared world for "iterate large" scenarios
const {A, B, C, D, E} = require('./components');

const GROUP = 10000;

function createScheduleWorld(tk, createSystem) {
  const engine = new tk.Engine()
    .addSystem(new (createSystem(tk, A, B))())
    .addSystem(new (createSystem(tk, C, D))())
    .addSystem(new (createSystem(tk, C, E))());
  const groups = [[A], [A, B], [A, B, C], [A, B, C, D], [A, B, C, E]];
  for (const group of groups) {
    for (let i = 0; i < GROUP; i++) {
      const entity = new tk.Entity();
      for (const Component of group) entity.add(new Component(i));
      engine.addEntity(entity);
    }
  }
  return engine;
}

module.exports = {createScheduleWorld};
