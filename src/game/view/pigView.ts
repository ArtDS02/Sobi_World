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
  /** The species' `_sleep` frame, or null when the manifest has none (see sleepLook). */
  sleepTextureId: string | null;
  /** The species' `_wake` frame (heavy lids, DECISIONS PS-1), or null when the manifest has none. */
  wakeTextureId: string | null;
  /** Species art row whose anchors apply. */
  artId: string;
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

/**
 * Normalised feet position inside the ellipse inscribed in the walk area: x spread by slot, y by
 * id within the ellipse's height at that x.
 */
export function pigSpot(pig: Pick<Pig, 'id' | 'slotIndex'>, layout: FarmLayout) {
  const w = layout.walkArea;
  const u = frac(FARM_VIEW.PIG_SPREAD_OFFSET + pig.slotIndex * FARM_VIEW.PIG_SPREAD_STEP);
  const v = (hashId(pig.id) % 1000) / 999;
  const dx = (u * 2 - 1) * 0.9;
  const dy = (v * 2 - 1) * Math.sqrt(1 - dx * dx);
  return { x: w.x + ((dx + 1) / 2) * w.width, y: w.y + ((dy + 1) / 2) * w.height };
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
 * What a sleeping pig looks like (spec §11.4, DECISIONS Q5): the species' `_sleep` frame when the
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

/**
 * Frame + overlays a pig shows (DECISIONS PS-1): the heavy-lid `_wake` frame while falling asleep
 * or waking up, the sleep look while asleep (plus fx_zzz through the night even with a real sleep
 * frame), else the idle frame. A frame that is missing or not loaded falls back to idle.
 */
export function frameLook(
  view: Pick<PigView, 'textureId' | 'sleepTextureId' | 'wakeTextureId' | 'overlays'>,
  state: VisualState,
  loaded: (key: string) => boolean,
  nightSleep: boolean,
): { textureId: string; overlays: readonly FxId[] } {
  const idle = { textureId: view.textureId, overlays: view.overlays };
  if (state === 'drowsy') {
    const wake = view.wakeTextureId;
    return wake !== null && loaded(wake) ? { ...idle, textureId: wake } : idle;
  }
  if (state !== 'sleep') return idle;
  const sleep = sleepLook(view, loaded);
  const zzz = sleep.overlay ?? (nightSleep ? SLEEP_FALLBACK_FX : null);
  return { textureId: sleep.textureId, overlays: zzz ? [...view.overlays, zzz] : view.overlays };
}

/** `now` is reserved for time-based states; the sprite adds feedback, walking and naps. */
export function pigView(
  pig: Pig,
  _now: number,
  layout: FarmLayout,
  textures: Pick<AssetRegistry, 'pigTexture'> & Partial<Pick<AssetRegistry, 'pigFrame'>>,
): PigView {
  const visualState = pigVisualState(pig, 0, null);
  const tex = textures.pigTexture(pig.breed, false);
  const fallbackId = fallbackPigKey(pig.breed);
  const textureId = tex.url === null ? fallbackId : textureKey(tex.artId);
  // No sleep row in the manifest → the registry answers with the fx_zzz overlay instead.
  const asleep = textures.pigTexture(pig.breed, true);
  const sleepTextureId =
    asleep.url === null || asleep.overlay ? null : textureKey(asleep.artId, 'sleep');

  const wake = textures.pigFrame?.(pig.breed, 'wake') ?? null;
  const wakeTextureId = wake === null ? null : textureKey(tex.artId, 'wake');

  const overlays: FxId[] = [];
  if (pig.isSick) overlays.push('fx_sick');
  if (pig.pregnancy) overlays.push('fx_pregnant');

  const spot = pigSpot(pig, layout);
  const y = spot.y * layout.designSize.height;
  return {
    textureId,
    sleepTextureId,
    wakeTextureId,
    fallbackId,
    artId: tex.artId,
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
