import {CreepView} from './CreepView';

/**
 * Typed reference to the view of a creep, created by the factory together with `View`, so `HealthBarSystem` updates
 * the health bar without casting the display object of `View`
 */
export class HealthBar {
  public constructor(public readonly view: CreepView) {}
}
