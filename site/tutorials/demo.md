# Demo skeleton

Every game of the tutorials is started in a page the same way. It needs a pixi.js application, the keyboard, a status
line, and a game loop. While nobody plays, an autopilot plays instead, and when the autopilot loses, the game starts
over. When you click the game, you take control.

All of this is the `Demo` class, and every game extends it. In this part, we will see how it works, so the tutorials
can focus on the games themselves.

## The game and the autopilot

The demo works with any game that has an engine:

```typescript
export interface DemoGame {
  readonly engine: Engine;
}
```

Why the engine? The demo is the world outside of the game, and the game tells the outside world about important things
with [messages](/guide/messages). When the game is over, the system, that has noticed it, dispatches `GameOver`:

<<< @/../examples/shared/GameOver.ts

The demo subscribes to it, and shows the message. The game logic doesn't need the message at all: it's only for those,
who watch the game from outside.

And with an autopilot, that sets controls of the game before every update:

```typescript
export interface Autopilot {
  update(): void;
}
```

That's all the demo needs to know. How the game moves, collides, and scores is up to the game.

## The Demo class

<<< @/../examples/shared/Demo.ts

Let's go through it:

- `mount` creates the pixi.js application in the element, and adds layers to the stage: the background, the world with
  views of entities, overlays, and the status line on top.
- `restart` destroys views of the previous game, creates a new game with its autopilot, and subscribes to `GameOver`.
- Every frame, `onTick` limits the time of the frame, so the game doesn't jump after the tab was in background, advances
  the game, and updates the status line.
- `control` gives control to the player while the game is focused, and to the autopilot otherwise.
- When the game is over, the demo shows it. The game played by the autopilot restarts by itself, the game played by
  the player is restarted with R.

## What a game describes

A game extends `Demo` and describes itself:

| Member | What it does |
| :--- | :--- |
| `createGame(layer)` | Creates the game, which views are added to the layer. |
| `createAutopilot(game)` | Creates the autopilot of the game. |
| `advance(dt)` | Advances the game by the time of the frame. Usually it's `this.control()` and `this.game.update(dt)`. |
| `status` | Text of the status line: the score, the wave, and so on. |
| `readInput()` | Reads the keyboard while the player plays. |
| `setup()` | Adds what the game needs besides the world, once. For example, a map or pointer input. |

Here is the whole demo of Asteroids:

<<< @/../examples/asteroids/mount.ts

`mountAsteroids` starts the demo in an element of a page, and returns a function that stops it. Pages of the examples
and the documentation start games with such functions.

> 💡 The demo knows almost nothing about ECS. The game is an engine with systems, and the demo only runs it in a page,
> and listens to its messages.

## The keyboard

The keyboard is read only while the game is focused, so an embedded game doesn't steal arrows and space from the page:

<<< @/../examples/shared/demo/Keyboard.ts

## The status line

<<< @/../examples/shared/render/Hud.ts

Now, let's build the games! Start with [Snake](/tutorials/snake).
