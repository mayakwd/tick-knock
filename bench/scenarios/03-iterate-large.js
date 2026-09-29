'use strict';
const {createScheduleWorld} = require('../schedule-world');

module.exports = {
  name: 'iterate large',
  description: '3 systems swap component values over 50k entities (ecs_bench_suite "schedule"), using entity.get',
  setup(tk) {
    return createScheduleWorld(tk, (tk, X, Y) => class extends tk.IterativeSystem {
      constructor() {
        super(new tk.QueryBuilder().contains(X, Y));
      }

      updateEntity(entity) {
        const x = entity.get(X);
        const y = entity.get(Y);
        const value = x.value;
        x.value = y.value;
        y.value = value;
      }
    });
  },
  run(engine) {
    engine.update(1);
  },
};
