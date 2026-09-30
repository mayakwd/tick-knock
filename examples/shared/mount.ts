import {Application} from 'pixi.js';

/**
 * Starts the game inside the element and returns a function that stops it and releases all resources.
 * Every example exports such a function, so it can be started on its own page and embedded into the documentation.
 */
export type MountGame = (element: HTMLElement) => Promise<() => void>;

export interface ApplicationOptions {
  width: number;
  height: number;
  background: number;
}

/**
 * Creates a pixi.js application and appends its canvas to the element
 */
export async function createApplication(element: HTMLElement, {width, height, background}: ApplicationOptions): Promise<Application> {
  const app = new Application();
  await app.init({width, height, background, antialias: true, resolution: window.devicePixelRatio, autoDensity: true});
  // The canvas shrinks on narrow pages, and keeps its proportions
  app.canvas.style.maxWidth = '100%';
  app.canvas.style.height = 'auto';
  app.canvas.style.outline = 'none';
  element.appendChild(app.canvas);
  return app;
}

/**
 * Converts the time elapsed since the previous frame to seconds. It's limited, so the game doesn't jump
 * after the tab was in background.
 */
export function frameTime(deltaMS: number): number {
  return Math.min(deltaMS / 1000, 0.05);
}
