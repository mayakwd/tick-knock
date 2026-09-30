import {Engine, Entity, IterativeSystem, LinkedComponent, Query, QueryBuilder, QueryPredicate, System, ReactionSystem } from '../../src';

class Component {}

class Message {}

const handler1 = (message: Message) => {};
const handler2 = (message: Message) => {};
const handler3 = (message: Message) => {};

abstract class TestSystem extends IterativeSystem {
  protected constructor(
    query: Query | QueryBuilder | QueryPredicate,
    private readonly arr?: number[],
  ) {
    super(query);
    this.arr = arr;
  }

  public update(dt: number) {
    super.update(dt);
    if (this.arr !== undefined) {
      this.arr.push(this.priority);
    }
  }

  protected updateEntity(entity: Entity, dt: number): void {
  }
}

class TestSystem1 extends TestSystem {
  public constructor(arr?: number[]) {
    super(new Query((entity: Entity) => entity.has(Component)), arr);
  }
}

class TestSystem2 extends TestSystem {
  public constructor(arr?: number[]) {
    super((entity: Entity) => entity.has(Component), arr);
  }
}

class TestSystem3 extends TestSystem {
  public constructor(arr?: number[]) {
    super(new QueryBuilder().with(Component), arr);
  }
}

describe('System manipulation', () => {
  it('Engine system creating', () => {
    const engine = new Engine();
    expect(engine.systems).toBeDefined();
    expect(engine.systems.length).toBe(0);
    expect(engine.entities).toBeDefined();
    expect(engine.entities.length).toBe(0);
    expect(engine.queries).toBeDefined();
    expect(engine.queries.length).toBe(0);
  });

  it('Adding system', () => {
    const engine = new Engine();
    const system = new TestSystem1();

    engine.addSystem(system);

    expect(engine.systems.length).toBe(1);
    expect(engine.getSystem(TestSystem1)).toBe(system);
  });

  it('Adding and removing multiple system with priority', () => {
    const engine = new Engine();
    const system1 = new TestSystem1();
    const system2 = new TestSystem2();
    const system3 = new TestSystem3();

    engine.addSystem(system1, 200);
    engine.addSystem(system2, 300);
    engine.addSystem(system3, 100);

    expect(engine.systems.length).toBe(3);
    expect(engine.getSystem(TestSystem1)).toBe(system1);
    expect(engine.getSystem(TestSystem2)).toBe(system2);
    expect(engine.getSystem(TestSystem3)).toBe(system3);
    expect(engine.systems).toEqual([system3, system1, system2]);

    engine.removeAllSystems();

    expect(engine.systems.length).toBe(0);
  });

  it('Adding multiple systems with same priority must added in same order', () => {
    const engine = new Engine();
    const system1 = new TestSystem1();
    const system2 = new TestSystem2();
    const system3 = new TestSystem3();

    engine.addSystem(system1);
    engine.addSystem(system2);
    engine.addSystem(system3);

    expect(engine.systems.length).toBe(3);
    expect(engine.systems).toEqual([system1, system2, system3]);
  });

  it('Remove system', () => {
    const engine = new Engine();
    const system = new TestSystem1();

    engine.addSystem(system);

    expect(engine.systems.length).toBe(1);
    expect(engine.getSystem(TestSystem1)).toBe(system);

    engine.removeSystem(system);

    expect(engine.systems.length).toBe(0);
    expect(engine.getSystem(TestSystem1)).toBeUndefined();
  });

  it(`Expected that removing not attached system will not throw an error`, () => {
    const engine = new Engine();
    const system = new TestSystem1();
    expect(() => { engine.removeSystem(system);}).not.toThrow();
  });

  it('Engine updating', () => {
    const engine = new Engine();
    const arr: number[] = [];
    const system1 = new TestSystem1(arr);
    const system2 = new TestSystem2(arr);
    const system3 = new TestSystem3(arr);

    engine.addSystem(system1, 1);
    engine.addSystem(system2, 2);
    engine.addSystem(system3, 3);

    engine.update(1);
    expect(arr).toEqual([1, 2, 3]);
  });

  it('Engine#clear should remove entities, systems, remove and clear queries', () => {
    class TestSystem extends IterativeSystem {
      public constructor() {
        super(new Query(entity => true));
      }

      protected updateEntity(entity: Entity, dt: number): void {
      }
    }

    const engine = new Engine();
    const query = new Query(entity => entity.has(Component));
    const system = new TestSystem();

    engine.addQuery(query);
    engine.addSystem(system);
    engine.addEntity(new Entity().add(new Component()));

    expect(query.isEmpty).toBeFalsy();

    engine.clear();
    expect(engine.systems.length).toBe(0);
    expect(engine.queries.length).toBe(0);
    expect(engine.entities.length).toBe(0);
    expect(query.isEmpty).toBeTruthy();

    engine.addEntity(new Entity().add(new Component()));
    expect(query.isEmpty).toBeTruthy();
  });

  it('Expected that removing all entities will fire onEntityRemoved', () => {
    const engine = new Engine();
    const entitiesCount = 2;
    let removedCount = 0;
    for (let i = 0; i < entitiesCount; i++) {
      engine.addEntity(new Entity());
    }
    engine.onEntityRemoved.connect(() => removedCount++);
    engine.removeAllEntities();
    expect(engine.entities.length).toBe(0);
    expect(removedCount).toBe(entitiesCount);
  });

  it(`Expected that engine will not add same handler twice for the same message`, () => {
    const engine = new Engine();
    const handler = (message: Message) => {};
    const subscription1 = engine.subscribe(Message, handler);
    const subscription2 = engine.subscribe(Message, handler);
    expect(subscription1).toBe(subscription2);
  });

  it(`Expected that unsubscribe removes specific subscription`, () => {
    const engine = new Engine();
    engine.subscribe(Message, handler1);
    engine.subscribe(Message, handler2);
    engine.subscribe(Message, handler3);
    expect(engine.subscriptions.length).toBe(3);
    engine.unsubscribe(Message, handler1);
    expect(engine.subscriptions.length).toBe(2);
  });

  it(`Expected that unsubscribe removes all relevant subscriptions`, () => {
    const engine = new Engine();
    engine.subscribe(Message, handler1);
    engine.subscribe(Message, handler2);
    engine.subscribe(Message, handler3);
    expect(engine.subscriptions.length).toBe(3);
    engine.unsubscribe(Message);
    expect(engine.subscriptions.length).toBe(0);
  });

  it(`Expected that unsubscribeAll removes all subscriptions`, () => {
    const engine = new Engine();
    engine.subscribe(Message, handler1);
    engine.subscribe(Message, handler2);
    engine.subscribe(Message, handler3);
    expect(engine.subscriptions.length).toBe(3);
    engine.unsubscribeAll();
    expect(engine.subscriptions.length).toBe(0);
  });

  it(`Expected that system\`s message will be delivered through the engine to the handler`, () => {
    const HERO = 'hero';
    const GAME_OVER = 'gameOver';

    class GameOverSystem extends ReactionSystem {
      private dispatched: boolean = false;

      public constructor() {
        super((entity: Entity) => entity.has(HERO));
      }

      public update(dt: number) {
        if (this.dispatched) return;

        if (!this.query.isEmpty && !this.dispatched) {
          this.dispatch(GAME_OVER);
          this.dispatched = true;
        }
      }

      protected prepare() {
        this.dispatched = false;
      }
    }

    let gameOverReceived = false;
    const engine = new Engine();
    const system = new GameOverSystem();
    engine.subscribe(GAME_OVER, () => { gameOverReceived = true; });
    engine.addSystem(system);
    engine.addEntity(new Entity().add(HERO));
    engine.addEntity(new Entity().add(HERO));
    engine.update(1);
    engine.removeAllEntities();
    engine.update(1);
    expect(gameOverReceived).toBeTruthy();
  });

  it(`Expected that system\`s message will be delivered through the engine to the handler`, () => {
    const HERO = 'hero';

    class GameOver {}

    class OtherMessage {}

    class GameOverSystem extends ReactionSystem {
      private dispatched: boolean = false;

      public constructor() {
        super((entity: Entity) => entity.has(HERO));
      }

      public update(dt: number) {
        if (this.dispatched) return;

        if (!this.query.isEmpty && !this.dispatched) {
          this.dispatch(new GameOver());
          this.dispatched = true;
        }
      }

      protected prepare() {
        this.dispatched = false;
      }
    }

    let gameOverReceived = false;
    let otherMessageReceived = false;
    const engine = new Engine();
    const system = new GameOverSystem();
    engine.subscribe(GameOver, () => { gameOverReceived = true; });
    engine.subscribe(OtherMessage, () => { otherMessageReceived = true; });
    engine.addSystem(system);
    engine.addEntity(new Entity().add(HERO));
    engine.addEntity(new Entity().add(HERO));
    engine.update(1);
    engine.removeAllEntities();
    engine.update(1);
    expect(gameOverReceived).toBeTruthy();
    expect(otherMessageReceived).toBeFalsy();
  });

  it(`Expected that removing of not attached query will not throw an error`, () => {
    const TAG = 1;
    const query = new Query((entity: Entity) => entity.has(TAG));
    const engine = new Engine();
    expect(() => {engine.removeQuery(query);}).not.toThrow();
  });

  it(`Expected that adding the same entity twice will add it only once`, () => {
    const entity = new Entity();
    const engine = new Engine();
    engine.addEntity(entity);
    engine.addEntity(entity);
    expect(engine.entities.length).toBe(1);
  });

  it(`Expected that removing an entity that wasn't added to engine will do nothing`, () => {
    const entity1 = new Entity();
    const entity2 = new Entity();
    const engine = new Engine();
    engine.addEntity(entity1);
    engine.removeEntity(entity2);
    let entityRemovedCount = 0;
    engine.onEntityRemoved.connect((entity) => {
      entityRemovedCount++;
    });
    expect(engine.entities.length).toBe(1);
    expect(engine.entities[0]).toBe(entity1);
    expect(entityRemovedCount).toBe(0);
  });

  it('Getting entity by id from engine should success if entity is in the engine', () => {
    const engine = new Engine();
    const entity = new Entity();
    const id = entity.id;
    engine.addEntity(entity);
    expect(engine.getEntityById(id)).toBe(entity);
  });

  it('Getting entity by id from engine should fail if entity is not in the engine', () => {
    const engine = new Engine();
    const entity = new Entity();
    const id = entity.id;
    engine.addEntity(entity);
    engine.removeEntity(entity);
    expect(engine.getEntityById(id)).toBeUndefined();
  });
});

