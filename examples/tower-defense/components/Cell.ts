/**
 * Cell of the map the entity is in. Towers stay in their cells, creeps get a new cell when they cross into it.
 * The cell is immutable, so every move to another cell is a new component, and spatial indexes of the game follow
 * the change with reaction systems.
 */
export class Cell {
  public constructor(public readonly column: number, public readonly row: number) {}
}
