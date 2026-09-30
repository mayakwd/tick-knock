import {LinkedComponent} from 'tick-knock';

/**
 * Slows the creep down. A creep can be hit by several frost towers, so slows are linked components:
 * the strongest one is applied, and every slow expires on its own.
 */
export class Slow extends LinkedComponent {
  public constructor(public readonly factor: number, public seconds: number) {
    super();
  }
}
