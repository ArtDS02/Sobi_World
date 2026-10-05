// Entry point of the farm canvas (spec §4, §11): mounts Phaser into the DOM stage host and exposes
// the small handle the DOM shell needs (selection in, visibility). Phaser draws the world only.
import { FARM_LAYOUT } from './config/layout';
import * as Phaser from 'phaser';
import type { AssetRegistry } from '../../../core/assets/registry';
import type { FarmAction } from './config/layout';
import type { DayPhase } from '../../../core/config/dayNight';
import type { SeasonId } from '../../../core/config/seasons';
import type { FarmStore } from '../store';
import { phaserConfig } from './config/phaser';
import { noEffects, type FarmEffects } from './feedback/effects';
import { BootScene } from './scenes/BootScene';
import { MainFarmScene } from './scenes/MainFarmScene';
import { PreloadScene } from './scenes/PreloadScene';

export interface FarmDeps {
  store: FarmStore;
  assets: AssetRegistry;
  now: () => number;
  /** Every canvas click: a pig, a world object with an `action`, or empty ground. */
  onPick: (pick: FarmPick) => void;
}

export type FarmPick =
  | { kind: 'pig'; pigId: string }
  | { kind: 'gift'; giftId: string }
  | { kind: 'action'; action: FarmAction }
  | { kind: 'ground' };

/** Shared between the handle and MainFarmScene. */
export interface FarmBridge {
  selectedId: string | null;
  /** Re-sync the farm from the latest snapshot; a no-op until the scene runs. */
  refresh: () => void;
  /** Feedback on the scene (§11.3); no-op until MainFarmScene runs. */
  effects: FarmEffects;
  /** Admin / dev day-night preview (DN): shown instead of the clock's phase; never saved. */
  phasePreview: DayPhase | null;
  /** Admin / dev season preview (SE-1): shown instead of the calendar's season; never saved. */
  seasonPreview: SeasonId | null;
  /** The farm scene is up: the loading screen is gone (AM-1: the HUD waits for it). */
  loaded: () => void;
}

export interface FarmView {
  /** The FeedbackDirector's way into the scene; read at call time (the scene starts later). */
  effects(): FarmEffects;
  setSelected(pigId: string | null): void;
  /** Day / night preview (dev / admin only): a phase, or null to follow the local clock again. */
  previewPhase(phase: DayPhase | null): void;
  /** Season preview (dev / admin only): a season, or null to follow the local calendar again. */
  previewSeason(season: SeasonId | null): void;
  /** Hidden on other screens: the loop sleeps, and the scale is refreshed when shown again. */
  setVisible(visible: boolean): void;
  /** Measured frames per second of the farm loop (dev tools), null before it runs. */
  fps(): number | null;
  destroy(): void;
}

export function createFarmView(host: HTMLElement, deps: FarmDeps): FarmView {
  const bridge: FarmBridge = {
    selectedId: null,
    refresh: () => {},
    effects: noEffects,
    phasePreview: null,
    seasonPreview: null,
    loaded: () => delete host.dataset.farmLoading,
  };
  host.dataset.farmLoading = ''; // HUD hidden over the loading screen (styles/core/_layout.scss)
  const scenes = [new BootScene(deps.assets), new PreloadScene(deps, bridge), new MainFarmScene(deps, bridge)];
  const game = new Phaser.Game(phaserConfig(host, FARM_LAYOUT, scenes));
  let visible = true;
  // The canvas takes the host's size (never 0: a hidden host keeps the last size).
  const fitHost = () => {
    if (host.clientWidth > 0 && host.clientHeight > 0) {
      game.scale.resize(host.clientWidth, host.clientHeight);
    }
  };
  fitHost();
  let running = false;
  const applyVisible = () => {
    if (visible) {
      game.loop.wake();
      fitHost(); // the host was display:none: measure it now
    } else {
      game.loop.sleep();
    }
  };
  // The loop only starts after READY; apply a hide requested earlier on the first step.
  game.events.once(Phaser.Core.Events.STEP, () => {
    running = true;
    applyVisible();
  });
  // §10.4: the canvas follows its container (window resize, F11, a banner appearing above it):
  // the canvas fills it and each scene's camera fits the design frame (fitCamera).
  const resize = new ResizeObserver(() => {
    if (visible) fitHost();
  });
  resize.observe(host);

  return {
    setSelected(pigId) {
      if (bridge.selectedId === pigId) return;
      bridge.selectedId = pigId;
      bridge.refresh();
    },
    previewPhase(phase) {
      if (bridge.phasePreview === phase) return;
      bridge.phasePreview = phase;
      bridge.refresh();
    },
    previewSeason(season) {
      if (bridge.seasonPreview === season) return;
      bridge.seasonPreview = season;
      bridge.refresh();
    },
    setVisible(next) {
      if (visible === next) return;
      visible = next;
      if (running) applyVisible();
    },
    effects: () => bridge.effects,
    fps: () => (running ? game.loop.actualFps : null),
    destroy: () => {
      resize.disconnect();
      game.destroy(true);
    },
  };
}
