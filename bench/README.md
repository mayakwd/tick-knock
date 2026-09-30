# Tick-Knock Benchmarks

Benchmarks of tick-knock and other TypeScript ECS libraries.

# Table of contents

- [Running]
- [How it works]
- [Scenarios]
- [Libraries]
- [Adding a scenario]
- [Adding a library]

# Running

The benchmark is a package of the pnpm workspace, so its dependencies are installed together with the dependencies
of tick-knock by `pnpm install`. Benchmarks are run from the repository root, the command builds tick-knock and runs
all scenarios:

```shell
pnpm bench                                # current sources and other ECS libraries
pnpm bench --baseline 4.3.0               # also a published tick-knock version, installed from npm
pnpm bench --baseline ../other/lib        # also another tick-knock build
pnpm bench --baseline ../other/lib --baseline-name old  # the same, with a custom name in the report
pnpm bench --libraries none               # only tick-knock builds
pnpm bench --libraries bitecs,miniplex    # only specified other libraries
pnpm bench --filter churn --time 2000     # only matching scenarios, 2 seconds per scenario
```

The result is printed as a markdown table, the best result in every scenario is marked with bold.

# How it works

- Every scenario of every library runs in its own process, so JIT optimizations and garbage of one library never
  affect another one.
- A scenario is warmed up first, then every operation is measured separately. The result is the median of
  operations per second, the deviation is the median absolute deviation. Median is not affected by occasional
  garbage collection pauses.
- Setup of a scenario, for example creating the world, is not measured.
- Memory is measured as heap growth after creating entities, with garbage collection before and after.
- Libraries that update queries lazily (Ape-ECS, bitecs) are asked to update them at the end of every operation,
  so every library does the same amount of work.
- Scenarios can verify their result after the first run, for example that every change was reported to a reactive
  system. The benchmark fails if the result is wrong, so a library can't win by doing less work.

# Scenarios

Scenarios are described in [Scenario.ts](src/Scenario.ts). Every library implements scenarios in the idiomatic way,
scenarios that don't fit the library are not implemented and are shown as "–" in the report.

| Scenario | Description |
| :--- | :--- |
| insert | create 1000 entities with 4 components in a world with 11 queries |
| iterate small | one update of a system, that adds Velocity to Position of 1000 entities with 4 components |
| iterate large | one update of 3 systems, that swap component values of 50k entities (ecs_bench_suite "schedule") |
| component churn | add and remove a component, that changes query membership, on 1000 of 10000 entities |
| unrelated churn | add and remove a component, that no query depends on, on 1000 of 10000 entities |
| tag churn | add and remove a tag, that changes query membership (tick-knock only) |
| spawn/despawn | create 1000 entities and remove 1000 oldest ones, keeping 10000 entities in the world |
| reactive system | a system reacts on entities added to and removed from its query, toggle a component on 1000 of 10000 entities |
| linked components | append, iterate and withdraw linked components (tick-knock only) |
| messages | dispatch 10000 messages of 10 types (tick-knock only) |
| memory per entity | heap size per entity with 2 components, for 50000 entities in a world with 3 queries |

Iteration scenarios are based on [ecs_bench_suite](https://github.com/rust-gamedev/ecs_bench_suite).
tick-knock builds that support `IterativeSystem.of` use it in iteration scenarios, older builds use `entity.get`.

# Libraries

| Library | Storage | Notes |
| :--- | :--- | :--- |
| [tick-knock](https://github.com/mayakwd/tick-knock) | objects | |
| [Ape-ECS](https://github.com/fritzy/ape-ecs) | objects | queries are updated lazily; removed components are destroyed, so reactions only count removals |
| [bitecs](https://github.com/NateTheGreatt/bitECS) | struct of arrays | components are arrays of numbers indexed by entity id |
| [ecsy](https://github.com/ecsyjs/ecsy) | objects | components are pooled; reactive queries collect events until the world is executed |
| [miniplex](https://github.com/hmans/miniplex) | objects | entities are plain objects |
| [sim-ecs](https://github.com/NSSTC/sim-ecs) | objects | entities are created before the run, so churn scenarios are not implemented; every step of the world has noticeable overhead |

# Adding a scenario

1. Add an identifier to `ScenarioId` and a description to `scenarios` in [Scenario.ts](src/Scenario.ts).
   Put sizes of the scenario to `Sizes`, so all libraries use the same sizes.
2. Implement the scenario in [TickKnock.ts](src/libraries/TickKnock.ts) and in other libraries where it fits.

A scenario is a factory, that prepares the world and returns a `Benchmark`. Its `run` method is measured, and its
optional `reset` method is invoked after every run without measuring.

# Adding a library

1. Add the library to `dependencies` in [package.json](package.json) with the exact version.
2. Create an adapter in [src/libraries](src/libraries), that returns `Library` with implemented scenarios.
3. Register the adapter in `otherLibraries` in [src/libraries/index.ts](src/libraries/index.ts).

[Running]: #running

[How it works]: #how-it-works

[Scenarios]: #scenarios

[Libraries]: #libraries

[Adding a scenario]: #adding-a-scenario

[Adding a library]: #adding-a-library
