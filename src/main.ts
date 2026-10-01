// Composition root: pick the platform, create the store, mount the DOM UI + Phaser farm, load the save.
import './styles/main.scss';
import type { Clock } from './core/clock';
import { AudioManager, audioTracks, type AudioClip } from './game/audio/AudioManager';
import { createFarmView, type FarmView } from './game/farmView';
import { noEffects } from './game/feedback/effects';
import { createFeedbackDirector, type FeedbackDirector } from './game/feedback/FeedbackDirector';
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
  let showDevFps: (() => void) | null = null;

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
    const tools = opts.devTools;
    showDevFps = () => dev.showFps(tools, farmView?.fps() ?? null);
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
    backups: platform.backups,
  });
  platform.onFlushRequest(() => store.persistNow());
  // §12: the desktop shell allows autoplay; the browser build waits for the first gesture.
  const audio = new AudioManager(audioTracks(assets.registry), {
    createClip: (url): AudioClip => new Audio(url),
    settings: () => store.getSnapshot().save?.settings ?? null,
    unlocked: platform.kind === 'desktop',
    ...(import.meta.env.DEV ? { warn: (m: string) => console.warn(m) } : {}),
  });
  store.subscribe(() => {
    audio.sync();
    showDevFps?.();
  });
  if (platform.kind !== 'desktop') {
    const unlock = () => audio.unlock();
    document.addEventListener('pointerdown', unlock, { once: true, capture: true });
    document.addEventListener('keydown', unlock, { once: true, capture: true });
  }
  let director: FeedbackDirector | null = null;
  let farmView: FarmView | null = null;
  const app = mountApp(root, store, () => clock.now(), {
    ...opts,
    onPigTap: (pigId) => director?.pigTapped(pigId),
    dialogs: platform.dialogs,
    assets: assets.registry,
    saveFolder: platform.kind === 'desktop',
    version: platform.version,
    hasBackups: platform.backups !== null,
    farm: (host, onPick) =>
      (farmView = createFarmView(host, {
        store,
        assets: assets.registry,
        now: () => clock.now(),
        onPick,
      })),
  });
  // §11.3: every event and rejection becomes presentation here, and only here.
  director = createFeedbackDirector({
    store,
    effects: () => farmView?.effects() ?? noEffects,
    audio,
    toast: app.toast,
    away: app.showAway,
    skinName: (id) => assets.registry.skins.get(id)?.nameVi ?? id,
  });
  // §12: ui_click for every DOM button, through one delegated listener.
  root.addEventListener('click', (e) => {
    const button = e.target instanceof Element ? e.target.closest('button') : null;
    if (button && !button.disabled) director?.uiClick();
  });
  await store.init();
}

const root = document.querySelector<HTMLDivElement>('#app');
if (root) void start(root);
