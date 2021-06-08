import {Entity, EntitySnapshot, getComponentId, LinkedComponent} from '../../src';

class Position {
  public x: number = 0;
  public y: number = 0;

  constructor(x: number = 0, y: number = 0) {
    this.x = x;
    this.y = y;
  }
}

class Damage extends LinkedComponent {
  public constructor(
    public value: number,
  ) {
    super();
  }
}

class AnotherDamage extends LinkedComponent {
  public constructor() {
    super();
  }
}

class DamageChild extends Damage {
  public constructor() {
    super(1);
  }
}

describe('Components id', () => {
  it('Getting component id without forcing of id creation returns undefined', () => {
    expect(getComponentId(
      class Test {
      },
    )).toBeUndefined();
  });

  it('Getting component id return equal values for same component twice', () => {
    class Test1 {
    }

    class Test2 {
    }

    expect(getComponentId(Test1, true))
      .toBe(getComponentId(Test1, true));

    expect(getComponentId(Test2, true))
      .toBe(getComponentId(Test2));
  });

  it('Getting components id returns different values', () => {
    class Test1 {
    }

    class Test2 {
    }

    const positionId = getComponentId(Test1, true);
    const viewId = getComponentId(Test2, true);

    expect(positionId).toBeDefined();
    expect(viewId).toBeDefined();

    expect(positionId == viewId).toBeFalsy();
  });
});

