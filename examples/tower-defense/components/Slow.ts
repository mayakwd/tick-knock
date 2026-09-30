import {LinkedComponent} from 'tick-knock';
import {SlowEffect} from '../data/towers';

/**
 * Slows the creep down. A creep can be hit by several frost towers, so slows are linked components:
 * the strongest one is applied, and every slow expires on its own.
 */
export class Slow extends LinkedComponent {
  public readonly factor: number;
  /**
   * Time left in seconds
   */
  public seconds: number;

  public constructor({factor, seconds}: SlowEffect) {
    super();
    this.factor = factor;
    this.seconds = seconds;
  }
}
