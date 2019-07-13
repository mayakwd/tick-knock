# Feature release

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

