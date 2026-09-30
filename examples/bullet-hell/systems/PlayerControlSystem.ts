import {Entity, IterativeSystem} from 'tick-knock';
import {clamp} from '../../shared/geometry';
import {Cooldown} from '../../shared/components/Cooldown';
import {Position} from '../components';
import {HEIGHT, PLAYER_EDGE, PLAYER_FOCUS_SPEED, PLAYER_GUN_BARRELS, PLAYER_SPEED, WIDTH} from '../config';
import {Controls} from '../Controls';
import {createPlayerBullet} from '../entities';
import {PLAYER} from '../tags';

/**
 * Moves the player, and fires according to the controls
 */
export class PlayerControlSystem extends IterativeSystem.of(Position, Cooldown, PLAYER) {
  public constructor(private readonly controls: Controls) {
    super();
  }

  protected updateEntity(player: Entity, dt: number, position: Position, cooldown: Cooldown): void {
    const {left, right, up, down, focus, fire} = this.controls;
    const dx = Number(right) - Number(left);
    const dy = Number(down) - Number(up);

    // Diagonal movement is not faster than straight one, and the player stays on the screen
    const length = Math.hypot(dx, dy) || 1;
    const step = (focus ? PLAYER_FOCUS_SPEED : PLAYER_SPEED) * dt / length;
    position.x = clamp(position.x + dx * step, PLAYER_EDGE, WIDTH - PLAYER_EDGE);
    position.y = clamp(position.y + dy * step, PLAYER_EDGE, HEIGHT - PLAYER_EDGE);

    // The player fires while the fire control is pressed, when its cooldown is over. Every barrel fires a bullet.
    if (!fire || cooldown.remaining > 0) return;

    cooldown.remaining += cooldown.interval;
    for (const barrel of PLAYER_GUN_BARRELS) {
      this.engine.addEntity(createPlayerBullet(position.x + barrel.x, position.y + barrel.y));
    }
  }
}
