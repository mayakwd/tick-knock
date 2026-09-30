export class Asteroid {
  public constructor(
    /**
     * Size from 3 (large) to 1 (small), a destroyed asteroid splits into two smaller ones
     */
    public readonly size: number,
    /**
     * Relative radii of the outline vertices, so every asteroid has its own shape
     */
    public readonly outline: ReadonlyArray<number>,
  ) {}
}
