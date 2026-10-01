// Phaser game config (spec §10.4, §11): fixed design size from the manifest layout, scaled to fit
// the .app__stage container and letterboxed (never stretched).
import * as Phaser from 'phaser';
import { FARM_FALLBACK } from '../../core/config/farmView';
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
    scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH, expandParent: false },
    scene,
  };
}
