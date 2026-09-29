'use strict';
const {Position, Velocity} = require('../components');

const COUNT = 10000;
const CHANGED = 1000;

module.exports = {
  name: 'reactive system',
  description: `ReactionSystem with entityAdded/entityRemoved handlers, toggle a component on ${CHANGED} of ${COUNT} entities`,
  setup(tk) {
    class CounterSystem extends tk.ReactionSystem {
      constructor() {
        super(new tk.QueryBuilder().contains(Position, Velocity));
        this.added = 0;
        this.removed = 0;
        this.entityAdded = ({current}) => {
          this.added += current.get(Position).x;
        };
        this.entityRemoved = ({previous}) => {
          this.removed += previous.get(Velocity).x;
        };
      }

      update() {}
    }

    const engine = new tk.Engine().addSystem(new CounterSystem());
    const entities = [];
    for (let i = 0; i < COUNT; i++) {
      const entity = new tk.Entity().add(new Position(1));
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
