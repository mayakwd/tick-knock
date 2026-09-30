import {fileURLToPath} from 'node:url';
import {defineConfig} from 'vite';

export default defineConfig({
  resolve: {
    alias: {
      // Examples use sources of the library, so they don't need a build of it
      'tick-knock': fileURLToPath(new URL('../../src/index.ts', import.meta.url)),
    },
  },
});
