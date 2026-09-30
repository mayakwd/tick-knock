import {Entity} from 'tick-knock';
import {View} from '../../shared/render/View';
import {Collider, Gun, Lives, Position} from '../components';
import {PLAYER_FIRE_INTERVAL, PLAYER_LIVES, PLAYER_RADIUS} from '../config';
import {drawPlayer} from '../render/graphics';
import {PLAYER} from '../tags';

export function createPlayer(x: number, y: number): Entity {
  return new Entity()
    .add(new Position(x, y))
    .add(new Collider(PLAYER_RADIUS))
    .add(new Gun(PLAYER_FIRE_INTERVAL))
    .add(new Lives(PLAYER_LIVES))
    .add(new View(drawPlayer()))
    .add(PLAYER);
}
