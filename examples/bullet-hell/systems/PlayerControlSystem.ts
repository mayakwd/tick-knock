import {Entity, IterativeSystem} from 'tick-knock';
import {clamp} from '../../shared/geometry';
import {Gun, Position} from '../components';
import {HEIGHT, PLAYER_EDGE, PLAYER_FOCUS_SPEED, PLAYER_GUN_BARRELS, PLAYER_SPEED, WIDTH} from '../config';
import {Controls} from '../Controls';
import {createPlayerBullet} from '../entities';
import {PLAYER} from '../tags';

/**
 * Moves the player and fires its gun according to the controls
 */
export class PlayerControlSystem extends IterativeSystem.of(Position, Gun, PLAYER) {
  public constructor(private readonly controls: Controls) {
    super();
  }

  protected updateEntity(player: Entity, dt: number, position: Position, gun: Gun): void {
    const {left, right, up, down, focus, fire} = this.controls;
    const dx = Number(right) - Number(left);
    const dy = Number(down) - Number(up);

    // Diagonal movement is not faster than straight one, and the player stays on the screen
    const length = Math.hypot(dx, dy) || 1;
    const step = (focus ? PLAYER_FOCUS_SPEED : PLAYER_SPEED) * dt / length;
    position.x = clamp(position.x + dx * step, PLAYER_EDGE, WIDTH - PLAYER_EDGE);
    position.y = clamp(position.y + dy * step, PLAYER_EDGE, HEIGHT - PLAYER_EDGE);

    // The gun fires while the fire control is pressed, every barrel fires a bullet
    gun.cooldown.tick(dt);
    if (!fire || !gun.cooldown.isReady) return;

    gun.cooldown.restart();
    for (const barrel of PLAYER_GUN_BARRELS) {
      this.engine.addEntity(createPlayerBullet(position.x + barrel.x, position.y + barrel.y));
    }
  }
}
