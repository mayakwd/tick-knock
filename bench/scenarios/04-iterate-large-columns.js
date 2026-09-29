'use strict';
const {createScheduleWorld} = require('../schedule-world');

module.exports = {
  name: 'iterate large (columns)',
  description: 'the same as "iterate large", but using Query.column',
  supported: (tk) => typeof tk.Query.prototype.column === 'function',
  setup(tk) {
    return createScheduleWorld(tk, (tk, X, Y) => class extends tk.System {
      constructor() {
        super();
        this.query = new tk.QueryBuilder().contains(X, Y).build();
      }

      onAddedToEngine() {
        this.engine.addQuery(this.query);
      }

      update() {
        const xs = this.query.column(X);
        const ys = this.query.column(Y);
        for (let i = 0; i < xs.length; i++) {
          const x = xs[i];
          const y = ys[i];
          const value = x.value;
          x.value = y.value;
          y.value = value;
        }
      }
    });
  },
  run(engine) {
    engine.update(1);
  },
};
