// Entry point: create the store, mount the DOM UI, load the save.
import './styles/main.scss';
import type { Clock } from './core/clock';
import { createGameStore } from './store/gameStore';
import { realClock } from './store/runtime';
import { mountApp, type AppOptions } from './ui/app';

async function start(root: HTMLElement) {
  let clock: Clock = realClock;
  const opts: AppOptions = {};
  let skip: ((ms: number) => void) | null = null;

  // Dev-only time travel: `npm run dev` + ?dev=1. Dead code in production builds.
  if (import.meta.env.DEV && new URLSearchParams(location.search).has('dev')) {
    const dev = await import('./ui/devTools');
    const offset = dev.devClockOffset();
    clock = { now: () => offset.now(realClock.now()) };
    opts.devTools = dev.renderDevTools((ms) => skip?.(ms));
    skip = (ms) => {
      offset.add(ms);
      store.tick();
    };
  }

  const store = createGameStore({ clock });
  mountApp(root, store, () => clock.now(), opts);
  await store.init();
}

const root = document.querySelector<HTMLDivElement>('#app');
if (root) void start(root);
