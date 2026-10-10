// What the Garden's screens show, as plain data (no DOM): the seed palette, the bulk buttons, a plot's card, a
// workshop's card. Availability is found by dry-running the real action, like the farm's actionsVm, so a
// disabled reason is always what dispatch would answer. Pure; unit-tested.
import type { ErrorCode } from '../../../core/config/errors';
import { itemArtId } from '../../../core/config/assetIds';
import { ITEMS } from '../../../core/config/items';
import type { ItemId } from '../../../core/config/ids';
import { RECIPES, recipesOf } from '../../../core/config/recipes';
import { WORLD_LEVELS } from '../../../core/config/progression';
import { levelProgress, worldXp } from '../../../core/progression/levels';
import { affordableBatches, batchesDone, batchesReady, nextBatchAt, jobEndsAt, type Recipe } from '../../../core/production/production';
import type { WorldSave } from '../../../core/save/world';
import { mulberry32 } from '../../../core/rng';
import type { ActionContext, ActionResultOf } from '../../../core/types';
import { formatDuration, formatInt, t } from '../../../i18n/format';
import { vi } from '../../../i18n/vi';
import { msToRipe, plotStage } from '../../../systems/plants/plot';
import {
  CROP_LIST,
  CROPS,
  GB,
  PLOT_RULES,
  type BuildingId,
} from '../logic/config/content';
import { isCovered, nextExpansion, nextSprinkler, plotViews, sprinklerCoverage } from '../logic/derived';
import { gardenOf } from '../logic/save/lens';

export type GardenRun = (world: WorldSave, ctx: ActionContext) => ActionResultOf<WorldSave>;

export interface ButtonVm {
  label: string;
  /** Visible reason when the button is off, null when it works. */
  reason: string | null;
}

/** Dry-runs an action with a throwaway rng. */
export function probe(world: WorldSave, run: GardenRun, now: number): ErrorCode | null {
  const r = run(world, { now, rng: mulberry32(0) });
  return r.ok ? null : r.error;
}

const gold = (n: number) => formatInt(n);
const nameOfItem = (id: string) => vi.shop[id as ItemId] ?? id;

export interface HudVm {
  coins: string;
  level: string;
  xp: string;
  /** 0..100 */
  xpProgress: number;
}

export function hudVm(world: WorldSave): HudVm {
  const xp = worldXp(world);
  const { level, next, percent } = levelProgress(xp, WORLD_LEVELS);
  return {
    coins: gold(world.wallet.coins),
    level: t(vi.garden.level, { level }),
    xp: next === null ? vi.garden.xpMax : t(vi.garden.xp, { current: gold(xp), next: gold(next) }),
    xpProgress: percent,
  };
}

export interface SeedVm {
  cropId: string;
  name: string;
  art: string;
  line: string;
  growsIn: string;
  selected: boolean;
}

export function paletteVm(world: WorldSave, selected: string): SeedVm[] {
  return CROP_LIST.map((c) => ({
    cropId: c.id,
    name: c.nameVi,
    art: itemArtId(c.seedItem),
    line: t(vi.garden.seedLine, { price: gold(ITEMS[c.seedItem as ItemId].priceGold), count: world.inventory.items[c.seedItem] ?? 0 }),
    growsIn: t(vi.garden.growsIn, { time: formatDuration(c.growMs) }),
    selected: c.id === selected,
  }));
}

export interface BulkVm {
  water: ButtonVm;
  harvest: ButtonVm;
  plantAll: ButtonVm;
  expand: ButtonVm;
}

const reasonOf = (error: ErrorCode, fallback: string): string => (error === 'NOTHING_TO_DO' ? fallback : error === 'INSUFFICIENT_GOLD' ? vi.garden.noGold : vi.error[error]);

