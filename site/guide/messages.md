# Messages

An additional - one of the Engine's responsibilities - transferring the messages from systems to the user. This can be
very useful when, for example, you want to report that the round in your game is over.

```typescript
engine.subscribe(GameOver, (message: GameOver) => {
  if (message.win) {
    this.showWinMessage();
  } else {
    this.showLoseMessage();
  }
});
```

You can use not only class type as an argument but any value. For example, it could be a string or number.

```typescript
const GAME_OVER = 'gameOver';
engine.subscribe(GAME_OVER, () => {
  this.showGameOver();
});
```

> **Details of implementation**
>
> When the `dispatch` method is called in the system, then to get the right listeners, the compliance of
> the `messageType` for each subscription will be checked.
> - If `typeof subscription.messageType` is a `'function'`, then the matching will be performed using `instanceof`.
> - Otherwise, the matching will be done through strict equality `message === subscription.messageType`.