describe('Changing entities in handlers', () => {
  class Marker {}

  class View {}

  it('Expected that components added by handlers of added entities update predicate queries', () => {
    const engine = new Engine();
    const views = new Query((entity) => entity.has(View));
    const markers = new QueryBuilder().with(Marker).build();
    engine.addQuery(views).addQuery(markers);
    markers.onEntityAdded.connect(({current}) => current.add(new View()));

    const entity = new Entity().add(new Marker());
    engine.addEntity(entity);

    expect(views.entities).toEqual([entity]);
  });

  it('Expected that components added by handlers of added entities update queries added before', () => {
    const engine = new Engine();
    const views = new QueryBuilder().with(View).build();
    const markers = new QueryBuilder().with(Marker).build();
    engine.addQuery(views).addQuery(markers);
    markers.onEntityAdded.connect(({current}) => current.add(new View()));
    const added: Entity[] = [];
    views.onEntityAdded.connect(({current}) => added.push(current));

    const entity = new Entity().add(new Marker());
    engine.addEntity(entity);

    expect(views.entities).toEqual([entity]);
    expect(added).toEqual([entity]);
  });

  it('Expected that changes made by handlers of removed entities don\'t add them back to queries', () => {
    const engine = new Engine();
    const any = new Query(() => true);
    const markers = new QueryBuilder().with(Marker).build();
    engine.addQuery(any).addQuery(markers);
    markers.onEntityRemoved.connect(({current}) => current.add(new View()));

    const entity = new Entity().add(new Marker());
    engine.addEntity(entity);
    engine.removeEntity(entity);

    expect(markers.entities).toEqual([]);
    expect(any.entities).toEqual([]);
  });
});

