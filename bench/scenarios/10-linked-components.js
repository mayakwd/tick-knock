'use strict';

const COUNT = 1000;
const PER_ENTITY = 4;

module.exports = {
  name: 'linked components',
  description: `append ${PER_ENTITY} linked components to each of ${COUNT} entities, iterate over them, then withdraw all`,
  setup(tk) {
    class Damage extends tk.LinkedComponent {
      constructor(value) {
        super();
        this.value = value;
      }
    }

    const engine = new tk.Engine();
    engine.addQuery(new tk.QueryBuilder().contains(Damage).build());
    const entities = [];
    for (let i = 0; i < COUNT; i++) {
      const entity = new tk.Entity();
      entities.push(entity);
      engine.addEntity(entity);
    }
    return {entities, Damage, total: 0};
  },
  run(state) {
    const {entities, Damage} = state;
    for (const entity of entities) {
      for (let i = 0; i < PER_ENTITY; i++) entity.append(new Damage(i));
    }
    for (const entity of entities) {
      entity.iterate(Damage, (damage) => {
        state.total += damage.value;
      });
    }
    for (const entity of entities) {
      while (entity.withdraw(Damage) !== undefined) {
        // withdraw all
      }
    }
  },
};
