# 4.0.3

Features:

- Linked components now have an optional id, and can be picked with `pick` by id.

Fixes:

- Fixed usage sample for LinkedComponents

# 4.0.2

Fixes:

- If IterativeSystem was removed from the engine and added again later, no iteration took place.

# 4.0.1

Fixes:

- ReactionSystem now exported through index.ts

# 4.0.0

Features:

- Added a new convenient API for working with linked components:
  - Method `withdraw` removes the first LinkedComponent component of the provided type or existing standard component
  - Method `pick` removes provided LinkedComponent component instance or existing standard component
  - Method `iterate` iterates over instances of LinkedComponent and performs the `action` over each. Works for standard
    components (action will be called for a single instance in this case).
  - Method `find` searches a component instance of the specified class. Works for standard components (predicate will be
    called for a single instance in this case).
  - Method `getAll` returns a generator that can be used for iteration over all instances of specific type components.
  - Method `lengthOf` returns the number of existing components of the specified class.

Breaking changes:

- Signals `onComponentAdded`, `onComponentRemoved` now will be triggered for every LinkedComponent.
- Adding a linked component with `add` or `addComponent` will remove all existing linked components of the same type.
  Linked components will be replaced even if the passed component already exists in the Entity.

# 3.0.1

Fixes:

- `EntitySnapshot.current` now is writable.
- Added inline documentation to `EntitySnapshot.previous`.

# 3.0.0

Features:

- Added shared config entity, that is accessible across all systems added to `Engine`
- Added possibility to retrieve `Entity` from `Engine` by id

Breaking changes:

- Parameter `engine` was removed from `onAddedToEngine` and `onRemovedFromEngine` methods in the systems. Use `this.engine` instead.
- `EntitySnapshot` was reimplemented. It has distinguished fields `EntitySnapshot.current and `EntitySnapshot.previous`,
  which reflects current and previous Entity states accordingly.
- `Entity.components` now represented as a `Record` instead of the `Map`

Improvements:

- Typed-signals was replaced with the built-in light-weight implementation.
- `EntitySnapshot` won't be created if there are no change listeners.

Fixes:

- `Entity.copyFrom` now copies tags.
- `EntitySnapshot` now works properly with the tags. Previously, the difference between the previous state and the
  current state did not show changes in the tags.
- `EntitySnapshot` now works properly with the resolveClass.

# 2.2.0

Features:

- Add linked components Fixed:
- Documentation readability

# 2.1.0

Features:

- Add possibility to set any type as the message type for subscription

# 2.0.2

- Fixed broken Class API

# 2.0.1

- Fixed broken API for QueryBuilder and Entity.remove

# 2.0.0
- Added tags support
- Added messaging channel for system->engine->user
- Fixed EntitySnapshot behavior
- Added `engine` getter in the System
- Added support of initialization ReactionSystem and IterativeSystem with QueryPredicate and QueryBuilder
- Query got possibility to check whether entity is in it, via `has` method
- Documentation completely rewritten

# 1.4.1

- Removed redundant `updateEntity` from `ReactionSystem`

# 1.4.0

- Added `ReactionSystem`
- Documentation updated

# 1.3.0

- Fixed critical issue with updating of a `Query`. Queries whose predicates were a set of conditions that went beyond the capabilities of QueryBuilder could incorrectly evaluate the presence state for Entity after removing or adding components.   

# 1.2.7

- Fixed wrong type inference for `Entity#hasAll` and `Entity#hasAny`
- Added several utility methods for `Query`

# 1.2.6

- Added `first`, `last` and `length` getter for queries

# 1.2.5

- Added feature of invalidation entity and queries
- Fixed disconnecting of entities from engine

# 1.2.4

- Switched to commonjs modules

# 1.2.3

- Reverted `IterativeSystem#entities` remove
- Added `IterativeSystem#prepare` protected method, which will be invoked after adding iterative system to engine

# 1.2.2

- Added Entity#hasAny, Entity#hasAll methods
- Fixed throwing an error with passing invalid value to param `component` of `Entity#add` method
- Removed redundant `entities` getter from `IterativeSystem`

# 1.2.1

- Fixed bug with disconnecting from Entity events after remove from Engine. 
- Added utility methods for clearing `Engine`. 
  - `Engine#clear()`
  - `Engine#removeAllSystems()`
  - `Engine#removeAllQueries()`
  - `Engine#removeAllEntities()`

# 1.2.0
- Changed logic of resolving of component identifier. Changes could affect resolving of inherited components. Now inherited components will not be resolved as its ancestors.
- Added parameter for Entity#add "resolveClass" - which specifies how could be resolved component.
- Updated documentation
- Added tests for Query#isEmpty 

# 1.1.2
- Added Query#isEmpty property

# 1.1.1
- Added documentation

# 1.1.0
- Fixed query onEntityAdded, onEntityRemoved handlers
- Added entity snapshot for properly handling of the entity changes

# 1.0.7
- Fixed false-positive query trigger

# 1.0.6
- Switched library target to ES5

# 1.0.5
- Updated documentation for every core type
- Added guard that stops updating process for IterativeSystem, if it was removed engine
- Fixed order of dispatching and removing of the component. Now dispatching happens before removing.
- Added "get accessor" to query entities from Iterative system 

# 1.0.0
- Initial release