describe('Components and Tags', () => {
  it('Adding single component, must to dispatch only onComponentAdded once', () => {
    const entity = new Entity();
    let addedCount = 0;
    let removedCount = 0;

    expect(entity.has(Position)).toBe(false);

    const addedCallback = () => addedCount++;
    const removedCallback = () => removedCount++;
    entity.onComponentAdded.connect(addedCallback);
    entity.onComponentRemoved.connect(removedCallback);

    entity.add(new Position());

    entity.onComponentAdded.disconnect(addedCallback);
    entity.onComponentRemoved.disconnect(removedCallback);

    expect(entity.has(Position)).toBe(true);
    expect(addedCount).toBe(1);
    expect(removedCount).toBe(0);
  });

  it('Adding component twice, must override previous component', () => {
    const entity = new Entity();
    let addedCount = 0;
    let removedCount = 0;

    const position1 = new Position(0, 0);
    const position2 = new Position(1, 1);

    const addedCallback = () => addedCount++;
    const removedCallback = () => removedCount++;
    entity.onComponentAdded.connect(addedCallback);
    entity.onComponentRemoved.connect(removedCallback);

    entity.add(position1);
    entity.add(position2);

    entity.onComponentAdded.disconnect(addedCallback);
    entity.onComponentRemoved.disconnect(removedCallback);

    expect(entity.get(Position)).toBe(position2);
    expect(entity.getComponents().length).toBe(1);
    expect(addedCount).toBe(2);
    expect(removedCount).toBe(1);
  });

  it(`Adding the same component, must not trigger onComponentAdded for the second call`, () => {
    const entity = new Entity();
    let addedCount = 0;
    let removedCount = 0;

    const position = new Position(0, 0);

    const addedCallback = () => addedCount++;
    const removedCallback = () => removedCount++;
    entity.onComponentAdded.connect(addedCallback);
    entity.onComponentRemoved.connect(removedCallback);

    entity.add(position);
    entity.add(position);

    entity.onComponentAdded.disconnect(addedCallback);
    entity.onComponentRemoved.disconnect(removedCallback);

    expect(entity.get(Position)).toBe(position);
    expect(entity.getComponents().length).toBe(1);
    expect(addedCount).toBe(1);
    expect(removedCount).toBe(0);
  });

  it(`Adding component with 'resolve class' ancestor`, () => {
    class Ancestor {}

    class Descendant extends Ancestor {}

    class Descendant2 extends Ancestor {}

    const entity = new Entity();
    entity.add(new Descendant(), Ancestor);
    const id1 = getComponentId(Ancestor);
    const id2 = getComponentId(Descendant);

    expect(id1).not.toEqual(id2);

    expect(entity.has(Ancestor)).toBeTruthy();
    expect(entity.get(Ancestor)).toBeDefined();

    expect(entity.has(Descendant)).toBeFalsy();
    expect(entity.get(Descendant)).toBeUndefined();

    expect(entity.has(Descendant2)).toBeFalsy();
    expect(entity.get(Descendant2)).toBeUndefined();
  });

  it(`Adding component with 'resolve class' not ancestor`, () => {
    class Ancestor {}

    class Descendant extends Ancestor {}

    class Other {}

    const entity = new Entity();
    expect(
      () => { entity.add(new Ancestor(), Descendant); },
    ).toThrow();

    expect(
      () => { entity.add(new Ancestor(), Other); },
    ).toThrow();

  });

  it(`Adding component of type Ancestor should override component with 'resolve class' Ancestor`, () => {
    class Ancestor {}

    class Descendant extends Ancestor {}

    const entity = new Entity();
    const ancestor = new Ancestor();
    const descendant = new Descendant();
    entity.add(descendant, Ancestor);
    expect(entity.get(Ancestor)).toBe(descendant);

    entity.add(ancestor);
    expect(entity.has(Ancestor)).toBeTruthy();
    expect(entity.get(Ancestor)).toBe(ancestor);
  });

  it('Expected that hasAny returns true from component', () => {
    class Other {}

    const entity = new Entity();
    entity.add(new Position());
    expect(entity.hasAny(Other, Position)).toBeTruthy();
  });

  it('Expected that hasAny returns false', () => {
    class Other {}

    class A {}

    const TAG = 'tag';

    const entity = new Entity();
    entity.add(new A());
    entity.add(TAG);
    expect(entity.hasAny(Other, Position)).toBeFalsy();
  });

  it('Expected that hasAll returns true', () => {
    const entity = new Entity();
    const TAG = 12345;
    entity.add(new Position());
    entity.add(TAG);
    expect(entity.hasAll(TAG, Position)).toBeTruthy();
  });

  it('Expected that hasAll returns false', () => {
    class Other {}

    const entity = new Entity();
    entity.add(new Position());
    expect(entity.hasAll(Other, Position)).toBeFalsy();
  });

  it(`Expected that adding a tag dispatches onComponentAdded once`, () => {
    const TAG = 0;
    let addedCount = 0;
    let removedCount = 0;

    const addedCallback = () => addedCount++;
    const removedCallback = () => removedCount++;

    const entity = new Entity();
    entity.onComponentAdded.connect(addedCallback);
    entity.onComponentRemoved.connect(removedCallback);
    entity.add(TAG);

    const tags = entity.getTags();
    expect(addedCount).toBe(1);
    expect(entity.tags.size).toBe(1);
    expect(tags.length).toBe(1);
    expect(removedCount).toBe(0);
  });

  it(`Expected that adding a tag twice dispatches onComponentAdded only once`, () => {
    const TAG = 0;
    let addedCount = 0;
    let removedCount = 0;

    const addedCallback = () => addedCount++;
    const removedCallback = () => removedCount++;

    const entity = new Entity();
    entity.onComponentAdded.connect(addedCallback);
    entity.onComponentRemoved.connect(removedCallback);
    entity.add(TAG);
    entity.add(TAG);

    expect(addedCount).toBe(1);
    expect(removedCount).toBe(0);
  });

  it(`Expected that entity has an added tag`, () => {
    const TAG = 0;
    const entity = new Entity();
    entity.add(TAG);

    expect(entity.has(TAG)).toBeTruthy();
  });

  it(`Expected that appending the same linked component twice will throw an error`, () => {
    const entity = new Entity();
    const damage = new Damage(10);
    expect(() => {
      entity.append(damage);
      entity.append(damage);
    }).toThrowError();
  });

  it(`Expected that specifying not ancestor as a resolve class for appended component throws an error`, () => {
    const entity = new Entity();
    expect(() => {
      entity.append(new Damage(10), AnotherDamage);
    }).toThrow();
    expect(() => {
      entity.append(new Damage(10), DamageChild);
    }).toThrow();
  });

  it(`Expected that specifying resolve class for appended component gives right resolving`, () => {
    const entity = new Entity();
    const secondChild = new DamageChild();
    const firstChild = new DamageChild();
    entity.append(firstChild, Damage);
    entity.append(secondChild, Damage);
    expect(entity.get(Damage)).toEqual(firstChild);
  });

  it(`Expected that appending the same linked component twice with gaps will throw an error`, () => {
    const entity = new Entity();
    const damage = new Damage(10);
    expect(() => {
      entity.append(damage);
      for (let i = 0; i < 5; i++) {
        entity.append(new Damage(i));
      }
      entity.append(damage);
    }).toThrowError();
  });

  it(`Expected that appending the two different instances of linked component will not throw an error`, () => {
    const entity = new Entity();
    expect(() => {
      entity.append(new Damage(10));
      entity.append(new Damage(10));
    }).not.toThrowError();
  });

  it(`Expected that appending the two different instances of linked component will trigger onComponentAdded only once`, () => {
    const entity = new Entity();
    let addedAmount = 0;
    entity.onComponentAdded.connect(() => { addedAmount++; });
    entity.append(new Damage(10));
    entity.append(new Damage(10));
    expect(addedAmount).toBe(2);
  });

  it(`Removing linked component with "remove" removes whole linked list`, () => {
    const entity = new Entity();
    entity.append(new Damage(10));
    entity.append(new Damage(10));
    entity.remove(Damage);

    expect(entity.get(Damage)).toBeUndefined();
  });

  it(`Removing linked component with "pick" removes only first component`, () => {
    const entity = new Entity();
    const damage1 = new Damage(1);
    const damage2 = new Damage(2);
    entity.append(damage1);
    entity.append(damage2);
    entity.pick(damage1);
    expect(entity.get(Damage)).toBe(damage2);
  });

  it(`Withdrawing all components clears linked list associated to component class`, () => {
    const entity = new Entity()
      .append(new Damage(1))
      .append(new Damage(2))
      .append(new Damage(3));

    while (entity.has(Damage)) {
      entity.withdraw(Damage);
    }

    expect(entity.has(Damage)).toBeFalsy();
    expect(entity.getLinkedComponentList(Damage, false)).toBeUndefined();
  });

  it(`"withdraw" returns undefined if there is no linked components appended`, () => {
    const entity = new Entity()
      .add(new Position())
      .append(new Damage(1))
      .append(new Damage(2));

    while (entity.has(Damage)) {
      entity.withdraw(Damage);
    }

    expect(entity.withdraw(Damage)).toBeUndefined();
  });

  it('"contains" returns the same instance if it exists in the linked components appended to the Entity', () => {
    const damage = new Damage(1);
    const entity = new Entity()
      .append(new Damage(1))
      .append(damage)
      .append(new Damage(2));

    expect(entity.contains(damage)).toBeTruthy();
  });

  it('"contains" returns undefined linked component is not appended to the Entity', () => {
    const damage = new Damage(1);
    const entity = new Entity()
      .append(new Damage(1))
      .append(new Damage(2));

    expect(entity.contains(damage)).toBeFalsy();
  });

  it('"contains" returns undefined for linked component registered under another resolveClass', () => {
    const damage = new DamageChild();
    const entity = new Entity()
      .append(damage, Damage);

    expect(entity.contains(damage, DamageChild)).toBeFalsy();
  });

  it('"contains" works for regular components', () => {
    const position = new Position(1, 1);
    const entity = new Entity()
      .append(new Damage(1))
      .append(new Damage(2))
      .add(position);
    expect(entity.contains(position)).toBeTruthy();
  });

  it(`Linked components must be cleared after remove`, () => {
    const entity = new Entity();
    entity.append(new Damage(1));
    entity.append(new Damage(2));
    entity.remove(Damage);
    entity.append(new Damage(3));
    expect(entity.lengthOf(Damage)).toBe(1);
  });

  it(`Find component returns linked component instance accepted by predicate`, () => {
    const entity = new Entity();
    const damage1 = new Damage(1);
    const damage2 = new Damage(2);
    entity
      .append(damage1)
      .append(damage2);
    expect(entity.findComponent(Damage, (it) => it.value === 2)).toBe(damage2);
  });

  it(`Find component returns regular component instance accepted by predicate`, () => {
    const entity = new Entity();
    entity.append(new Damage(1))
          .add(new Position(100, 100));
    expect(entity.findComponent(Position, (it) => it.x === 100 && it.y === 100)).toBe(entity.get(Position));
  });

  it('Entity.linkedComponents returns all linked components instances for specific component class', () => {
    const entity = new Entity();
    entity
      .append(new Damage(1))
      .append(new Damage(2))
      .append(new Damage(3));
    let amount = 0;
    for (const damage of entity.linkedComponents(Damage)) {
      if (damage.value === amount + 1) {
        amount++;
      }
    }
    expect(amount).toBe(3);
  });
});

