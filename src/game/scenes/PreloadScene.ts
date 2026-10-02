// Preload (spec §11): environment, structures, trough states, fx, ui icons and the art of every
// species, with a progress bar. Failed files fall back later.
import * as Phaser from 'phaser';
import { BREEDS } from '../../core/config/breeds';
import { FARM_VIEW } from '../../core/config/farmView';
import { t } from '../../i18n/format';
import { vi } from '../../i18n/vi';
import { fitCamera, SCENE_KEYS } from '../config/phaser';
import { farmLoadList, fxAnimKey, type LoadList, type SheetItem } from '../view/textureKeys';
import type { FarmBridge, FarmDeps } from '../farmView';
import { farmSeason } from '../state/seasonClock';

/** Queue a load list; returns how many files were queued. */
export function queueLoadList(load: Phaser.Loader.LoaderPlugin, list: LoadList): number {
  for (const i of list.images) load.image(i.key, i.url);
  for (const j of list.json) load.json(j.key, j.url);
  for (const sh of list.sheets) {
    load.spritesheet(sh.key, sh.url, { frameWidth: sh.frameWidth, frameHeight: sh.frameHeight });
  }
  return list.images.length + list.json.length + list.sheets.length;
}

/** One looping animation per multi-frame fx that loaded (missing files keep the fallback). */
export function createFxAnims(scene: Phaser.Scene, sheets: readonly SheetItem[]) {
  for (const sh of sheets) {
    const key = fxAnimKey(sh.key);
    if (!scene.textures.exists(sh.key) || scene.anims.exists(key)) continue;
    scene.anims.create({
      key,
      frames: scene.anims.generateFrameNumbers(sh.key, { start: 0, end: sh.count - 1 }),
      frameRate: sh.fps,
      repeat: -1,
    });
  }
}

/** Dev builds log each failed file once (spec §11.4); the renderer uses the fallback texture. */
export function warnLoadErrors(load: Phaser.Loader.LoaderPlugin) {
  load.on(Phaser.Loader.Events.FILE_LOAD_ERROR, (file: Phaser.Loader.File) => {
    if (import.meta.env.DEV) console.warn(`[assets] fallback for ${file.key} (${file.url})`);
  });
}

export class PreloadScene extends Phaser.Scene {
  private list: LoadList | null = null;

  constructor(
    private readonly deps: FarmDeps,
    private readonly bridge: FarmBridge,
  ) {
    super(SCENE_KEYS.preload);
  }

  preload() {
    fitCamera(this, this.deps.assets.manifest.layout);
    const { width, height } = this.deps.assets.manifest.layout.designSize;
    const bar = FARM_VIEW.LOADING_BAR;
    const x = (width - bar.width) / 2;
    const y = height / 2;
    this.add.rectangle(x, y, bar.width, bar.height, bar.track).setOrigin(0, 0.5);
    const fill = this.add.rectangle(x, y, 0, bar.height, bar.color).setOrigin(0, 0.5);
    const label = this.add
      .text(width / 2, y - bar.height * 2, t(vi.desktop.loadingAssets, { percent: 0 }), {
        color: bar.text,
        fontSize: `${bar.height}px`,
        fontFamily: FARM_VIEW.LABEL.fontFamily,
      })
      .setOrigin(0.5);
    this.load.on(Phaser.Loader.Events.PROGRESS, (p: number) => {
      fill.width = bar.width * p;
      label.setText(t(vi.desktop.loadingAssets, { percent: Math.round(p * 100) }));
    });
    warnLoadErrors(this.load);

    this.list = farmLoadList(
      this.deps.assets,
      Object.values(BREEDS).map((b) => b.artId),
      farmSeason(this.deps.now(), this.bridge.seasonPreview), // only this season's variants (SE-1)
    );
    queueLoadList(this.load, this.list);
  }

  create() {
    createFxAnims(this, this.list?.sheets ?? []);
    this.scene.start(SCENE_KEYS.farm);
  }
}
