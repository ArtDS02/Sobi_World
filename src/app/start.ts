// Composition root: pick the platform, create the store, mount the DOM UI + Phaser farm, load the save.
// Loaded by main.ts; importing this module validates the content files.
import '@fontsource/baloo-2/500.css';
import '@fontsource/baloo-2/700.css';
import type { Clock } from '../core/clock';
import type { DayPhase } from '../core/config/dayNight';
import type { SeasonId } from '../core/config/seasons';
import { PLAZA_LAYOUT } from '../areas/plaza/logic/config/content';
import { portalViews, type PortalView } from '../areas/plaza/logic/portals';
import { PlazaScene, PLAZA_SCENE_KEY } from '../areas/plaza/scene/PlazaScene';
import { AudioManager, audioTracks, type AudioClip } from '../areas/farm/scene/audio/AudioManager';
import { createFarmView, type FarmView } from '../areas/farm/scene/farmView';
import { noEffects } from '../areas/farm/scene/feedback/effects';
import { createFeedbackDirector, type FeedbackDirector } from '../areas/farm/scene/feedback/FeedbackDirector';
import { CHARACTER } from '../core/config/character';
import { newPlayer, PLAZA_ID, setPlayerSpot } from '../core/player/player';
import { createSettingsStore } from '../core/settings/settings';
import { renderWorldPrompt } from '../ui/components/worldPrompt';
import { el, patch } from '../ui/dom';
import { createControlInput } from '../ui/world/controlInput';
import type { WorldHost, WorldPrompt } from '../ui/world/host';
import { createKeySettings } from '../ui/world/keySettings';
import { createPlatform } from '../platform';
import { loadAssetRegistry } from '../platform/assetSource';
import { AREAS } from './areas';
import { createAreaFlow } from './areaFlow';
import { createGameStore } from './gameStore';
import { parseWorldSave } from './saveCodec';
import { farmStore } from '../areas/farm/store';
import { gardenArea } from '../areas/garden';
import { gardenPresentation } from '../areas/garden/feedback';
import { GARDEN_AREA_ID } from '../areas/garden/logic/config/content';
import { hasGarden } from '../areas/garden/logic/save/lens';
import { GardenScene, GARDEN_SCENE_KEY } from '../areas/garden/scene/GardenScene';
import { bindGardenStage } from '../areas/garden/stage';
import { createGardenUi } from '../areas/garden/ui/gardenUi';
import { vi } from '../i18n/vi';
import { t } from '../i18n/format';
import { realClock } from './runtime';
import { mountApp, type AppOptions, type MountedApp } from '../areas/farm/ui/app';
import { renderManifestError } from '../areas/farm/ui/screens/statusScreen';

