# Demo skeleton

Every game of the tutorials is started in a page the same way. It needs a pixi.js application, the keyboard, a status
line, and a game loop. While nobody plays, an autopilot plays instead, and when the autopilot loses, the game starts
over. When you click the game, you take control.

All of this is the `Demo` class, and every game extends it. In this part, we will see how it works, so the tutorials
can focus on the games themselves.

## The game and the autopilot

The demo works with any game that tells whether it's over:

```typescript
export interface DemoGame {
  readonly isOver: boolean;
}
```

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
- `restart` destroys views of the previous game, and creates a new game with its autopilot.
- Every frame, `onTick` limits the time of the frame, so the game doesn't jump after the tab was in background, advances
  the game, and updates the status line.
- `control` gives control to the player while the game is focused, and to the autopilot otherwise.
- When the autopilot loses, the game restarts by itself. When the player loses, R restarts it.

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

> 💡 The demo doesn't know anything about ECS. The game is still an engine with systems, and the demo only runs it in
> a page.

## The keyboard

The keyboard is read only while the game is focused, so an embedded game doesn't steal arrows and space from the page:

<<< @/../examples/shared/Keyboard.ts

## The status line

<<< @/../examples/shared/render/Hud.ts

Now, let's build the games! Start with [Snake](/tutorials/snake).
