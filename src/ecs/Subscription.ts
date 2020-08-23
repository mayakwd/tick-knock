import {Class} from '../utils/Class';

/**
 * @internal
 */
export class Subscription<T> {
  public constructor(
    public readonly messageType: Class<T>,
    public readonly handler: (message: T) => void,
  ) {}

  public equals(messageType: Class<T>, handler?: (message: T) => void) {
    return this.messageType === messageType && (handler === undefined || this.handler === handler);
  }
}
