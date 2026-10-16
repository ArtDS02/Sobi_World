// The field of one zone (decision 028): 24 plot slots on the lawn, the crops growing on them, swaying in a breeze. The
// whole field is one container, so changing zone slides it out sideways and the next zone in. Draws and reports clicks.
import * as Phaser from 'phaser';
import { FALLBACK_PROP_KEY, textureKey } from '../../../ui/world/keys';
import { opaqueSize } from '../../../ui/world/opaqueSize';
import { CROP_STAGES, cropArtId, PLOT_ART, type CropStage } from '../logic/art';
import { CROPS, PLOTS_PER_ZONE } from '../logic/config/content';
import type { PlotView } from '../logic/derived';
import { cropStageOf, GARDEN_VIEW, plotCentre, plotIndex, slotsToDraw } from './gardenView';

type Img = Phaser.GameObjects.Image;

interface Slot {
  soil: Img;
  crop: Img;
  stage: CropStage | null;
  ripe: boolean;
  /** The crop's drawing scale: the shared crop scale, smaller for a drawing too big for its bed. */
  scale: number;
}

export interface FieldDeps {
  paused: () => boolean;
  /** A click on slot `slot` of the zone on screen. */
  onSlot: (slot: number) => void;
}

const FERTILIZED_TINT = 0xf4ffd8;

/** The crop scale for texture `art` at `stage`: the shared scale, smaller when the drawing is bigger than the stage allows. */
function cropScaleFor(scene: Phaser.Scene, art: string, stage: CropStage): number {
  const { cropScale, cropFit } = GARDEN_VIEW;
  const drawn = opaqueSize(scene, art);
  return cropScale * Math.min(1, cropFit.width / drawn.width, cropFit.height[stage] / drawn.height);
}

export class GardenField {
  readonly container: Phaser.GameObjects.Container;
  private readonly slots: Slot[] = [];
  /** Slots whose fertiliser look waits for the drone (shown plain until it passes). */
  private readonly waiting = new Set<number>();
  /** Each slot's crop at the last look ("cropId:stage:yield"), to notice a harvest or a crop that just ripened. */
  private readonly seen = new Map<number, string>();

  constructor(
    private readonly scene: Phaser.Scene,
    deps: FieldDeps,
  ) {
    const v = GARDEN_VIEW;
    this.container = scene.add.container(0, 0).setDepth(v.depth.plot);
    const key = (id: string) => (scene.textures.exists(textureKey(id)) ? textureKey(id) : FALLBACK_PROP_KEY);
    // Beds first, then every crop above every bed (row order keeps a lower row's crops in front).
    const soils = Array.from({ length: PLOTS_PER_ZONE }, (_, slot) => {
      const { x, y } = plotCentre(slot);
      const soil = scene.add.image(x, y, key(PLOT_ART.soil)).setScale(v.plotScale).setInteractive({ useHandCursor: true });
      soil.on(Phaser.Input.Events.POINTER_DOWN, () => !deps.paused() && deps.onSlot(slot));
      return soil;
    });
    this.container.add(soils);
    soils.forEach((soil, slot) => {
      const { x, y } = plotCentre(slot);
      const crop = scene.add.image(x, y + v.cropBaseY * v.plotScale, FALLBACK_PROP_KEY).setOrigin(0.5, 1).setScale(v.cropScale).setVisible(false);
      this.container.add(crop);
      this.slots.push({ soil, crop, stage: null, ripe: false, scale: v.cropScale });
    });
  }

  /** Where slot `slot` is on screen now (the field may be mid-slide). */
  centre(slot: number): { x: number; y: number } {
    const c = plotCentre(slot);
    return { x: c.x + this.container.x, y: c.y + this.container.y };
  }

  /** Forget what the slots held (another zone is coming): nothing counts as harvested or ripened. */
  forget() {
    this.seen.clear();
  }

  /** What changed on zone `zone` since the last look: slots just harvested (crop, yield) and slots just ripened. */
  changes(zone: number, plots: readonly PlotView[]): { harvested: { slot: number; cropId: string; amount: number }[]; ripened: number[] } {
    const harvested: { slot: number; cropId: string; amount: number }[] = [];
    const ripened: number[] = [];
    for (let slot = 0; slot < PLOTS_PER_ZONE; slot += 1) {
      const p = plots[plotIndex(zone, slot)];
      const before = this.seen.get(slot);
      const now = p?.cropId ? `${p.cropId}:${p.stage}:${p.yield}` : '';
      if (before) {
        const [cropId, stage, amount] = before.split(':');
        if (!p?.cropId && (stage === 'ripe' || stage === 'wilted')) harvested.push({ slot, cropId: cropId!, amount: Number(amount) });
        else if (p && p.cropId === cropId && p.stage === 'ripe' && stage === 'growing') ripened.push(slot);
      }
      this.seen.set(slot, now);
    }
    return { harvested, ripened };
  }

