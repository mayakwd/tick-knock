# Message or component?

**Short answer:** if something has happened, and somebody should react to it once, it's a message. If something is
going on for a while, and systems should process it every update, it's a component.

## Messages report events

A message is dispatched by a system and delivered to subscribers right away:

```typescript
// In the collision system
this.dispatch(new FoodEaten(body.length));

// In the game
engine.subscribe(FoodEaten, () => score++);
```

Messages keep systems independent. The collision system doesn't know about the score, the game over screen, or sounds:
it reports what has happened, and whoever is interested reacts.

In the [Bullet hell](/tutorials/bullet-hell), the game handles `PlayerHit`: it counts lives, and removes all enemy
bullets. The collision system knows about neither.

## Components describe states

Invulnerability after a hit lasts two seconds. During these seconds the collision system must skip the player, and
rendering must make it blink. It's a state, that is checked every update, so it's a component:

```typescript
player.add(new Invulnerable(INVULNERABILITY_TIME));
```

## Components as events

Sometimes an event must be processed by a system on the next update, not by a subscriber right away. Then it can be a
component too: for example, a `Damage` component added to an entity, processed and removed by the damage system. It
fits well when there are many such events, and they must be processed in a particular order with other systems.

> 💡 Messages are synchronous: the handler runs inside `dispatch`. Don't do heavy work in handlers, and remember that
> the engine may be in the middle of the update.
