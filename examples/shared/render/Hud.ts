import {Container, Text} from 'pixi.js';

const STYLE = {fill: 0xc9d1d9, fontFamily: 'system-ui, sans-serif', fontSize: 16};

/**
 * Text overlay of the game: a status line in the top left corner, a hint at the bottom and a message in the center
 */
export class Hud extends Container {
  private readonly status = new Text({text: '', style: STYLE});
  private readonly hint = new Text({text: '', style: {...STYLE, fill: 0x8b949e}});
  private readonly message = new Text({text: '', style: {...STYLE, fontSize: 28, align: 'center'}});

  public constructor(width: number, height: number) {
    super();
    this.status.position.set(12, 8);
    this.hint.anchor.set(0.5, 1);
    this.hint.position.set(width / 2, height - 10);
    this.message.anchor.set(0.5);
    this.message.position.set(width / 2, height / 2);
    this.addChild(this.status, this.hint, this.message);
  }

  public setStatus(text: string): void {
    if (this.status.text !== text) this.status.text = text;
  }

  public setHint(text: string): void {
    if (this.hint.text !== text) this.hint.text = text;
  }

  public setMessage(text: string): void {
    if (this.message.text !== text) this.message.text = text;
  }
}
