/**
 * Lightweight implementation of Signal
 */
export class Signal<Handler extends (...args: any[]) => any> {
  private readonly handlers: SignalHandler<Handler>[] = [];

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
    let needResort: boolean;
    if (existingHandler !== undefined) {
      needResort = existingHandler.priority !== priority;
      existingHandler.priority = priority;
    } else {
      const lastHandler = this.handlers[this.handlers.length - 1];
      this.handlers.push(new SignalHandler(handler, priority));
      needResort = (lastHandler !== undefined && lastHandler.priority > priority);
    }
    if (needResort) {
      this.handlers.sort((a, b) => a.priority - b.priority);
    }
  }

  /**
   * Disconnects signal handler
   * @param {Handler} handler
   */
  public disconnect(handler: Handler): void {
    const existingHandlerIndex = this.handlers.findIndex((it) => it.equals(handler));
    if (existingHandlerIndex >= 0) {
      this.handlers.splice(existingHandlerIndex, 1);
    }
  }

  /**
   * Disconnects all signal handlers
   * @param {Handler} handler
   */
  public disconnectAll(): void {
    this.handlers.length = 0;
  }

  /**
   * Invokes connected handlers with passed parameters.
   * @param {any} args
   */
  public emit(...args: Parameters<Handler>): void {
    for (const handler of this.handlers) {
      handler.handle(...args);
    }
  }
}

class SignalHandler<Handler extends (...args: any[]) => any> {
  public constructor(public readonly handler: Handler, public priority: number) {}

  public equals(handler: Handler): boolean {
    return this.handler === handler;
  }

  public handle(...args: any[]) {
    this.handler(...args);
  }
}
