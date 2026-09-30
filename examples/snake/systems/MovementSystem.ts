import {Entity, IterativeSystem} from 'tick-knock';
import {Body, Cell, Heading} from '../components';
import {createSegment} from '../entities';
import {HEAD} from '../tags';

/**
 * Moves the head one cell forward. The head leaves a segment behind, which lives as many ticks as long the body is,
 * so the body follows the head by itself.
 */
export class MovementSystem extends IterativeSystem.of(Cell, Heading, Body, HEAD) {
  protected updateEntity(head: Entity, dt: number, cell: Cell, heading: Heading, body: Body): void {
    // The cell is immutable: the head gets a new one, and the grid follows the change
    head.add(new Cell(cell.x + heading.dx, cell.y + heading.dy));

    // A segment appears right where the head was a moment ago
    this.engine.addEntity(createSegment(cell.x, cell.y, body.length - 1));
  }
}