export async function start(root: HTMLElement) {
  // §11.4: an invalid manifest is a startup error screen (a development bug, not a player state).
  const assets = await loadAssetRegistry();
  if (!assets.ok) {
    root.replaceChildren(renderManifestError(assets.message));
    return;
  }
  // The farm canvas draws text with Baloo 2: have it (bundled, never fetched online) before Phaser.
  await document.fonts.load('700 20px "Baloo 2"', 'Ủn Ỉn Cấp vàng').catch(() => []);
  let clock: Clock = realClock;
  const opts: AppOptions = {};
  let skip: ((ms: number) => void) | null = null;
  let showDevFps: (() => void) | null = null;
  let devPhase: DayPhase | null = null;
  let devSeason: SeasonId | null = null;

  // Dev-only time travel: `npm run dev` + ?dev=1. Dead code in production builds.
  if (import.meta.env.DEV && new URLSearchParams(location.search).has('dev')) {
    const dev = await import('../areas/farm/ui/devTools');
    const offset = dev.devClockOffset();
    clock = { ...realClock, now: () => offset.now(realClock.now()) };
    const gallery = await import('../ui/devGallery');
    opts.devTools = dev.renderDevTools(
      (ms) => skip?.(ms),
      () => gallery.openAssetGallery(root, assets.registry),
      () => void store.dispatch(dev.devFillPigs),
      (phase) => farmView?.previewPhase(phase),
      (season) => farmView?.previewSeason(season),
    );
    devPhase = dev.devPhaseParam();
    devSeason = dev.devSeasonParam();
    const tools = opts.devTools;
    showDevFps = () => dev.showFps(tools, farmView?.fps() ?? null);
    skip = (ms) => {
      offset.add(ms);
      store.tick();
    };
  }

  const platform = createPlatform(parseWorldSave);
  const world = createGameStore({
    clock,
    storage: platform.storage,
    instanceGuard: platform.instanceGuard,
    backups: platform.backups,
  });
  // The farm's screens and scene see the world through the farm facade (areas/farm/store.ts).
  const store = farmStore(world);
  platform.onFlushRequest(() => store.persistNow());

  // Player settings (keys) live in their own file, apart from the save (spec §4).
  const settings = createSettingsStore(platform.settings);
  await settings.init();
  const keys = () => settings.getSnapshot().settings.keys;
  const input = createControlInput(document, keys);
  const keySettings = createKeySettings(settings, input);
  // The key hint over the world: scenes report it, the DOM shows it with the player's own keys.
  const promptHost = el('div', { class: 'world-prompt-host' });
  let prompt: WorldPrompt | null = null;
  const showPrompt = () => patch(promptHost, renderWorldPrompt(prompt, keys()));
  settings.subscribe(showPrompt);
  // The plaza's doors from the save; the same object while nothing about them changed.
  let doors: { signature: string; views: ReadonlyMap<string, PortalView> } = { signature: '', views: new Map() };
  const portals = (): ReadonlyMap<string, PortalView> => {
    const save = world.getSnapshot().save;
    if (!save) return doors.views;
    const views = portalViews(AREAS.areas(save));
    const signature = JSON.stringify([...views.values()]);
    if (signature !== doors.signature) doors = { signature, views };
    return doors.views;
  };
  let app: MountedApp | null = null;
  // The Garden's DOM layer lives in an overlay the shell places over the world; its HUD shows only in the Garden.
  const gardenHost = el('div', { class: 'garden-host' });
  const gardenUi = createGardenUi({
    world,
    now: () => clock.now(),
    host: gardenHost,
    leave: () => void flow.go(PLAZA_ID),
    openPanel: (panel) => app?.openPanel(panel),
  });
  let director: FeedbackDirector | null = null;
  const host: WorldHost = {
    input,
    setPrompt(next) {
      prompt = next;
      showPrompt();
    },
    go: (place) => void flow.go(place),
    remember: (spot) => void world.dispatch((s, c) => setPlayerSpot(s, spot, c)),
    player: () => world.getSnapshot().save?.player ?? newPlayer(),
    character: () => settings.getSnapshot().settings.character,
    now: () => clock.now(),
    reduceMotion: () => store.getSnapshot().save?.settings.reduceMotion ?? false,
    paused: () => app?.isModalOpen() ?? false,
    denied: () => director?.denied(),
  };
  const flow = createAreaFlow({
    plaza: {
      enter: (from) => farmView?.showScene(PLAZA_SCENE_KEY, { from }),
      exit: () => farmView?.sleepScene(PLAZA_SCENE_KEY),
    },
    area: (id) => AREAS.get(id),
    changed: (to) => {
      prompt = null;
      showPrompt();
      app?.setPlace(to === PLAZA_ID ? 'plaza' : to === GARDEN_AREA_ID ? 'garden' : 'area');
      gardenUi.setActive(to === GARDEN_AREA_ID);
      // Leaving through a door keeps that Area as the place: the game reopens in front of its door.
      if (to !== PLAZA_ID) void world.dispatch((s, c) => setPlayerSpot(s, { area: to, x: null, y: null, facing: 'down' }, c));
    },
  });
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
  let farmView: FarmView | null = null;
  const mounted = mountApp(root, store, () => clock.now(), {
    ...opts,
    input,
    keySettings,
    gems: () => world.getSnapshot().save?.wallet.gems ?? null,
    characterChoice: {
      current: () => settings.getSnapshot().settings.character,
      choose: (id) => void settings.setCharacter(id),
      preview: (id) => assets.registry.url(CHARACTER.assets[id], 'down_idle'),
      subscribe: (fn) => settings.subscribe(fn),
    },
    leave: () => void flow.go(PLAZA_ID),
    goPlace: (place) => void flow.go(place),
    overlay: gardenHost,
    overlayModal: () => gardenUi.isModalOpen(),
    areaLines: (events) => {
      const save = world.getSnapshot().save;
      return save && hasGarden(save) ? (gardenArea.getSummary?.(events, save, clock.now()) ?? []) : [];
    },
    onPigTap: (pigId) => director?.pigTapped(pigId),
    dialogs: platform.dialogs,
    assets: assets.registry,
    saveFolder: platform.kind === 'desktop',
    version: platform.version,
    hasBackups: platform.backups !== null,
    farm: (stage, onPick) => {
      const plaza = new PlazaScene({
        layout: PLAZA_LAYOUT,
        character: CHARACTER,
        assets: assets.registry,
        host,
        portals,
      });
      const garden = new GardenScene({
        read: () => gardenUi.sceneState(),
        onPick: (pick) => gardenUi.pick(pick),
        reduceMotion: () => host.reduceMotion(),
        paused: () => host.paused(),
      });
      farmView = createFarmView(
        stage,
        {
          store,
          assets: assets.registry,
          now: () => clock.now(),
          onPick,
          // The game opens in the plaza (spec §3.1).
          firstScene: () => ({ key: PLAZA_SCENE_KEY, from: null }),
        },
        [plaza, garden],
      );
      const view = farmView;
      bindGardenStage({ enter: () => view.showScene(GARDEN_SCENE_KEY), exit: () => view.sleepScene(GARDEN_SCENE_KEY) });
      if (devPhase) farmView.previewPhase(devPhase);
      if (devSeason) farmView.previewSeason(devSeason);
      return farmView;
    },
  });
  app = mounted;
  app.setPlace('plaza');
  root.append(promptHost);
  // §11.3: every event and rejection becomes presentation here, and only here.
  director = createFeedbackDirector({
    store,
    effects: () => farmView?.effects() ?? noEffects,
    audio,
    toast: mounted.toast,
    away: mounted.showAway,
    other: (event, origin) => {
      if (event.type === 'AREA_UNLOCKED' && origin !== 'catchup') {
        const name = AREAS.get((event as unknown as { areaId: string }).areaId)?.manifest.name.vi ?? '';
        return { sound: 'level_up', toast: t(vi.plaza.opened, { name }) };
      }
      return gardenPresentation(event, origin);
    },
  });
  // §12: ui_click for every DOM button, through one delegated listener.
  root.addEventListener('click', (e) => {
    const button = e.target instanceof Element ? e.target.closest('button') : null;
    if (button && !button.disabled) director?.uiClick();
  });
  await store.init();
}
