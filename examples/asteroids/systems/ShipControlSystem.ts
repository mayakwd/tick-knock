import {Entity, IterativeSystem} from 'tick-knock';
import {Position, Rotation, Ship, Velocity} from '../components';
import {DRAG, FIRE_COOLDOWN, THRUST, TURN_SPEED} from '../config';
import {Controls} from '../Controls';
import {createBullet} from '../entities';

/**
 * Rotates and accelerates the ship, and fires bullets according to the controls.
 * Controls are passed in the constructor, so the system doesn't know where they come from.
 */
export class ShipControlSystem extends IterativeSystem.of(Ship, Position, Velocity, Rotation) {
  public constructor(private readonly controls: Controls) {
    super();
  }

  protected updateEntity(entity: Entity, dt: number, ship: Ship, position: Position, velocity: Velocity, rotation: Rotation): void {
    const {left, right, thrust, fire} = this.controls;
    if (left) rotation.angle -= TURN_SPEED * dt;
    if (right) rotation.angle += TURN_SPEED * dt;
    if (thrust) {
      velocity.x += Math.cos(rotation.angle) * THRUST * dt;
      velocity.y += Math.sin(rotation.angle) * THRUST * dt;
    }
    velocity.x -= velocity.x * DRAG * dt;
    velocity.y -= velocity.y * DRAG * dt;

    ship.cooldown = Math.max(0, ship.cooldown - dt);
    if (fire && ship.cooldown === 0) {
      ship.cooldown = FIRE_COOLDOWN;
      this.engine.addEntity(createBullet(position, velocity, rotation.angle));
    }
  }
}
