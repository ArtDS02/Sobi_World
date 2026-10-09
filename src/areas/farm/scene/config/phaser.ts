// Phaser game config (spec §10.4, §11): the canvas is resized to the .app__stage container by
// createFarmView; scenes keep design coordinates and fit them with the camera (fitCamera).
import * as Phaser from 'phaser';
import { FARM_FALLBACK } from './farmView';
import { fitCamera as fitFrame } from '../../../../ui/world/fitCamera';
import type { WorldRect } from '../view/farmCamera';
import type { FarmLayout } from '../view/pigView';

export const SCENE_KEYS = { boot: 'boot', preload: 'preload', farm: 'farm' } as const;

export function phaserConfig(
  parent: HTMLElement,
  layout: FarmLayout,
  scene: Phaser.Scene[],
): Phaser.Types.Core.GameConfig {
  return {
    type: Phaser.AUTO,
    parent,
    width: layout.designSize.width,
    height: layout.designSize.height,
    backgroundColor: FARM_FALLBACK.SKY,
    banner: false,
    audio: { noAudio: true },
    // The stage size comes from CSS; Phaser must not rewrite the host's width / height.
    scale: { mode: Phaser.Scale.NONE, expandParent: false },
    scene,
  };
}

/** Zooms and centres the scene camera so the whole design frame shows, now and on every resize. */
export function fitCamera(
  scene: Phaser.Scene,
  layout: FarmLayout,
  onView: (view: WorldRect) => void = () => {},
) {
  fitFrame(scene, layout.designSize, onView);
}
