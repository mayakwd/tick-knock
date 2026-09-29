'use strict';
const {Position, Velocity, Rotation, Transform} = require('../components');

const COUNT = 1000;

module.exports = {
  name: 'iterate small',
  description: `update IterativeSystem over ${COUNT} entities with 4 components, adding Velocity to Position`,
  setup(tk) {
    class MovementSystem extends tk.IterativeSystem {
      constructor() {
        super(new tk.QueryBuilder().contains(Position, Velocity));
      }

      updateEntity(entity) {
        const position = entity.get(Position);
        const velocity = entity.get(Velocity);
        position.x += velocity.x;
        position.y += velocity.y;
      }
    }

    const engine = new tk.Engine().addSystem(new MovementSystem());
    for (let i = 0; i < COUNT; i++) {
      engine.addEntity(new tk.Entity().add(new Transform()).add(new Position()).add(new Rotation()).add(new Velocity()));
    }
    return engine;
  },
  run(engine) {
    engine.update(1);
  },
};
