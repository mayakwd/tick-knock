import {Entity} from 'tick-knock';

/**
 * Creep the tower fires at. The tower keeps its target while the target is alive and in range, and looks for
 * a new one only when it's lost, like towers in most tower defense games do.
 */
export class Target {
  public entity?: Entity;
}
