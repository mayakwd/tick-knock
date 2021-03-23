/**
 * Lightweight implementation of Signal
 */
export class Signal<Handler extends (...args: any[]) => any> {
  private readonly handlers: Handler[] = [];

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
   */
  public connect(handler: Handler): void {
    const index = this.handlers.indexOf(handler);
    if (index < 0) {
      this.handlers.push(handler);
    }
  }

  /**
   * Disconnects signal handler
   * @param {Handler} handler
   */
  public disconnect(handler: Handler): void {
    const index = this.handlers.indexOf(handler);
    if (index >= 0) {
      this.handlers.splice(index, 1);
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
      handler(...args);
    }
  }
}
