import {LinkedComponentList} from '../../src/ecs/LinkedComponentList';
import {LinkedComponent} from '../../src';

class Component extends LinkedComponent {}

describe('Linked list', () => {
  it(`Adding component to the empty list putting it to the head`, () => {
    const list = new LinkedComponentList();
    const component = new Component();
    list.add(component);
    expect(list.head).toBe(component);
  });

  it(`Adding component to the empty list makes it non-empty`, () => {
    const list = new LinkedComponentList();
    const component = new Component();
    expect(list.isEmpty).toBeTruthy();
    list.add(component);
    expect(list.isEmpty).toBeFalsy();
  });

  it(`Removing component from the list makes it empty`, () => {
    const list = new LinkedComponentList();
    const component = new Component();
    list.add(component);
    expect(list.remove(component)).toBeTruthy();
    expect(list.isEmpty).toBeTruthy();
  });

  it(`Removing component from the the empty list returns false`, () => {
    const list = new LinkedComponentList();
    const component = new Component();
    expect(list.remove(component)).toBeFalsy();
  });

  it(`Removing not head component from the the list not makes it empty`, () => {
    const list = new LinkedComponentList();
    const component1 = new Component();
    const component2 = new Component();
    list.add(component1);
    list.add(component2);
    list.remove(component2);
    expect(list.isEmpty).toBeFalsy();
  });

  it(`"iterate" iterates through all components in the list`, () => {
    const list = new LinkedComponentList();
    const components = [new Component(), new Component(), new Component()];
    components.forEach((component) => list.add(component));
    list.iterate((component) => {
      const index = components.indexOf(component);
      expect(index).not.toBe(-1);
      components.splice(index, 1);
    });
    expect(components.length).toBe(0);
  });

  it('removing current component during iteration won\'t breaks iteration', () => {
    const list = new LinkedComponentList();
    const components = [new Component(), new Component(), new Component()];
    components.forEach((component) => list.add(component));
    list.iterate((component) => {
      list.remove(component);
      const index = components.indexOf(component);
      expect(index).not.toBe(-1);
      components.splice(index, 1);
    });
    expect(components.length).toBe(0);
  });

  it(`"clear" removes all components from the list`, () => {
    const list = new LinkedComponentList();
    list.add(new Component());
    list.add(new Component());
    list.add(new Component());
    list.clear();
    expect(list.isEmpty).toBeTruthy();
  });
});
