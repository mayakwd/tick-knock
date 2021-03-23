import {Engine, Query, System} from '../../src';

describe('Shared config', () => {
  it('Shared config is accessible when system added to engine', () => {
    let sharedConfigAccessible = false;

    const engine = new Engine();
    const system = new class extends System {
      public onAddedToEngine() {
        sharedConfigAccessible = this.sharedConfig !== undefined;
      }
    }();

    expect(() => {
      engine.addSystem(system);
    }).not.toThrowError();
    expect(sharedConfigAccessible).toBeTruthy();
  });

  it('Accessing shared config throws an error, when system is not added to engine', () => {
    expect(() => {
      new class extends System {
        public constructor() {
          super();
          this.sharedConfig;
        }
      };
    }).toThrowError();
  });

  it(`Shared config can't be removed from engine`, () => {
    expect(() => {
      class Component {}

      const engine = new Engine();
      engine.sharedConfig.add(new Component());
      engine.removeEntity(engine.sharedConfig);

      let sharedConfigAccessibleAndStillTheSame = false;
      const system = new class extends System {
        public onAddedToEngine() {
          sharedConfigAccessibleAndStillTheSame = this.sharedConfig !== undefined && this.sharedConfig.has(Component);
        }
      };
      engine.addSystem(system);
      expect(sharedConfigAccessibleAndStillTheSame).toBeTruthy();
    });
  });

  it(`Shared config is presented in the queries`, () => {
    expect(() => {
      const TAG = 'tag';
      const engine = new Engine();
      const query = new Query((entity) => entity.has(TAG));
      engine.sharedConfig.add(TAG);
      engine.addQuery(query);

      expect(query.length).toBe(1);
      expect(query.first).toBe(engine.sharedConfig);
    });
  });
});
