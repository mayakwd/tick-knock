/**
 * Lightweight implementation of Signal
 */
export class Signal<Handler extends (...args: any[]) => any> {
  // The list is replaced instead of being changed, so connecting and disconnecting handlers from a handler
  // doesn't affect the emit in progress
  private handlers: SignalHandler<Handler>[] = [];

  /**
   * Gets a value that indicates whether signal has handlers
   * @return {boolean}
   */
  public get hasHandlers(): boolean {
    return this.handlers.length > 0;
  }

  /**
   * Gets an amount of connected handlers
   * @return {number}
   */
  public get handlersAmount(): number {
    return this.handlers.length;
  }

  /**
   * Connects signal handler, that will be invoked on signal emit.
   * @param {Handler} handler
   * @param priority Handler invocation priority (handler with higher priority will be called later than with lower one)
   */
  public connect(handler: Handler, priority: number = 0): void {
    const existingHandler = this.handlers.find((it) => it.equals(handler));
    if (existingHandler !== undefined && existingHandler.priority === priority) return;
    const handlers = this.handlers.filter((it) => it !== existingHandler);
    const index = handlers.findIndex((it) => it.priority > priority);
    handlers.splice(index === -1 ? handlers.length : index, 0, new SignalHandler(handler, priority));
    this.handlers = handlers;
  }

  /**
   * Disconnects signal handler
   * @param {Handler} handler
   */
  public disconnect(handler: Handler): void {
    if (this.handlers.some((it) => it.equals(handler))) {
      this.handlers = this.handlers.filter((it) => !it.equals(handler));
    }
  }

  /**
   * Disconnects all signal handlers
   */
  public disconnectAll(): void {
    this.handlers = [];
  }

  /**
   * Invokes connected handlers with passed parameters.
   * @param args Arguments passed to handlers
   */
  public emit(...args: Parameters<Handler>): void {
    const handlers = this.handlers;
    for (let i = 0; i < handlers.length; i++) {
      handlers[i].handler(...args);
    }
  }
}

class SignalHandler<Handler extends (...args: any[]) => any> {
  public constructor(public readonly handler: Handler, public priority: number) {}

  public equals(handler: Handler): boolean {
    return this.handler === handler;
  }
}
