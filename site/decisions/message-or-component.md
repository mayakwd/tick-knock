# Message or component?

**Short answer:** everything that happens inside the game is a component or a tag, and systems handle it. A message
is for the world outside of the engine: the user interface, sounds, analytics.

## Tags and components are events

Something has happened, and somebody should react to it. In ECS, it's data added to an entity, and systems, that are
interested in it, handle it in their turn:

```typescript
// The collision system destroys the asteroid
asteroid.add(DESTROYED);

// The split system handles destroyed asteroids
export class SplitSystem extends IterativeSystem.of(Asteroid, Position, DESTROYED) {
  // ...
}
```

The collision system doesn't know that asteroids split, and the split system doesn't know what has destroyed the
asteroid. Both of them are just systems in the list, so it's easy to see when the reaction happens: right where the
system is added.

A hit in the [Bullet hell](/tutorials/bullet-hell) is a component too. The collision system appends a `Hit` to the hit
entity, and systems of enemies and of the player decide what a hit does.

## Components describe states

Invulnerability after a hit lasts two seconds. During these seconds the collision system must skip the player, and
rendering must make it blink. It's a state, that is checked every update, so it's a component:

```typescript
player.add(new Invulnerable(INVULNERABILITY_TIME));
```

And when the player becomes invulnerable, the screen is cleared from enemy bullets. That's a reaction system of the
component:

```typescript
engine.reactive([Invulnerable, PLAYER], {
  added: () => enemyBullets.forEach((bullet) => bullet.add(DESTROYED)),
});
```

## Messages are for the outside world

The user interface is not a system. It doesn't take part in the update, and it wants to know when something has
happened: to show the game over screen, or to play a sound. That's what messages are for:

```typescript
// In the collision system of Asteroids
ship.add(DESTROYED);
this.dispatch(new GameOver());

// In the demo, that runs the game in a page
game.engine.subscribe(GameOver, (message) => {
  this.gameOver = message;
});
```

Every example dispatches `GameOver` from the system, that has noticed the end of the game, and the
[demo](/tutorials/demo) shows it. Nothing inside the game subscribes to it. The same way a game could tell the outside
world that points are scored, to play a sound, or that a record is set, to save it.

What the outside world only reads, like the score in the status line, doesn't need messages: the status line reads it
every frame.

> 💡 Messages are synchronous: the handler runs inside `dispatch`, maybe in the middle of the update. That's another
> reason to keep the game logic in systems, where the order is clear.
