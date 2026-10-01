// Entry point of the farm canvas (spec §4, §11): mounts Phaser into the DOM stage host and exposes
// the small handle the DOM shell needs (selection in, visibility). Phaser draws the world only.
import * as Phaser from 'phaser';
import type { AssetRegistry } from '../core/assets/registry';
import type { GameStore } from '../store/gameStore';
import { phaserConfig } from './config/phaser';
import { BootScene } from './scenes/BootScene';
import { MainFarmScene } from './scenes/MainFarmScene';
import { PreloadScene } from './scenes/PreloadScene';

export interface FarmDeps {
  store: GameStore;
  assets: AssetRegistry;
  now: () => number;
  /** Click on a pig → its id; click on empty ground → null. */
  onSelect: (pigId: string | null) => void;
}

/** Shared between the handle and MainFarmScene. */
export interface FarmBridge {
  selectedId: string | null;
  /** Re-sync the farm from the latest snapshot; a no-op until the scene runs. */
  refresh: () => void;
}

export interface FarmView {
  setSelected(pigId: string | null): void;
  /** Hidden on other screens: the loop sleeps, and the scale is refreshed when shown again. */
  setVisible(visible: boolean): void;
  destroy(): void;
}

export function createFarmView(host: HTMLElement, deps: FarmDeps): FarmView {
  const bridge: FarmBridge = { selectedId: null, refresh: () => {} };
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
    destroy: () => game.destroy(true),
  };
}
