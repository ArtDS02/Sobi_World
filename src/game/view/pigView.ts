// (pig, now, layout) → what the farm canvas draws for one pig (spec §11, §11.2). Pure: Phaser
// code only applies the result. Position is derived from the slot and id, never stored.
import type { AssetManifest } from '../../core/assets/manifestSchema';
import type { AssetRegistry } from '../../core/assets/registry';
import { SLEEP_FALLBACK_FX, type FxId } from '../../core/config/assetIds';
import { FARM_VIEW } from '../../core/config/farmView';
import type { Pig } from '../../core/types';
import { pigVisualState, type VisualState } from '../state/pigVisualState';
import { fallbackPigKey, textureKey } from './textureKeys';

export type FarmLayout = AssetManifest['layout'];

export interface PigView {
  /** Texture to draw; `fallbackId` when it is not loaded (spec §11.4). */
  textureId: string;
  fallbackId: string;
  /** The skin's `_sleep` frame, or null when the manifest has none (see sleepLook). */
  sleepTextureId: string | null;
  /** Skin row whose anchors apply (after the breed-default fallback). */
  skinId: string;
  /** Home feet position in design pixels; wandering strays from it (visual only). */
  x: number;
  y: number;
  /** growth × Y-depth factor at home; display height = FARM_VIEW.PIG_DISPLAY_PX × scale. */
  scale: number;
  /** growthProgress, so the sprite can rescale by Y while it wanders. */
  growth: number;
  /** Initial facing; afterwards the walk direction decides. */
  flipX: boolean;
  /** Y-sort inside layer 4 (spec §11.1). */
  depth: number;
  overlays: FxId[];
  /** The flags the visual state reads, for the sprite's own pigVisualState calls. */
  care: Pick<Pig, 'isSick' | 'pregnancy'>;
  /** Data-only state (no feedback, not walking); the sprite adds those (pigVisualState). */
  visualState: VisualState;
}

/** FNV-1a, 32 bit: a stable pseudo-random value per pig id (no rng: purely visual). */
export function hashId(id: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < id.length; i++) {
    h ^= id.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

const frac = (n: number) => n - Math.floor(n);
const lerp = (a: number, b: number, t: number) => a + (b - a) * Math.min(1, Math.max(0, t));

/** Normalised feet position inside the walk area: x spread by slot, y by id. */
export function pigSpot(pig: Pick<Pig, 'id' | 'slotIndex'>, layout: FarmLayout) {
  const w = layout.walkArea;
  const u = frac(FARM_VIEW.PIG_SPREAD_OFFSET + pig.slotIndex * FARM_VIEW.PIG_SPREAD_STEP);
  const v = (hashId(pig.id) % 1000) / 999;
  return { x: w.x + u * w.width, y: w.y + v * w.height };
}

/** Scale from growth (baby → adult) times the depth scale by Y (back → front). */
export function pigScale(growthProgress: number, yNorm: number, layout: FarmLayout): number {
  const g = FARM_VIEW.PIG_GROWTH_SCALE;
  const growth = lerp(g.baby, g.adult, growthProgress / 100);
  const w = layout.walkArea;
  const depthT = w.height > 0 ? (yNorm - w.y) / w.height : 1;
  const byY = lerp(layout.pigScaleByY.min, layout.pigScaleByY.max, depthT);
  return growth * byY;
}

/**
 * What a sleeping pig looks like (spec §11.4, DECISIONS Q5): the skin's `_sleep` frame when the
 * manifest has one and it loaded; otherwise the idle frame plus the fx_zzz overlay.
 */
export function sleepLook(
  view: Pick<PigView, 'textureId' | 'sleepTextureId'>,
  loaded: (key: string) => boolean,
): { textureId: string; overlay: FxId | null } {
  const sleep = view.sleepTextureId;
  if (sleep !== null && loaded(sleep)) return { textureId: sleep, overlay: null };
  return { textureId: view.textureId, overlay: SLEEP_FALLBACK_FX };
}

/** `now` is reserved for time-based states; the sprite adds feedback, walking and naps. */
export function pigView(
  pig: Pig,
  _now: number,
  layout: FarmLayout,
  textures: Pick<AssetRegistry, 'pigTexture'>,
): PigView {
  const visualState = pigVisualState(pig, 0, null);
  const tex = textures.pigTexture(pig.skinId, pig.breed, false);
  const fallbackId = fallbackPigKey(pig.breed);
  const textureId = tex.url === null ? fallbackId : textureKey(tex.skinId);
  // No sleep row in the manifest → the registry answers with the fx_zzz overlay instead.
  const asleep = textures.pigTexture(pig.skinId, pig.breed, true);
  const sleepTextureId =
    asleep.url === null || asleep.overlay ? null : textureKey(asleep.skinId, 'sleep');

  const overlays: FxId[] = [];
  if (pig.isSick) overlays.push('fx_sick');
  if (pig.pregnancy) overlays.push('fx_pregnant');

  const spot = pigSpot(pig, layout);
  const y = spot.y * layout.designSize.height;
  return {
    textureId,
    sleepTextureId,
    fallbackId,
    skinId: tex.skinId,
    x: spot.x * layout.designSize.width,
    y,
    scale: pigScale(pig.growthProgress, spot.y, layout),
    growth: pig.growthProgress,
    flipX: (hashId(pig.id) & 1) === 1,
    depth: y,
    overlays,
    care: { isSick: pig.isSick, pregnancy: pig.pregnancy },
    visualState,
  };
}
