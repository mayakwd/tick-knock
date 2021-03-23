import {Engine, Entity, IterativeSystem, LinkedComponent, Query, QueryBuilder, QueryPredicate, System} from '../../src';
import {ReactionSystem} from '../../src/ecs/ReactionSystem';

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
    super(new QueryBuilder().contains(Component), arr);
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
    expect(() => { engine.removeSystem(system);}).not.toThrowError();
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
    expect(() => {engine.removeQuery(query);}).not.toThrowError();
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
