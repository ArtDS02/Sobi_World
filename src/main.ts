// Entry point: create the store, mount the DOM UI, load the save.
import './styles/main.scss';
import { realClock } from './store/runtime';
import { createGameStore } from './store/gameStore';
import { mountApp } from './ui/app';

const root = document.querySelector<HTMLDivElement>('#app');
if (root) {
  const store = createGameStore();
  mountApp(root, store, () => realClock.now());
  void store.init();
}
