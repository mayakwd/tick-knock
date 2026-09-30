import {Engine, Entity, EntitySnapshot, IterativeSystem} from '../../src';

class Position {
  public constructor(public x: number = 0, public y: number = 0) {}
}

class Velocity {
  public constructor(public x: number = 1, public y: number = 1) {}
}

class Health {
  public constructor(public value: number = 100) {}
}

const FROZEN = 'frozen';

describe('Functional iterative system', () => {
  it('Updates entities with inferred components, skipping tags', () => {
    const engine = new Engine().iterative([Position, FROZEN, Velocity], (entity, dt, position, velocity) => {
      position.x += velocity.x * dt;
      position.y += velocity.y * dt;
    });
    const frozen = new Entity().add(new Position()).add(new Velocity(2, 3)).add(FROZEN);
    const moving = new Entity().add(new Position()).add(new Velocity());
    engine.addEntity(frozen).addEntity(moving);
    engine.update(2);
    expect(frozen.get(Position)).toEqual(new Position(4, 6));
    expect(moving.get(Position)).toEqual(new Position(0, 0));
  });

  it('Updates systems in the order of priority', () => {
    const order: string[] = [];
    const engine = new Engine()
      .iterative([Position], () => order.push('late'), {priority: 10})
      .iterative([Position], () => order.push('early'), {priority: -10})
      .iterative([Position], () => order.push('default'));
    engine.addEntity(new Entity().add(new Position()));
    engine.update(1);
    expect(order).toEqual(['early', 'default', 'late']);
  });

  it('Checks types of components', () => {
    const engine = new Engine();
    // @ts-expect-error components are passed in the order they were specified
    engine.iterative([Position, Health], (entity: Entity, dt: number, health: Health) => undefined);
    expect(engine.systems.length).toBe(1);
  });
});

describe('Functional reaction system', () => {
  it('Reacts on added and removed entities with their components', () => {
    const log: Array<[string, Entity, Position, Health]> = [];
    const engine = new Engine().reactive([Position, Health], {
      added: ({current}, position, health) => log.push(['added', current, position, health]),
      removed: ({current}, position, health) => log.push(['removed', current, position, health]),
    });
    const position = new Position();
    const health = new Health();
    const entity = new Entity().add(position).add(health);
    engine.addEntity(entity);
    entity.remove(Health);
    expect(log).toEqual([['added', entity, position, health], ['removed', entity, position, health]]);
  });

  it('Handlers are optional', () => {
    let removed = 0;
    const engine = new Engine().reactive([Position], {removed: () => removed++});
    const entity = new Entity().add(new Position());
    engine.addEntity(entity).removeEntity(entity);
    expect(removed).toBe(1);
  });
});

describe('System identifiers', () => {
  class CounterSystem extends IterativeSystem.of(Position) {
    public count = 0;

    protected updateEntity(): void {
      this.count++;
    }
  }

  it('Finds and removes a system by identifier', () => {
    const system = new CounterSystem();
    const engine = new Engine()
      .addSystem(system, {id: 'counter', priority: 5})
      .iterative([Position], () => undefined, {id: 'movement'});
    expect(engine.getSystemById('counter')).toBe(system);
    expect(system.id).toBe('counter');
    expect(system.priority).toBe(5);
    engine.removeSystem('counter').removeSystem('movement');
    expect(engine.systems.length).toBe(0);
    expect(engine.getSystemById('counter')).toBeUndefined();
    expect(system.id).toBeUndefined();
  });

  it('Removing a system by instance releases its identifier', () => {
    const system = new CounterSystem();
    const engine = new Engine().addSystem(system, {id: 'counter'});
    engine.removeSystem(system);
    expect(engine.getSystemById('counter')).toBeUndefined();
    expect(() => engine.addSystem(new CounterSystem(), {id: 'counter'})).not.toThrow();
  });

  it('Throws if identifier is already used', () => {
    const engine = new Engine().iterative([Position], () => undefined, {id: 'system'});
    expect(() => engine.iterative([Position], () => undefined, {id: 'system'})).toThrow();
  });

  it('Removing unknown identifier does nothing', () => {
    const engine = new Engine().addSystem(new CounterSystem());
    engine.removeSystem('unknown');
    expect(engine.systems.length).toBe(1);
  });

  it('Removing all systems releases identifiers', () => {
    const engine = new Engine().iterative([Position], () => undefined, {id: 'system'});
    engine.removeAllSystems();
    expect(engine.getSystemById('system')).toBeUndefined();
  });
});

describe('Reaction handlers typing', () => {
  it('Snapshot is passed to handlers', () => {
    const snapshots: EntitySnapshot[] = [];
    const engine = new Engine().reactive([Position], {added: (snapshot) => snapshots.push(snapshot)});
    engine.addEntity(new Entity().add(new Position()));
    expect(snapshots.length).toBe(1);
  });
});
