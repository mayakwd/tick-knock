<script setup lang="ts">
import {onBeforeUnmount, onMounted, ref} from 'vue';

type Game = 'snake' | 'asteroids' | 'bullet-hell' | 'tower-defense';

const props = defineProps<{ game: Game }>();
const container = ref<HTMLElement>();
let destroy: (() => void) | undefined;
let unmounted = false;

/**
 * Games are loaded only in the browser and only on pages that show them
 */
const games: Record<Game, () => Promise<(element: HTMLElement) => Promise<() => void>>> = {
  'snake': () => import('@examples/snake/mount').then((module) => module.mountSnake),
  'asteroids': () => import('@examples/asteroids/mount').then((module) => module.mountAsteroids),
  'bullet-hell': () => import('@examples/bullet-hell/mount').then((module) => module.mountBulletHell),
  'tower-defense': () => import('@examples/tower-defense/mount').then((module) => module.mountTowerDefense),
};

onMounted(async () => {
  // The element is taken before loading, because Vue clears the reference when the page is left
  const element = container.value!;
  try {
    const mount = await games[props.game]();
    // The page could be left while the game was loading
    if (unmounted) return;
    const stop = await mount(element);
    if (unmounted) {
      stop();
    } else {
      destroy = stop;
    }
  } catch (error) {
    console.error(`Failed to start the ${props.game} example`, error);
  }
});

onBeforeUnmount(() => {
  unmounted = true;
  destroy?.();
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
