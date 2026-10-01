import {GridIndex} from '../../shared/indexes/GridIndex';
import {isWithin, Vector} from '../../shared/geometry';
import {CreepEntry} from './CreepEntry';

/**
 * Creeps indexed by cells of the map. Finding creeps near a point looks only into cells around it, instead of checking
 * every creep: towers find targets in it, and explosions find creeps around the target.
 */
export class CreepIndex extends GridIndex<CreepEntry> {
  /**
   * @param cellSize Size of a cell in pixels
   */
  public constructor(columns: number, rows: number, private readonly cellSize: number) {
    super(columns, rows);
  }

  /**
   * Calls the callback for every creep, which position is within the radius from the center. Only cells, that
   * the circle touches, are checked.
   */
  public forEachInRange(center: Readonly<Vector>, radius: number, callback: (creep: CreepEntry) => void): void {
    const {cellSize} = this;
    this.forEachInArea(
      Math.floor((center.x - radius) / cellSize),
      Math.floor((center.y - radius) / cellSize),
      Math.floor((center.x + radius) / cellSize),
      Math.floor((center.y + radius) / cellSize),
      (creep) => {
        if (isWithin(center, creep.position, radius)) callback(creep);
      },
    );
  }

  /**
   * Finds the creep in range with the highest score
   */
  public best(center: Readonly<Vector>, radius: number, score: (creep: CreepEntry) => number): CreepEntry | undefined {
    let best: CreepEntry | undefined;
    let bestScore = -Infinity;
    this.forEachInRange(center, radius, (creep) => {
      const value = score(creep);
      if (value <= bestScore) return;

      best = creep;
      bestScore = value;
    });
    return best;
  }
}
