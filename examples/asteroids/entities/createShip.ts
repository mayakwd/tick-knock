import {Entity} from 'tick-knock';
import {Cooldown} from '../../shared/components/Cooldown';
import {View} from '../../shared/render/View';
import {Collider, Position, Rotation, Velocity} from '../components';
import {FIRE_INTERVAL, SHIP_RADIUS} from '../config';
import {drawShip} from '../render/graphics';
import {SHIP} from '../tags';

export function createShip(x: number, y: number): Entity {
  return new Entity()
    .add(new Position(x, y))
    .add(new Velocity())
    .add(new Rotation(-Math.PI / 2))
    .add(new Collider(SHIP_RADIUS))
    .add(new Cooldown(FIRE_INTERVAL))
    .add(new View(drawShip()))
    .add(SHIP);
}
