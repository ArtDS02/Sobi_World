// Composition root: pick the platform, create the store, mount the DOM UI + Phaser farm, load the save.
import './styles/main.scss';
import type { Clock } from './core/clock';
import { silentAudio } from './game/audio/audioPort';
import { createFarmView, type FarmView } from './game/farmView';
import { noEffects } from './game/feedback/effects';
import { createFeedbackDirector } from './game/feedback/FeedbackDirector';
import { createPlatform } from './platform';
import { loadAssetRegistry } from './platform/assetSource';
import { createGameStore } from './store/gameStore';
import { realClock } from './store/runtime';
import { mountApp, type AppOptions } from './ui/app';
import { renderManifestError } from './ui/screens/statusScreen';

async function start(root: HTMLElement) {
  // §11.4: an invalid manifest is a startup error screen (a development bug, not a player state).
  const assets = await loadAssetRegistry();
  if (!assets.ok) {
    root.replaceChildren(renderManifestError(assets.message));
    return;
  }
  let clock: Clock = realClock;
  const opts: AppOptions = {};
  let skip: ((ms: number) => void) | null = null;

  // Dev-only time travel: `npm run dev` + ?dev=1. Dead code in production builds.
  if (import.meta.env.DEV && new URLSearchParams(location.search).has('dev')) {
    const dev = await import('./ui/devTools');
    const offset = dev.devClockOffset();
    clock = { now: () => offset.now(realClock.now()) };
    const gallery = await import('./ui/devGallery');
    opts.devTools = dev.renderDevTools(
      (ms) => skip?.(ms),
      () => gallery.openAssetGallery(root, assets.registry),
    );
    skip = (ms) => {
      offset.add(ms);
      store.tick();
    };
  }

  const platform = createPlatform();
  const store = createGameStore({
    clock,
    storage: platform.storage,
    instanceGuard: platform.instanceGuard,
  });
  platform.onFlushRequest(() => store.persistNow());
  let farmView: FarmView | null = null;
  const app = mountApp(root, store, () => clock.now(), {
    ...opts,
    dialogs: platform.dialogs,
    assets: assets.registry,
    saveFolder: platform.kind === 'desktop',
    farm: (host, onPick) =>
      (farmView = createFarmView(host, {
        store,
        assets: assets.registry,
        now: () => clock.now(),
        onPick,
      })),
  });
  // §11.3: every event and rejection becomes presentation here, and only here.
  createFeedbackDirector({
    store,
    effects: () => farmView?.effects() ?? noEffects,
    audio: silentAudio, // R10 plugs in the real player
    toast: app.toast,
    skinName: (id) => assets.registry.skins.get(id)?.nameVi ?? id,
  });
  await store.init();
}

const root = document.querySelector<HTMLDivElement>('#app');
if (root) void start(root);
