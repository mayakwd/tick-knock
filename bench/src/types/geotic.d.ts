/**
 * Type declarations for the part of geotic API used by the benchmark, geotic doesn't provide its own types.
 * @see https://github.com/ddmills/geotic
 */
declare module 'geotic' {
  export class Component {
    public static properties: Record<string, unknown>;

    public destroy(): void;
  }

  export type ComponentClass = typeof Component;

  export interface Entity {
    /**
     * Components are accessible by camel cased names of their classes, for example `entity.position`
     */
    readonly [component: string]: any;

    add(component: ComponentClass, properties?: Record<string, unknown>): void;

    has(component: ComponentClass): boolean;

    remove(component: Component): void;

    destroy(): void;
  }

  export interface Query {
    get(): Entity[];

    onEntityAdded(callback: (entity: Entity) => void): void;

    onEntityRemoved(callback: (entity: Entity) => void): void;
  }

  export interface World {
    createEntity(): Entity;

    createQuery(filters: { all?: ComponentClass[]; any?: ComponentClass[]; none?: ComponentClass[] }): Query;

    destroyEntities(): void;
  }

  export class Engine {
    public registerComponent(component: ComponentClass): void;

    public createWorld(): World;
  }
}
