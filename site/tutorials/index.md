# Tutorials

Every tutorial builds a small game from scratch. They go from simple to complex, and every next one introduces new
features of Tick-Knock and new ways of thinking in ECS, so it's better to read them in order.

| Tutorial | You will learn |
| :--- | :--- |
| [Demo skeleton](/tutorials/demo) | How every game is started in a page, played by an autopilot and controlled by the player |
| [Snake](/tutorials/snake) | Components, tags, entities, the first systems, messages and rendering |
| [Asteroids](/tutorials/asteroids) | Continuous movement, functional systems, collisions and safe removal |
| [Bullet hell](/tutorials/bullet-hell) | Hundreds of entities, data-driven design and temporary components |
| [Tower defense](/tutorials/tower-defense) | Linked components, game state outside of entities and references between entities |

Code in tutorials is the code of the [examples](/examples/), so you can open the whole game at any moment and see how
everything fits together.

## Before you start

You need to know TypeScript, and it's good to read the [Guide](/guide/) first, at least [Engine](/guide/engine),
[Component](/guide/component), [Entity](/guide/entity) and [Query](/guide/query). Tutorials render games with
[pixi.js](https://pixijs.com), but you don't need to know it: rendering is always a small separate part, and it's
explained when it appears.

To run the games locally:

```shell
git clone https://github.com/mayakwd/tick-knock.git
cd tick-knock
pnpm install
pnpm --filter tick-knock-examples dev
```