describe('Changing the engine during the update', () => {
  class Marker {}

  class LogSystem extends System {
    public constructor(private readonly name: string, private readonly log: string[], private readonly action?: (system: LogSystem) => void) {
      super();
    }

    public update(): void {
      this.log.push(this.name);
      this.action?.(this);
    }

    public remove(): void {
      this.requestRemoval();
    }
  }

  it('Expected that clearing the engine from a system doesn\'t update removed systems', () => {
    const log: string[] = [];
    const engine = new Engine()
      .addSystem(new LogSystem('restart', log, (system) => system.engine.clear()), 0)
      .addSystem(new LogSystem('other', log, (system) => system.engine), 1);
    expect(() => engine.update(1)).not.toThrow();
    expect(log).toEqual(['restart']);
  });

  it('Expected that a system requesting removal doesn\'t skip the next system', () => {
    const log: string[] = [];
    const engine = new Engine()
      .addSystem(new LogSystem('a', log, (system) => system.remove()), 0)
      .addSystem(new LogSystem('b', log), 1);
    engine.update(1);
    engine.update(1);
    expect(log).toEqual(['a', 'b', 'b']);
    expect(engine.systems.length).toBe(1);
  });

  it('Expected that removing a system from another one doesn\'t skip systems', () => {
    const log: string[] = [];
    const engine = new Engine();
    engine
      .addSystem(new LogSystem('a', log, () => engine.removeSystem('b')), {priority: 0})
      .addSystem(new LogSystem('b', log), {priority: 1, id: 'b'})
      .addSystem(new LogSystem('c', log), {priority: 2});
    engine.update(1);
    expect(log).toEqual(['a', 'c']);
  });

  it('Expected that systems added during the update are updated starting from the next update', () => {
    const log: string[] = [];
    const engine = new Engine();
    let added = false;
    engine.addSystem(new LogSystem('late', log, () => {
      if (added) return;
      added = true;
      engine.addSystem(new LogSystem('early', log), 0);
    }), 10);
    engine.update(1);
    expect(log).toEqual(['late']);
    engine.update(1);
    expect(log).toEqual(['late', 'early', 'late']);
  });

  it('Expected that a system added again after requesting removal is not removed', () => {
    const log: string[] = [];
    const engine = new Engine();
    const system = new LogSystem('once', log, (it) => it.remove());
    engine.addSystem(system);
    engine.update(1);
    engine.addSystem(new LogSystem('noop', log));
    const again = new LogSystem('again', log);
    engine.addSystem(again);
    engine.update(1);
    expect(engine.systems).toContain(again);
  });

  it('Expected that removing all entities during the update is deferred', () => {
    const engine = new Engine();
    const entity = new Entity().add(new Marker());
    const query = new QueryBuilder().with(Marker).build();
    engine.addQuery(query).addEntity(entity);
    let inQuery = false;
    engine.addSystem(new LogSystem('clear', [], () => {
      engine.removeAllEntities();
      inQuery = query.has(entity);
    }));
    engine.update(1);
    expect(inQuery).toBe(true);
    expect(engine.entities).toEqual([]);
    expect(query.isEmpty).toBe(true);
  });

  it('Expected that an entity added again after removing all entities is kept', () => {
    const engine = new Engine();
    const entity = new Entity();
    engine.addEntity(entity);
    engine.addSystem(new LogSystem('readd', [], () => {
      engine.removeEntity(entity);
      engine.clear();
      engine.addEntity(entity);
    }));
    engine.update(1);
    expect(engine.getEntityById(entity.id)).toBe(entity);
  });

  it('Expected that entities removed before an error in the update are removed', () => {
    const engine = new Engine();
    const entity = new Entity();
    engine.addEntity(entity);
    engine.addSystem(new LogSystem('failing', [], () => {
      engine.removeEntity(entity);
      throw new Error('Failed');
    }));
    expect(() => engine.update(1)).toThrow('Failed');
    expect(engine.entities).toEqual([]);
  });
});

