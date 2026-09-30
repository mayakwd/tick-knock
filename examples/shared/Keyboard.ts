/**
 * Keyboard state of an element. Keys are handled only while the element has focus, so the game embedded into a page
 * doesn't steal arrows and space from the page.
 */
export class Keyboard {
  private readonly pressed = new Set<string>();
  private readonly handlers = new Map<string, () => void>();

  /**
   * @param target Element that receives keyboard events, it's made focusable
   * @param codes Codes of keys used by the game, their default action (scrolling the page) is prevented
   */
  public constructor(private readonly target: HTMLElement, private readonly codes: ReadonlyArray<string>) {
    target.tabIndex = 0;
    target.addEventListener('keydown', this.onKeyDown);
    target.addEventListener('keyup', this.onKeyUp);
    target.addEventListener('blur', this.onBlur);
  }

  /**
   * Returns a value indicating whether any of the keys is pressed
   * @param codes Codes of keys, for example `ArrowLeft` or `KeyA`
   */
  public isDown(...codes: string[]): boolean {
    return codes.some((code) => this.pressed.has(code));
  }

  /**
   * Calls the handler every time the key is pressed
   */
  public onPress(code: string, handler: () => void): void {
    this.handlers.set(code, handler);
  }

  public destroy(): void {
    this.target.removeEventListener('keydown', this.onKeyDown);
    this.target.removeEventListener('keyup', this.onKeyUp);
    this.target.removeEventListener('blur', this.onBlur);
  }

  private readonly onKeyDown = (event: KeyboardEvent) => {
    if (this.codes.includes(event.code)) event.preventDefault();
    if (!event.repeat) this.handlers.get(event.code)?.();
    this.pressed.add(event.code);
  };

  private readonly onKeyUp = (event: KeyboardEvent) => {
    this.pressed.delete(event.code);
  };

  private readonly onBlur = () => {
    this.pressed.clear();
  };
}