describe('Removing component', () => {
  it('Simple', () => {
    const entity = new Entity();
    const position = new Position(1, 1);

    let addedCount = 0;
    let removedCount = 0;

    const addedCallback = () => addedCount++;
    const removedCallback = () => removedCount++;
    entity.onComponentAdded.connect(addedCallback);
    entity.onComponentRemoved.connect(removedCallback);

    entity.add(position);
    const removedComponent = entity.remove(Position);

    entity.onComponentAdded.disconnect(addedCallback);
    entity.onComponentRemoved.disconnect(removedCallback);

    expect(entity.getComponents().length).toBe(0);
    expect(addedCount).toBe(1);
    expect(removedCount).toBe(1);
    expect(removedComponent).toBeDefined();
    expect(removedComponent).toBe(position);
  });

  it('Removing absent component', () => {
    const entity = new Entity();

    let addedCount = 0;
    let removedCount = 0;

    const addedCallback = () => addedCount++;
    const removedCallback = () => removedCount++;
    entity.onComponentAdded.connect(addedCallback);
    entity.onComponentRemoved.connect(removedCallback);

    const removedComponent = entity.remove(Position);

    entity.onComponentAdded.disconnect(addedCallback);
    entity.onComponentRemoved.disconnect(removedCallback);

    expect(entity.getComponents().length).toBe(0);
    expect(addedCount).toBe(0);
    expect(removedCount).toBe(0);
    expect(removedComponent).toBeUndefined();
  });

  it(`Expected that entity doesn't have removed tag`, () => {
    const TAG = 0;
    const entity = new Entity();
    entity.add(TAG);
    entity.remove(TAG);
    expect(entity.has(TAG)).toBeFalsy();
  });

  it(`Expected that removing absent tag returns undefined`, () => {
    const TAG = 1234;
    const entity = new Entity();
    expect(entity.remove(TAG)).toBeUndefined();
  });
});

