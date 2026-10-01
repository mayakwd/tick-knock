<script setup lang="ts">
import {onBeforeUnmount, onMounted, ref} from 'vue';

type Game = 'snake' | 'asteroids' | 'bullet-hell' | 'tower-defense';

/**
 * A game started in the element, destroyed when the page is left
 */
interface RunningGame {
  destroy(): void;
}

type StartGame = (element: HTMLElement) => Promise<RunningGame>;

const props = defineProps<{ game: Game }>();
const container = ref<HTMLElement>();
let running: RunningGame | undefined;
let unmounted = false;

/**
 * Games that are not migrated to pages yet export a function, that starts the game and returns a function stopping it
 */
function fromMount(mount: (element: HTMLElement) => Promise<() => void>): StartGame {
  return async (element) => ({destroy: await mount(element)});
}

/**
 * Games are loaded only in the browser and only on pages that show them
 */
const games: Record<Game, () => Promise<StartGame>> = {
  'snake': () => import('@examples/snake/mount').then((module) => fromMount(module.mountSnake)),
  'asteroids': () => import('@examples/asteroids/mount').then((module) => fromMount(module.mountAsteroids)),
  'bullet-hell': () => import('@examples/bullet-hell/mount').then((module) => fromMount(module.mountBulletHell)),
  'tower-defense': async () => {
    const [{Demo}, {TowerDefensePage}] = await Promise.all([
      import('@examples/shared/demo/Demo'),
      import('@examples/tower-defense/TowerDefensePage'),
    ]);
    return (element) => Demo.mount(element, new TowerDefensePage());
  },
};

onMounted(async () => {
  // The element is taken before loading, because Vue clears the reference when the page is left
  const element = container.value;
  if (element === undefined) return;
  try {
    const start = await games[props.game]();
    // The page could be left while the game was loading
    if (unmounted) return;
    const game = await start(element);
    if (unmounted) {
      game.destroy();
    } else {
      running = game;
    }
  } catch (error) {
    console.error(`Failed to start the ${props.game} example`, error);
  }
});

onBeforeUnmount(() => {
  unmounted = true;
  running?.destroy();
});
</script>

<template>
  <div ref="container" class="game-demo"></div>
</template>

<style scoped>
.game-demo {
  display: flex;
  justify-content: center;
  margin: 16px 0;
  min-height: 200px;
}

.game-demo :deep(canvas) {
  border: 1px solid var(--vp-c-divider);
  border-radius: 8px;
}
</style>