export function bulkVm(world: WorldSave, now: number, selected: string, run: { water: GardenRun; harvest: GardenRun; plantAll: GardenRun }): BulkVm {
  const g = gardenOf(world);
  const views = plotViews(g, now);
  const growing = views.filter((v) => v.stage === 'growing').length;
  const waterE = probe(world, run.water, now);
  const harvestE = probe(world, run.harvest, now);
  const empty = views.filter((v) => v.stage === 'empty').length;
  const plantE = empty === 0 ? 'NOTHING_TO_DO' : probe(world, run.plantAll, now);
  const next = nextExpansion(g);
  return {
    water: { label: vi.garden.water, reason: waterE ? reasonOf(waterE, growing === 0 ? vi.garden.noCrops : vi.garden.allWatered) : null },
    harvest: { label: vi.garden.harvest, reason: harvestE ? reasonOf(harvestE, vi.garden.nothingRipe) : null },
    plantAll: {
      label: `${vi.garden.plantAll}${CROPS[selected] ? ` (${CROPS[selected]!.nameVi})` : ''}`,
      reason: plantE ? reasonOf(plantE, vi.garden.noEmpty) : null,
    },
    expand: next
      ? { label: t(vi.garden.expand, { gold: gold(next.price) }), reason: world.wallet.coins < next.price ? vi.garden.noGold : null }
      : { label: vi.garden.expandMax, reason: vi.garden.expandMax },
  };
}

export interface PlotCardVm {
  index: number;
  title: string;
  stage: 'empty' | 'growing' | 'ripe' | 'wilted';
  stageText: string;
  cropName: string | null;
  /** Lines under the title: progress, time to ripe, water, fertiliser. */
  lines: string[];
  water: ButtonVm | null;
  fertilize: ButtonVm | null;
  harvest: ButtonVm | null;
}

export function plotCardVm(world: WorldSave, index: number, now: number, run: { water: GardenRun; fertilize: GardenRun; harvest: GardenRun }): PlotCardVm | null {
  const g = gardenOf(world);
  const plot = g.plots[index];
  if (!plot) return null;
  const crop = plot.cropId ? CROPS[plot.cropId] : undefined;
  const stage = crop ? plotStage(plot, PLOT_RULES, now) : 'empty';
  const covered = isCovered(g, index);
  const view = plotViews(g, now)[index]!;
  const lines: string[] = [];
  if (crop && stage === 'growing') {
    lines.push(t(vi.garden.progress, { percent: Math.round(view.share * 100) }));
    lines.push(t(vi.garden.ripeIn, { time: formatDuration(msToRipe(plot, crop, PLOT_RULES, covered, now)) }));
    lines.push(covered ? vi.garden.sprinklerState : view.watered ? vi.garden.wetState : vi.garden.dryState);
    if (plot.fertilized) lines.push(vi.garden.fertilizedState);
  } else if (crop && plot.ripeAt !== null) {
    if (stage === 'ripe') lines.push(t(vi.garden.wiltIn, { time: formatDuration(Math.max(0, plot.ripeAt + PLOT_RULES.witherAfterMs - now)) }));
    lines.push(t(vi.garden.yieldNow, { count: view.yield, name: nameOfItem(crop.produceItem) }));
  }
  const fertilizers = world.inventory.items.item_fertilizer ?? 0;
  const growing = stage === 'growing';
  const waterE = growing ? probe(world, (w, c) => run.water(w, c), now) : 'NOTHING_TO_DO';
  return {
    index,
    title: t(vi.garden.plotTitle, { n: index + 1 }),
    stage,
    stageText: vi.garden.stage[stage],
    cropName: crop?.nameVi ?? null,
    lines,
    water: growing ? { label: vi.garden.giveWater, reason: waterE ? (covered ? vi.garden.sprinklerState : vi.garden.wetState) : null } : null,
    fertilize: growing
      ? { label: t(vi.garden.giveFertilizer, { count: fertilizers }), reason: plot.fertilized ? vi.garden.fertilizedState : fertilizers === 0 ? vi.garden.noFertilizer : null }
      : null,
    harvest: crop && plot.ripeAt !== null ? { label: vi.garden.harvestPlot, reason: null } : null,
  };
}