describe('Snapshot', () => {
  it(`Expected that checking tag in the blank snapshot gives false`, () => {
    const TAG = 1;
    const snapshot = new EntitySnapshot();
    expect(snapshot.previous.has(TAG)).toBeFalsy();
  });

  it('Expect undefined value (but not throwing an error) for getting component instance, if snapshot not initialized', () => {
    class Component {}

    const snapshot = new EntitySnapshot();
    expect(() => snapshot.previous.get(Component)).not.toThrowError();
    expect(snapshot.previous.get(Component)).toBeUndefined();
  });

  it('Expect undefined value for class that was not being initialized as component', () => {
    class Component {}

    class NotAComponent {}

    const entity = new Entity();
    entity.add(new Component());

    const snapshot = new EntitySnapshot();
    entity.takeSnapshot(snapshot, new Component());
    expect(() => snapshot.previous.get(NotAComponent)).not.toThrowError();
    expect(snapshot.previous.get(NotAComponent)).toBeUndefined();
  });

  it(`Expected that added component appears in current state, but not in the previous`, () => {
    class ComponentA {}

    class ComponentB {}

    const TAG_C = 'tag-c';

    const snapshot = new EntitySnapshot();
    const entity = new Entity().add(new ComponentA());
    entity.onComponentAdded.connect((entity, componentOrTag) => {
      entity.takeSnapshot(snapshot, componentOrTag);
    });

    {
      entity.add(new ComponentB());
      expect(snapshot.current.has(ComponentB)).toBeTruthy();
      expect(snapshot.current.get(ComponentB)).toBeDefined();
      expect(snapshot.previous.has(ComponentB)).toBeFalsy();
      expect(snapshot.previous.get(ComponentB)).toBeUndefined();
    }
    {
      entity.add(TAG_C);
      expect(snapshot.current.has(TAG_C)).toBeTruthy();
      expect(snapshot.previous.has(TAG_C)).toBeFalsy();
    }
  });

  it(`Expected that removed component appears in previous state, but not in the current`, () => {
    class ComponentA {}

    const TAG_C = 'tag-c';

    const snapshot = new EntitySnapshot();
    const entity = new Entity().add(new ComponentA()).add(TAG_C);
    entity.onComponentRemoved.connect((entity, componentOrTag) => {
      entity.takeSnapshot(snapshot, componentOrTag);
    });

    {
      entity.remove(ComponentA);
      const current = snapshot.current;
      const previous = snapshot.previous;
      expect(current.has(ComponentA)).toBeFalsy();
      expect(current.get(ComponentA)).toBeUndefined();
      expect(previous.has(ComponentA)).toBeTruthy();
      expect(previous.get(ComponentA)).toBeDefined();
    }
    {
      entity.remove(TAG_C);
      expect(snapshot.current.has(TAG_C)).toBeFalsy();
      expect(snapshot.previous.has(TAG_C)).toBeTruthy();
    }
  });

  it('Adding linked component must replace all existing linked component instances', () => {
    const entity = new Entity()
      .append(new Damage(1))
      .append(new Damage(2))
      .append(new Damage(3));

    entity.add(new Damage(100));
    expect(entity.lengthOf(Damage)).toBe(1);
  });

  it('Replacing linked component with "add" must trigger onComponentRemoved for every appended linked component', () => {
    const entity = new Entity()
      .append(new Damage(1))
      .append(new Damage(2))
      .append(new Damage(3));

    let removedNumber = 0;
    entity.onComponentRemoved.connect(() => {
      removedNumber++;
    });
    entity.add(new Damage(100));
    expect(removedNumber).toBe(3);
  });
});
