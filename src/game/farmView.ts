// Entry point of the farm canvas (spec §4, §11): mounts Phaser into the DOM stage host and exposes
// the small handle the DOM shell needs (selection in, visibility). Phaser draws the world only.
import * as Phaser from 'phaser';
import type { AssetRegistry } from '../core/assets/registry';
import type { FarmAction } from '../core/config/assetIds';
import type { GameStore } from '../store/gameStore';
import { phaserConfig } from './config/phaser';
import { noEffects, type FarmEffects } from './feedback/effects';
import { BootScene } from './scenes/BootScene';
import { MainFarmScene } from './scenes/MainFarmScene';
import { PreloadScene } from './scenes/PreloadScene';

export interface FarmDeps {
  store: GameStore;
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
}

export interface FarmView {
  /** The FeedbackDirector's way into the scene; read at call time (the scene starts later). */
  effects(): FarmEffects;
  setSelected(pigId: string | null): void;
  /** Hidden on other screens: the loop sleeps, and the scale is refreshed when shown again. */
  setVisible(visible: boolean): void;
  /** Measured frames per second of the farm loop (dev tools), null before it runs. */
  fps(): number | null;
  destroy(): void;
}

export function createFarmView(host: HTMLElement, deps: FarmDeps): FarmView {
  const bridge: FarmBridge = { selectedId: null, refresh: () => {}, effects: noEffects };
  const scenes = [new BootScene(), new PreloadScene(deps), new MainFarmScene(deps, bridge)];
  const game = new Phaser.Game(phaserConfig(host, deps.assets.manifest.layout, scenes));
  let visible = true;
  let running = false;
  const applyVisible = () => {
    if (visible) {
      game.loop.wake();
      // The host was display:none; measure it now instead of waiting for Phaser's resize poll.
      game.scale.getParentBounds();
      game.scale.refresh();
    } else {
      game.loop.sleep();
    }
  };
  // The loop only starts after READY; apply a hide requested earlier on the first step.
  game.events.once(Phaser.Core.Events.STEP, () => {
    running = true;
    applyVisible();
  });
  // §10.4: the canvas follows its container (window resize, F11, a banner appearing above it),
  // letterboxed by Scale.FIT, never stretched.
  const resize = new ResizeObserver(() => {
    if (!running || !visible) return;
    game.scale.getParentBounds();
    game.scale.refresh();
  });
  resize.observe(host);

  return {
    setSelected(pigId) {
      if (bridge.selectedId === pigId) return;
      bridge.selectedId = pigId;
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
