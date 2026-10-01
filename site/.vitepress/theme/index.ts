import DefaultTheme from 'vitepress/theme';
import type {Theme} from 'vitepress';
import GameDemo from './GameDemo.vue';

export default {
  extends: DefaultTheme,
  enhanceApp({app}) {
    app.component('GameDemo', GameDemo);
  },
} satisfies Theme;
