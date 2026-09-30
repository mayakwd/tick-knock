import {QueryBuilder, System} from 'tick-knock';
import {Asteroid, AsteroidsGame, BULLET, Controls, createAsteroidsGame, Position, Rotation, Ship} from './game';

/**
 * Draws the game on the canvas. The rendering context is passed in the constructor, so the game logic doesn't depend
 * on the browser and runs in tests as is.
 */
class RenderSystem extends System {
  private readonly ships = new QueryBuilder().contains(Position, Rotation, Ship).build();
  private readonly asteroids = new QueryBuilder().contains(Position, Rotation, Asteroid).build();
  private readonly bullets = new QueryBuilder().contains(Position, BULLET).build();

  public constructor(private readonly context: CanvasRenderingContext2D, private readonly game: AsteroidsGame) {
    super();
  }

  public onAddedToEngine(): void {
    this.engine.addQuery(this.ships).addQuery(this.asteroids).addQuery(this.bullets);
  }

  public update(): void {
    const {context, game} = this;
    context.fillStyle = '#05060a';
    context.fillRect(0, 0, game.width, game.height);
    context.lineWidth = 2;

    context.strokeStyle = '#8b949e';
    this.asteroids.forEach((entity, {x, y}, {angle}, {size, outline}) => {
      const radius = [0, 12, 24, 40][size];
      context.beginPath();
      outline.forEach((scale, i) => {
        const vertexAngle = angle + (i / outline.length) * Math.PI * 2;
        context.lineTo(x + Math.cos(vertexAngle) * radius * scale, y + Math.sin(vertexAngle) * radius * scale);
      });
      context.closePath();
      context.stroke();
    });

    context.fillStyle = '#ffa657';
    this.bullets.forEach((entity, {x, y}) => {
      context.fillRect(x - 1.5, y - 1.5, 3, 3);
    });

    context.strokeStyle = '#58a6ff';
    this.ships.forEach((entity, {x, y}, {angle}) => {
      context.beginPath();
      context.moveTo(x + Math.cos(angle) * 16, y + Math.sin(angle) * 16);
      context.lineTo(x + Math.cos(angle + 2.5) * 12, y + Math.sin(angle + 2.5) * 12);
      context.lineTo(x + Math.cos(angle - 2.5) * 12, y + Math.sin(angle - 2.5) * 12);
      context.closePath();
      context.stroke();
    });

    context.fillStyle = '#c9d1d9';
    context.font = '16px system-ui, sans-serif';
    context.fillText(`Score: ${game.score}   Wave: ${game.wave}`, 16, 28);
    if (game.isOver) {
      context.textAlign = 'center';
      context.font = '32px system-ui, sans-serif';
      context.fillText('Game over', game.width / 2, game.height / 2);
      context.font = '16px system-ui, sans-serif';
      context.fillText('Press R to restart', game.width / 2, game.height / 2 + 32);
      context.textAlign = 'start';
    }
  }
}

const KEYS: Record<string, keyof Controls> = {
  ArrowLeft: 'left', KeyA: 'left',
  ArrowRight: 'right', KeyD: 'right',
  ArrowUp: 'thrust', KeyW: 'thrust',
  Space: 'fire',
};

const canvas = document.querySelector<HTMLCanvasElement>('#game')!;
const context = canvas.getContext('2d')!;
let game = start();

function start(): AsteroidsGame {
  const created = createAsteroidsGame({width: canvas.width, height: canvas.height});
  // Rendering runs after the game logic, so it's added with the highest priority
  created.engine.addSystem(new RenderSystem(context, created), {priority: 100, id: 'render'});
  return created;
}

function onKey(event: KeyboardEvent, pressed: boolean): void {
  if (event.code === 'KeyR' && pressed && game.isOver) {
    game = start();
    return;
  }
  const control = KEYS[event.code];
  if (control === undefined) return;
  event.preventDefault();
  game.controls[control] = pressed;
}

window.addEventListener('keydown', (event) => onKey(event, true));
window.addEventListener('keyup', (event) => onKey(event, false));

let last = performance.now();
requestAnimationFrame(function frame(now: number) {
  // Delta time is limited, so the game doesn't jump after the tab was in background
  const dt = Math.min((now - last) / 1000, 0.05);
  last = now;
  game.update(dt);
  requestAnimationFrame(frame);
});
