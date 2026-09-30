import {Entity, IterativeSystem} from 'tick-knock';
import {Gun, Position} from '../components';
import {HEIGHT, PLAYER_FOCUS_SPEED, PLAYER_SPEED, WIDTH} from '../config';
import {Controls} from '../Controls';
import {createPlayerBullet} from '../entities';
import {PLAYER} from '../tags';

const EDGE = 12;

/**
 * Moves the player according to the controls and fires the gun
 */
export class PlayerControlSystem extends IterativeSystem.of(Position, Gun, PLAYER) {
  public constructor(private readonly controls: Controls) {
    super();
  }

  protected updateEntity(entity: Entity, dt: number, position: Position, gun: Gun): void {
    const {left, right, up, down, focus, fire} = this.controls;
    const dx = Number(right) - Number(left);
    const dy = Number(down) - Number(up);
    // Diagonal movement is not faster than straight one
    const length = Math.hypot(dx, dy) || 1;
    const speed = (focus ? PLAYER_FOCUS_SPEED : PLAYER_SPEED) * dt / length;
    position.x = clamp(position.x + dx * speed, EDGE, WIDTH - EDGE);
    position.y = clamp(position.y + dy * speed, EDGE, HEIGHT - EDGE);

    gun.cooldown = Math.max(0, gun.cooldown - dt);
    if (fire && gun.cooldown === 0) {
      gun.cooldown = gun.interval;
      this.engine.addEntity(createPlayerBullet(position.x - 6, position.y - 10));
      this.engine.addEntity(createPlayerBullet(position.x + 6, position.y - 10));
    }
  }
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}
