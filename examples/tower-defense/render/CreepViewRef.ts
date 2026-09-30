import {CreepView} from './CreepView';

/**
 * Typed reference to the view of a creep, so the status system updates the health bar without casting the display
 * object of `View`
 */
export class CreepViewRef {
  public constructor(public readonly view: CreepView) {}
}
