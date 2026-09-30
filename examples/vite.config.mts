import {fileURLToPath} from 'node:url';
import {defineConfig} from 'vite';

const page = (path: string) => fileURLToPath(new URL(path, import.meta.url));

export default defineConfig({
  resolve: {
    alias: {
      // Examples use sources of the library, so they don't need a build of it
      'tick-knock': page('../src/index.ts'),
    },
  },
  build: {
    rollupOptions: {
      input: {
        index: page('index.html'),
        snake: page('snake/index.html'),
        asteroids: page('asteroids/index.html'),
      },
    },
  },
});
