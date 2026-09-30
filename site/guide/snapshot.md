# Snapshot

As you may have noticed, when we are tracking changes in Query, we get in `entityAdded` and `entityRemoved` not `Entity`
but `EntitySnapshot`.
**So what is a snapshot?**
It is a container that displays the difference between the current state of Entity and its previous state:

- `current` is the entity itself in its current state.
- `previous` is a read-only copy of the entity as it was before the change.

Compare them to understand which components have been added and which have been removed.

> 💡 `previous` is restored lazily, when it's accessed for the first time, so it costs nothing if you don't use it.
> Snapshots are reused by queries, so don't keep them after the handler has returned: a kept snapshot reflects the
> entity at the moment of access, not at the moment of the change.

> ❗ It is important to note that changes in the same entity components' data will not be reflected in the snapshot, even
> if a manual invalidation of the entity has been triggered.

Snapshots are very handy when you need to get a component or tag in Entity, but now it is missing. Let's take a closer
look at it with our `ViewSystem` example.
**Example:**

```typescript
class ViewSystem extends IterativeSystem {
  // ...
  protected entityAdded = ({current}: EntitySnapshot) => {
    // When entity added to the Query that means that it has `View` 
    // component - one hundred percent! So we just need its current 
    // state. 
    this.container.addChild(current.get(View)!.view);
    this.updatePosition(current);
  };

  protected entityRemoved = ({previous}: EntitySnapshot) => {
    // But when entity removed - we can't be sure that current state 
    // of the entity has `View` component. So we need to get it from
    // the previous state. Previous state has it one hundred percent.
    this.container.removeChild(previous.get(View)!.view);
  };
  // ...
}
```