  /** A crop that just ripened hops once. */
  hop(slot: number) {
    const s = this.slots[slot];
    if (s?.crop.visible) this.scene.tweens.add({ targets: s.crop, scaleY: s.scale * GARDEN_VIEW.ripen.hop, duration: 160, yoyo: true, ease: 'Quad.easeOut' });
  }

  /** Draws zone `zone` of the garden. */
  draw(zone: number, plots: readonly PlotView[]) {
    const key = (id: string) => (this.scene.textures.exists(textureKey(id)) ? textureKey(id) : FALLBACK_PROP_KEY);
    const owned = Math.min(PLOTS_PER_ZONE, Math.max(0, plots.length - zone * PLOTS_PER_ZONE));
    const drawn = slotsToDraw(owned, PLOTS_PER_ZONE);
    this.slots.forEach((s, slot) => {
      const view = plots[plotIndex(zone, slot)];
      s.stage = null;
      s.ripe = false;
      s.soil.setVisible(slot < drawn);
      if (slot >= drawn || !view) {
        s.soil.setTexture(key(PLOT_ART.locked));
        return void s.crop.setVisible(false);
      }
      s.soil.setTexture(key(view.watered ? PLOT_ART.wet : PLOT_ART.soil));
      const crop = view.cropId ? CROPS[view.cropId] : undefined;
      if (!crop) return void s.crop.setVisible(false);
      const stage = cropStageOf(view);
      if (!CROP_STAGES.includes(stage)) return void s.crop.setVisible(false);
      s.stage = stage;
      s.ripe = view.stage === 'ripe';
      const art = key(cropArtId(crop, stage));
      s.scale = cropScaleFor(this.scene, art, stage);
      s.crop.setTexture(art).setVisible(true).setScale(s.scale);
      s.crop.setTint(view.fertilized && !this.waiting.has(slot) ? FERTILIZED_TINT : 0xffffff);
    });
  }

  /** The fertiliser look of these slots waits for the drone. */
  hold(slots: readonly number[]) {
    for (const slot of slots) {
      this.waiting.add(slot);
      this.slots[slot]?.crop.setTint(0xffffff);
    }
  }

  /** The drone reached `slot`: its crop shows the fertiliser now, with a small happy bounce. */
  release(slot: number, reduceMotion: boolean) {
    this.waiting.delete(slot);
    const s = this.slots[slot];
    if (!s?.crop.visible) return;
    s.crop.setTint(FERTILIZED_TINT);
    if (!reduceMotion) this.scene.tweens.add({ targets: s.crop, scaleY: s.scale * 1.12, duration: 140, yoyo: true, ease: 'Quad.easeOut' });
  }

  releaseAll() {
    for (const slot of [...this.waiting]) this.release(slot, true);
  }

  /** Crops sway around their base; a ripe crop also breathes. */
  sway(time: number) {
    const s = GARDEN_VIEW.sway;
    const r = GARDEN_VIEW.ripePulse;
    const gust = 1 + Math.sin((time / s.gustMs) * Math.PI * 2) * s.gust;
    this.slots.forEach((p, k) => {
      if (!p.stage || this.scene.tweens.isTweening(p.crop)) return;
      const amp = s[p.stage];
      const period = s.periodMs[0] + ((k * 0.618) % 1) * (s.periodMs[1] - s.periodMs[0]);
      p.crop.setAngle(Math.sin((time / period) * Math.PI * 2 + k * 1.7) * amp * gust);
      if (p.ripe) p.crop.setScale(p.scale * (1 + Math.sin((time / r.periodMs) * Math.PI * 2 + k) * r.scale));
    });
  }

  /** Slides the field out towards −dir, calls `swap` (draw the next zone), and slides it in from +dir. */
  slide(dir: number, swap: () => void, done: () => void) {
    const m = GARDEN_VIEW.zoneMove;
    this.scene.tweens.add({
      targets: this.container,
      x: -dir * m.px,
      alpha: 0,
      duration: m.outMs,
      ease: 'Cubic.easeIn',
      onComplete: () => {
        swap();
        this.container.setX(dir * m.px);
        this.scene.tweens.add({ targets: this.container, x: 0, alpha: 1, duration: m.inMs, ease: 'Cubic.easeOut', onComplete: done });
      },
    });
  }
}
