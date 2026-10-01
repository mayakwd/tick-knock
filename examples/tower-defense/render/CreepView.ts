import {Container, Graphics} from 'pixi.js';

const RADIUS = 10;
const BAR_WIDTH = 24;
const BODY_COLOR = 0xda3633;
const SLOW_TINT = 0x79c0ff;
const POISON_TINT = 0x7ee787;

/**
 * View of a creep with a health bar. The body is tinted when the creep is slowed or poisoned.
 */
export class CreepView extends Container {
  private readonly body = new Graphics().circle(0, 0, RADIUS).fill(0xffffff).stroke({width: 2, color: 0x000000, alpha: 0.4});
  private readonly bar = new Graphics().rect(0, 0, BAR_WIDTH, 3).fill(0x3fb950);

  public constructor() {
    super();
    this.body.tint = BODY_COLOR;
    this.bar.position.set(-BAR_WIDTH / 2, -RADIUS - 8);
    const background = new Graphics().rect(-BAR_WIDTH / 2, -RADIUS - 8, BAR_WIDTH, 3).fill(0x30363d);
    this.addChild(this.body, background, this.bar);
  }

  /**
   * @param ratio Share of health left, from 0 to 1
   */
  public setHealth(ratio: number): void {
    this.bar.scale.x = Math.max(0, ratio);
  }

  public setEffects(slowed: boolean, poisoned: boolean): void {
    this.body.tint = poisoned ? POISON_TINT : slowed ? SLOW_TINT : BODY_COLOR;
  }
}
