import {CreepEntry} from '../indexes/CreepEntry';

/**
 * The creep the tower fires at. The tower has it only while it has a target: it keeps the target while it's alive and
 * in range, and looks for a new one only when it's lost, like towers in most tower defense games do.
 */
export class Target {
  public constructor(public readonly creep: CreepEntry) {}
}
