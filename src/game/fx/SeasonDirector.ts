// Season of the farm (SE-1): reads the player's local calendar month (through the injected `now`,
// so dev time travel moves it too) or the admin / dev preview, and dresses the one base layout for
// it — every tracked building / prop image swaps to its seasonal texture (default art when the row
// has no variant), the backdrop takes the season palette and the season's environment FX run
// (SeasonFxLayer, DECISIONS MU-2; gated by the day / night phase). A season change
// mid-session loads that season's files first; only the current season's files are ever loaded.
import * as Phaser from 'phaser';
import type { DayPhase } from '../../core/config/dayNight';
import { SEASON_LOOKS, SEASON_VIEW, type SeasonId } from '../../core/config/seasons';
import type { AssetRegistry } from '../../core/assets/registry';
import type { Backdrop } from '../prefabs/Backdrop';
import { queueLoadList } from '../scenes/PreloadScene';
import { FALLBACK_PROP_KEY, seasonLoadList, seasonalTextureKey, textureKey } from '../view/textureKeys';
import { farmSeason } from '../state/seasonClock';
import { SeasonFxLayer } from './SeasonFxLayer';

interface Tracked {
  id: string;
  img: Phaser.GameObjects.Image;
  /** Text tag shown only while the art drawn has no painted sign (seasonal art of a signed object). */
  tag: Phaser.GameObjects.Text | null;
  unsignedSeasonal: boolean;
}

export class SeasonDirector {
  private season: SeasonId | null = null;
  private readonly tracked: Tracked[] = [];
  private readonly loaded = new Set<SeasonId>();
  private readonly fx: SeasonFxLayer;

  constructor(
    private readonly scene: Phaser.Scene,
    private readonly assets: AssetRegistry,
    private readonly backdrop: Backdrop,
    private readonly now: () => number,
    private readonly preview: () => SeasonId | null,
    /** The shown day / night phase (DayNightDirector: the one clock, admin preview included). */
    private readonly phase: () => DayPhase,
  ) {
    // FX anchors = the tracked placements (spring trees, the well, the barn …), by display bounds.
    const anchors = () =>
      this.tracked.map((t) => {
        const b = t.img.getBounds();
        return { id: t.id, x: b.centerX, y: b.centerY, width: b.width, height: b.height };
      });
    this.fx = new SeasonFxLayer(scene, assets, anchors, now());
    const timer = scene.time.addEvent({
      delay: SEASON_VIEW.pollMs,
      loop: true,
      callback: () => this.update(),
    });
    scene.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      timer.remove();
      this.fx.destroy();
    });
  }

  /**
   * Draws placement `id` with the current season's art. `tag` (optional) is the name tag of a
   * signed object whose seasonal art lacks the painted sign: it shows only while that art is drawn.
   */
  track(id: string, img: Phaser.GameObjects.Image, tag: Phaser.GameObjects.Text | null = null) {
    const t = { id, img, tag, unsignedSeasonal: tag !== null };
    this.tracked.push(t);
    if (this.season) this.apply(t, this.season);
  }

  current(): SeasonId | null {
    return this.season;
  }

  /** Re-reads the calendar / preview; the preloaded season is applied at once. */
  update() {
    const next = farmSeason(this.now(), this.preview());
    if (next === this.season) return;
    this.season = next;
    if (this.loaded.size === 0) this.loaded.add(next); // the preload list carried it
    if (this.loaded.has(next)) return this.show(next);
    this.loaded.add(next);
    if (queueLoadList(this.scene.load, seasonLoadList(this.assets, next)) === 0) return this.show(next);
    this.scene.load.once(Phaser.Loader.Events.COMPLETE, () => {
      if (this.season === next) this.show(next);
    });
    this.scene.load.start();
  }

  setReduceMotion(off: boolean) {
    this.fx.setHidden(off);
  }

  tick(time: number) {
    // The day / night phase can change between season polls (clock, admin preview): a cheap key check.
    if (this.season) this.fx.set(this.season, this.phase());
    this.fx.update(time);
  }

  private show(season: SeasonId) {
    for (const t of this.tracked) this.apply(t, season);
    this.backdrop.setPalette(SEASON_LOOKS[season].backdrop);
    this.fx.set(season, this.phase());
  }

  private apply(t: Tracked, season: SeasonId) {
    const seasonal = seasonalTextureKey(this.assets, t.id, season);
    const key = this.scene.textures.exists(seasonal) ? seasonal : textureKey(t.id);
    const next = this.scene.textures.exists(key) ? key : FALLBACK_PROP_KEY;
    if (t.img.texture.key !== next) t.img.setTexture(next);
    t.tag?.setVisible(t.unsignedSeasonal && next !== textureKey(t.id));
  }
}
