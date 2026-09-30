# Benchmarks

The repository contains benchmarks, that compare Tick-Knock with its previous version and with other TypeScript ECS
libraries: Ape-ECS, becsy, bitecs, ecsy, geotic, koota, miniplex and sim-ecs. Every library implements scenarios in its
idiomatic way, and every scenario verifies its result, so a library can't win by doing less work.

Benchmarks run in CI on a dedicated bare metal machine with [Bencher](https://bencher.dev/perf/tick-knock), so results
are comparable between runs, and every pull request shows how it affects performance.

<!-- benchmarks:start -->

Measured on [Bencher](https://bencher.dev/perf/tick-knock) bare metal runner (Intel, 4 cores), Node 22.

Speed is measured in operations per second (more is better), memory in bytes per entity (less is better).
The best result in every scenario is marked with bold, "–" means that scenario is not implemented by the library.

| Scenario | tick-knock (current) | tick-knock 4.3.0 | Ape-ECS 1.3.1 | becsy 0.15.5 | bitecs 0.4.0 | ecsy 0.4.3 | geotic 4.3.2 | koota 0.6.6 | miniplex 2.0.0 | sim-ecs 0.6.4 |
| :--- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| insert | **1,716** | 131 | 140 | 625 | 665 | 479 | 251 | 804 | 1,040 | 202 |
| iterate small | 147,449 | 16,270 | 76,301 | 4,255 | **165,317** | 43,371 | 134,553 | 100,080 | 56,309 | 2,259 |
| iterate large | 1,060 | 96.4 | 269 | 60.5 | **2,229** | 185 | 480 | 1,431 | 431 | 1,142 |
| component churn | **1,821** | 36.7 | 247 | 1,583 | 798 | 610 | 415 | 1,392 | 284 | – |
| unrelated churn | **5,126** | 37.4 | 251 | 2,265 | 2,491 | 1,159 | 552 | 2,613 | 329 | – |
| tag churn | **3,163** | 41.0 | – | – | – | – | – | – | – | – |
| spawn/despawn | **1,095** | 17.1 | 75.2 | 333 | 396 | 22.1 | 18.6 | 230 | 591 | – |
| reactive system | 1,949 | 157 | 431 | 1,328 | 1,385 | 649 | 654 | **2,394** | 532 | – |
| linked components | **695** | 52.9 | – | – | – | – | – | – | – | – |
| messages | **262** | 192 | – | – | – | – | – | – | – | – |
| memory per entity | 368 B | 1,472 B | 1,737 B | **216 B** | 282 B | 911 B | 406 B | 370 B | 256 B | 674 B |

<!-- benchmarks:end -->

## Scenarios

| Scenario | What is measured |
| :--- | :--- |
| insert | create 1000 entities with 4 components in a world with 11 queries |
| iterate small | one update of a system, that adds Velocity to Position of 1000 entities with 4 components |
| iterate large | one update of 3 systems, that swap component values of 50k entities (ecs_bench_suite "schedule") |
| component churn | add and remove a component, that changes query membership, on 1000 of 10000 entities |
| unrelated churn | add and remove a component, that no query depends on, on 1000 of 10000 entities |
| tag churn | add and remove a tag, that changes query membership, on 1000 of 10000 entities |
| spawn/despawn | create 1000 entities and remove 1000 oldest ones, keeping 10000 entities in the world |
| reactive system | a system reacts on entities added to and removed from its query, toggle a component on 1000 of 10000 entities |
| linked components | append 4 linked components to each of 1000 entities, iterate over them, then withdraw all |
| messages | dispatch 10000 messages of 10 types, every type has a subscriber |
| memory per entity | memory per entity with 2 components, for 50000 entities in a world with 3 queries |

See [bench/README.md](https://github.com/mayakwd/tick-knock/blob/develop/bench/README.md) for details of how the
benchmarks work.

## Running locally

```shell
pnpm bench                          # benchmark current sources and other ECS libraries
pnpm bench --baseline 4.3.0         # also benchmark a published tick-knock version
pnpm bench --filter iterate         # run only matching scenarios
```

Results on a developer machine are noisy and can't be compared between machines, but they are good enough to compare
two versions of the code on the same machine.
