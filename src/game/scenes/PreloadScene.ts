// Preload (spec §11): environment, structures, trough states, fx, ui icons and the art of every
// species, behind the loading screen. Progress is real (AM-1): config (manifest + save already read
// by main.ts) → farm files → pig art (file loader progress) → building the world → ready.
// Failed files fall back later.
import * as Phaser from 'phaser';
import { BREEDS } from '../../core/config/breeds';
import { LOADING_FILES_SPAN } from '../../core/config/loadingScreen';
import { SCENE_KEYS } from '../config/phaser';
import { LoadingScreen } from '../prefabs/LoadingScreen';
import { artLoadList, farmLoadList, fxAnimKey, type LoadList, type SheetItem } from '../view/textureKeys';
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
  private screen: LoadingScreen | null = null;

  constructor(
    private readonly deps: FarmDeps,
    private readonly bridge: FarmBridge,
  ) {
    super(SCENE_KEYS.preload);
  }

  preload() {
    const season = farmSeason(this.deps.now(), this.bridge.seasonPreview);
    const reduceMotion = this.deps.store.getSnapshot().save?.settings.reduceMotion ?? false;
    const screen = new LoadingScreen(this, this.deps.assets.manifest.layout, season, reduceMotion);
    this.screen = screen;
    warnLoadErrors(this.load);

    const artIds = Object.values(BREEDS).map((b) => b.artId);
    this.list = farmLoadList(this.deps.assets, artIds, season); // only this season's variants (SE-1)
    // Farm files are queued before pig art: the step follows which kind finishes now.
    const pigKeys = new Set(artIds.flatMap((id) => artLoadList(this.deps.assets, id).images.map((i) => i.key)));
    const total = queueLoadList(this.load, this.list);
    const farmFiles = Math.max(0, total - pigKeys.size);
    let done = 0;
    screen.setStep('farm');
    const span = LOADING_FILES_SPAN.to - LOADING_FILES_SPAN.from;
    this.load.on(Phaser.Loader.Events.PROGRESS, (p: number) => screen.setProgress(LOADING_FILES_SPAN.from + span * p));
    const fileDone = () => {
      done += 1;
      if (done === farmFiles) screen.setStep('pigs');
    };
    this.load.on(Phaser.Loader.Events.FILE_COMPLETE, fileDone);
    this.load.on(Phaser.Loader.Events.FILE_LOAD_ERROR, fileDone);
    this.load.once(Phaser.Loader.Events.COMPLETE, () => screen.setStep('world'));
  }

  create() {
    createFxAnims(this, this.list?.sheets ?? []);
    this.screen?.setStep('ready');
    this.scene.start(SCENE_KEYS.farm);
  }
}
