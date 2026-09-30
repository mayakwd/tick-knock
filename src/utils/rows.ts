import type {Entity} from '../ecs/Entity';

/**
 * @internal
 * Callback of `Query.forEach`, receiving an entity and its components
 */
export type RowCallback = (entity: Entity, ...components: unknown[]) => void;

/**
 * @internal
 * System, which `updateEntity` receives an entity, the delta time and components of the entity
 */
export interface RowSystem {
  /**
   * Stops the iteration when true, it's checked before every entity
   */
  readonly isIterationStopped: boolean;

  updateEntity(entity: Entity, dt: number, ...components: unknown[]): void;
}

/**
 * @internal
 * Calls the callback for every entity of the dense array, passing components of the entity from columns as separate
 * arguments. Holes in the dense array are skipped.
 *
 * Components are passed without allocations: queries of up to 10 components have their own loops, longer ones reuse
 * one array of arguments. Every loop calls the callback directly, which is several times faster than `Function.call`.
 *
 * @param dense Entities of the query, `undefined` for holes
 * @param columns Components of every entity, a column per component class, indexed as `dense`
 * @param callback Function to call for every entity
 */
export function forEachRow(
  dense: ReadonlyArray<Entity | undefined>,
  columns: ReadonlyArray<ReadonlyArray<unknown>>,
  callback: RowCallback,
): void {
  const length = dense.length;
  switch (columns.length) {
    case 0: {
      for (let i = 0; i < length; i++) {
        const entity = dense[i];
        if (entity !== undefined) callback(entity);
      }
      return;
    }
    case 1: {
      const [c0] = columns;
      for (let i = 0; i < length; i++) {
        const entity = dense[i];
        if (entity !== undefined) callback(entity, c0[i]);
      }
      return;
    }
    case 2: {
      const [c0, c1] = columns;
      for (let i = 0; i < length; i++) {
        const entity = dense[i];
        if (entity !== undefined) callback(entity, c0[i], c1[i]);
      }
      return;
    }
    case 3: {
      const [c0, c1, c2] = columns;
      for (let i = 0; i < length; i++) {
        const entity = dense[i];
        if (entity !== undefined) callback(entity, c0[i], c1[i], c2[i]);
      }
      return;
    }
    case 4: {
      const [c0, c1, c2, c3] = columns;
      for (let i = 0; i < length; i++) {
        const entity = dense[i];
        if (entity !== undefined) callback(entity, c0[i], c1[i], c2[i], c3[i]);
      }
      return;
    }
    case 5: {
      const [c0, c1, c2, c3, c4] = columns;
      for (let i = 0; i < length; i++) {
        const entity = dense[i];
        if (entity !== undefined) callback(entity, c0[i], c1[i], c2[i], c3[i], c4[i]);
      }
      return;
    }
    case 6: {
      const [c0, c1, c2, c3, c4, c5] = columns;
      for (let i = 0; i < length; i++) {
        const entity = dense[i];
        if (entity !== undefined) callback(entity, c0[i], c1[i], c2[i], c3[i], c4[i], c5[i]);
      }
      return;
    }
    case 7: {
      const [c0, c1, c2, c3, c4, c5, c6] = columns;
      for (let i = 0; i < length; i++) {
        const entity = dense[i];
        if (entity !== undefined) callback(entity, c0[i], c1[i], c2[i], c3[i], c4[i], c5[i], c6[i]);
      }
      return;
    }
    case 8: {
      const [c0, c1, c2, c3, c4, c5, c6, c7] = columns;
      for (let i = 0; i < length; i++) {
        const entity = dense[i];
        if (entity !== undefined) callback(entity, c0[i], c1[i], c2[i], c3[i], c4[i], c5[i], c6[i], c7[i]);
      }
      return;
    }
    case 9: {
      const [c0, c1, c2, c3, c4, c5, c6, c7, c8] = columns;
      for (let i = 0; i < length; i++) {
        const entity = dense[i];
        if (entity !== undefined) callback(entity, c0[i], c1[i], c2[i], c3[i], c4[i], c5[i], c6[i], c7[i], c8[i]);
      }
      return;
    }
    case 10: {
      const [c0, c1, c2, c3, c4, c5, c6, c7, c8, c9] = columns;
      for (let i = 0; i < length; i++) {
        const entity = dense[i];
        if (entity === undefined) continue;
        callback(entity, c0[i], c1[i], c2[i], c3[i], c4[i], c5[i], c6[i], c7[i], c8[i], c9[i]);
      }
      return;
    }
    default: {
      const args: unknown[] = new Array(columns.length + 1);
      for (let i = 0; i < length; i++) {
        const entity = dense[i];
        if (entity === undefined) continue;
        args[0] = entity;
        for (let column = 0; column < columns.length; column++) args[column + 1] = columns[column][i];
        callback(...(args as [Entity, ...unknown[]]));
      }
    }
  }
}