describe('Removing queries while the engine notifies them', () => {
  class A {}

  it('Expected that removing a query on a component change doesn\'t skip other queries', () => {
    const engine = new Engine();
    const q1 = new QueryBuilder().with(A).build();
    const q2 = new QueryBuilder().with(A).build();
    const q3 = new QueryBuilder().with(A).build();
    engine.addQuery(q1).addQuery(q2).addQuery(q3);
    q1.onEntityAdded.connect(() => engine.removeQuery(q1));
    const entity = new Entity();
    engine.addEntity(entity);
    entity.add(new A());
    expect(q2.has(entity)).toBe(true);
    expect(q3.has(entity)).toBe(true);
  });

  it('Expected that removing a query on adding an entity doesn\'t skip other queries', () => {
    const engine = new Engine();
    const q1 = new QueryBuilder().with(A).build();
    const q2 = new QueryBuilder().with(A).build();
    engine.addQuery(q1).addQuery(q2);
    q1.onEntityAdded.connect(() => engine.removeQuery(q1));
    const entity = new Entity().add(new A());
    engine.addEntity(entity);
    expect(q2.has(entity)).toBe(true);
  });

  it('Expected that adding a query twice and removing it once removes it', () => {
    const engine = new Engine();
    const query = new QueryBuilder().with(A).build();
    engine.addQuery(query).addQuery(query).removeQuery(query);
    engine.addEntity(new Entity().add(new A()));
    expect(engine.queries).toEqual([]);
    expect(query.isEmpty).toBe(true);
  });
});