export interface RecipeVm {
  recipe: Recipe;
  name: string;
  inputs: { name: string; have: number; need: number }[];
  outputs: string;
  duration: string;
  /** Most batches the bag allows (capped at the workshop's limit). */
  maxBatches: number;
}

export interface WorkshopVm {
  building: BuildingId;
  name: string;
  built: boolean;
  priceText: string;
  buildReason: string | null;
  recipes: RecipeVm[];
  /** The running or waiting job, null when idle. */
  job: null | { name: string; done: number; total: number; ready: number; nextIn: string | null; endsIn: string | null };
}

export function workshopVm(world: WorldSave, building: BuildingId, now: number): WorkshopVm {
  const g = gardenOf(world);
  const def = GB.buildings[building];
  const j = g.jobs[building];
  const jr = j ? RECIPES[j.recipeId] : undefined;
  const next = j && jr ? nextBatchAt(j, jr, now) : null;
  return {
    building,
    name: building === 'mill' ? vi.garden.mill : vi.garden.composter,
    built: g.built[building],
    priceText: t(vi.garden.workshopNotBuilt, { gold: gold(def.price) }),
    buildReason: world.wallet.coins < def.price ? vi.garden.noGold : null,
    recipes: recipesOf(building).map((recipe) => ({
      recipe,
      name: recipe.name,
      inputs: Object.entries(recipe.inputs).map(([id, need]) => ({ name: nameOfItem(id), have: world.inventory.items[id] ?? 0, need })),
      outputs: Object.entries(recipe.outputs).map(([id, n]) => `${n} ${nameOfItem(id)}`).join(', '),
      duration: t(vi.garden.perBatch, { time: formatDuration(recipe.durationMs) }),
      maxBatches: Math.min(GB.maxBatches, affordableBatches(recipe, world.inventory.items)),
    })),
    job:
      j && jr
        ? {
            name: jr.name,
            done: batchesDone(j, jr, now),
            total: j.batches,
            ready: batchesReady(j, jr, now),
            nextIn: next === null ? null : formatDuration(Math.max(0, next - now)),
            endsIn: formatDuration(Math.max(0, jobEndsAt(j, jr) - now)),
          }
        : null,
  };
}

export interface SprinklerVm {
  level: number;
  text: string;
  /** The next level's button, null at the top. */
  next: (ButtonVm & { level: number }) | null;
}

/** " + 8 Vảy cá" for the materials a level takes (empty when none). */
const materialsText = (materials: Readonly<Record<string, number | undefined>>): string => {
  const parts = Object.entries(materials).filter(([, n]) => (n ?? 0) > 0).map(([id, n]) => `${n} ${nameOfItem(id)}`);
  return parts.length === 0 ? '' : ` + ${parts.join(', ')}`;
};

const missingMaterial = (world: WorldSave, materials: Readonly<Record<string, number | undefined>>): string | null => {
  const lack = Object.entries(materials).find(([id, n]) => (world.inventory.items[id] ?? 0) < (n ?? 0));
  return lack ? t(vi.garden.noMaterial, { name: nameOfItem(lack[0]) }) : null;
};

export function sprinklerVm(world: WorldSave): SprinklerVm {
  const g = gardenOf(world);
  const next = nextSprinkler(g);
  const covered = sprinklerCoverage(g.sprinkler);
  return {
    level: g.sprinkler,
    text: g.sprinkler === 0 ? vi.garden.sprinklerNone : t(vi.garden.sprinklerLevel, { level: g.sprinkler, plots: covered }),
    next: next
      ? {
          level: next.level,
          label: (g.sprinkler === 0 ? t(vi.garden.sprinklerBuy, { gold: gold(next.price) }) : t(vi.garden.sprinklerUp, { level: next.level, plots: next.plots, gold: gold(next.price) })) + materialsText(next.materials),
          reason: world.wallet.coins < next.price ? vi.garden.noGold : missingMaterial(world, next.materials),
        }
      : null,
  };
}