/**
 * @internal
 * Updates every entity of the dense array by the system, passing the delta time and components of the entity from
 * columns as separate arguments, the same way as {@link forEachRow}. The iteration stops when
 * {@link RowSystem.isIterationStopped} becomes true.
 *
 * @param system System, which `updateEntity` is called
 * @param dense Entities of the query, `undefined` for holes
 * @param columns Components of every entity, a column per component class, indexed as `dense`
 * @param dt Delta time in seconds
 */
export function updateRows(
  system: RowSystem,
  dense: ReadonlyArray<Entity | undefined>,
  columns: ReadonlyArray<ReadonlyArray<unknown>>,
  dt: number,
): void {
  const length = dense.length;
  switch (columns.length) {
    case 0: {
      for (let i = 0; i < length && !system.isIterationStopped; i++) {
        const entity = dense[i];
        if (entity !== undefined) system.updateEntity(entity, dt);
      }
      return;
    }
    case 1: {
      const [c0] = columns;
      for (let i = 0; i < length && !system.isIterationStopped; i++) {
        const entity = dense[i];
        if (entity !== undefined) system.updateEntity(entity, dt, c0[i]);
      }
      return;
    }
    case 2: {
      const [c0, c1] = columns;
      for (let i = 0; i < length && !system.isIterationStopped; i++) {
        const entity = dense[i];
        if (entity !== undefined) system.updateEntity(entity, dt, c0[i], c1[i]);
      }
      return;
    }
    case 3: {
      const [c0, c1, c2] = columns;
      for (let i = 0; i < length && !system.isIterationStopped; i++) {
        const entity = dense[i];
        if (entity !== undefined) system.updateEntity(entity, dt, c0[i], c1[i], c2[i]);
      }
      return;
    }
    case 4: {
      const [c0, c1, c2, c3] = columns;
      for (let i = 0; i < length && !system.isIterationStopped; i++) {
        const entity = dense[i];
        if (entity !== undefined) system.updateEntity(entity, dt, c0[i], c1[i], c2[i], c3[i]);
      }
      return;
    }
    case 5: {
      const [c0, c1, c2, c3, c4] = columns;
      for (let i = 0; i < length && !system.isIterationStopped; i++) {
        const entity = dense[i];
        if (entity !== undefined) system.updateEntity(entity, dt, c0[i], c1[i], c2[i], c3[i], c4[i]);
      }
      return;
    }
    case 6: {
      const [c0, c1, c2, c3, c4, c5] = columns;
      for (let i = 0; i < length && !system.isIterationStopped; i++) {
        const entity = dense[i];
        if (entity !== undefined) system.updateEntity(entity, dt, c0[i], c1[i], c2[i], c3[i], c4[i], c5[i]);
      }
      return;
    }
    case 7: {
      const [c0, c1, c2, c3, c4, c5, c6] = columns;
      for (let i = 0; i < length && !system.isIterationStopped; i++) {
        const entity = dense[i];
        if (entity !== undefined) system.updateEntity(entity, dt, c0[i], c1[i], c2[i], c3[i], c4[i], c5[i], c6[i]);
      }
      return;
    }
    case 8: {
      const [c0, c1, c2, c3, c4, c5, c6, c7] = columns;
      for (let i = 0; i < length && !system.isIterationStopped; i++) {
        const entity = dense[i];
        if (entity === undefined) continue;
        system.updateEntity(entity, dt, c0[i], c1[i], c2[i], c3[i], c4[i], c5[i], c6[i], c7[i]);
      }
      return;
    }
    case 9: {
      const [c0, c1, c2, c3, c4, c5, c6, c7, c8] = columns;
      for (let i = 0; i < length && !system.isIterationStopped; i++) {
        const entity = dense[i];
        if (entity === undefined) continue;
        system.updateEntity(entity, dt, c0[i], c1[i], c2[i], c3[i], c4[i], c5[i], c6[i], c7[i], c8[i]);
      }
      return;
    }
    case 10: {
      const [c0, c1, c2, c3, c4, c5, c6, c7, c8, c9] = columns;
      for (let i = 0; i < length && !system.isIterationStopped; i++) {
        const entity = dense[i];
        if (entity === undefined) continue;
        system.updateEntity(entity, dt, c0[i], c1[i], c2[i], c3[i], c4[i], c5[i], c6[i], c7[i], c8[i], c9[i]);
      }
      return;
    }
    default: {
      const args: unknown[] = new Array(columns.length + 2);
      args[1] = dt;
      for (let i = 0; i < length && !system.isIterationStopped; i++) {
        const entity = dense[i];
        if (entity === undefined) continue;
        args[0] = entity;
        for (let column = 0; column < columns.length; column++) args[column + 2] = columns[column][i];
        system.updateEntity(...(args as [Entity, number, ...unknown[]]));
      }
    }
  }
}
