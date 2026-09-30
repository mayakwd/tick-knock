import {Entity} from 'tick-knock';
import {Collider, Position, Rotation, Ship, Velocity} from '../components';
import {SHIP_RADIUS} from '../config';

export function createShip(x: number, y: number): Entity {
  return new Entity()
    .add(new Position(x, y))
    .add(new Velocity())
    .add(new Rotation(-Math.PI / 2))
    .add(new Collider(SHIP_RADIUS))
    .add(new Ship());
}
