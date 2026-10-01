import {Entity, IterativeSystem} from 'tick-knock';
import {Cooldown} from '../../shared/components/Cooldown';
import {Position, Rotation, Velocity} from '../components';
import {DRAG, THRUST, TURN_SPEED} from '../config';
import {Controls} from '../Controls';
import {createBullet} from '../entities';
import {SHIP} from '../tags';

/**
 * Turns and accelerates the ship, and fires according to the controls
 */
export class ShipControlSystem extends IterativeSystem.of(Position, Velocity, Rotation, Cooldown, SHIP) {
  public constructor(private readonly controls: Controls) {
    super();
  }

  protected updateEntity(
    ship: Entity,
    dt: number,
    position: Position,
    velocity: Velocity,
    rotation: Rotation,
    cooldown: Cooldown,
  ): void {
    const {left, right, thrust, fire} = this.controls;

    if (left) rotation.angle -= TURN_SPEED * dt;
    if (right) rotation.angle += TURN_SPEED * dt;

    if (thrust) {
      velocity.x += Math.cos(rotation.angle) * THRUST * dt;
      velocity.y += Math.sin(rotation.angle) * THRUST * dt;
    }

    // The ship loses the same share of its speed every second, whatever the frame rate is
    const drag = Math.exp(-DRAG * dt);
    velocity.x *= drag;
    velocity.y *= drag;

    // The ship fires while the fire control is pressed, when its cooldown is over
    if (!fire || cooldown.remaining > 0) return;

    cooldown.remaining += cooldown.interval;
    this.engine.addEntity(createBullet(position, velocity, rotation.angle));
  }
}
