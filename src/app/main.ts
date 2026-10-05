// Entry point. The game modules are imported dynamically so that a content file failing validation
// (ARCHITECTURE §8: a development bug, never a player state) shows a readable error screen instead of
// a blank window.
import '../styles/main.scss';
import { renderStartupError } from '../ui/startupError';

const root = document.querySelector<HTMLDivElement>('#app');
if (root) {
  import('./start')
    .then((m) => m.start(root))
    .catch((e: unknown) => root.replaceChildren(renderStartupError(e)));
}
