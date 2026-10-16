// What the Cloud's screens show, as plain data (no DOM): the seed palette, the bulk buttons, a plot's card, the spring and
// the cauldron. Availability is found by dry-running the real action, like the Garden's gardenVm, so a disabled reason is
// always what dispatch would answer. Pure; unit-tested.
import type { ErrorCode } from '../../../core/config/errors';
import { itemArtId } from '../../../core/config/assetIds';
import { ITEMS } from '../../../core/config/items';
import type { ItemId } from '../../../core/config/ids';
import { RECIPES, recipesOf } from '../../../core/config/recipes';
import { TECHS, recipeLocked, techBonus } from '../../../core/config/tech';
import { sped } from '../../../core/production/production';
import { WORLD_LEVELS } from '../../../core/config/progression';
import { levelProgress, worldLevel, worldXp } from '../../../core/progression/levels';
import { affordableBatches, batchesDone, batchesReady, nextBatchAt, jobEndsAt, type Recipe } from '../../../core/production/production';
import type { WorldSave } from '../../../core/save/world';
import { mulberry32 } from '../../../core/rng';
import type { ActionContext, ActionResultOf } from '../../../core/types';
import { formatDuration, formatInt, t } from '../../../i18n/format';
import { vi } from '../../../i18n/vi';
import { msToRipe, plotStage } from '../../../systems/plants/plot';
import { CAULDRON, CB, FLOWER_LIST, FLOWERS, PLOT_RULES, WATER_ITEM, springLevel } from '../logic/config/content';
import { msToNextWater, nextExpansion, nextSpringLevel, plotViews, springStock, type Expansion } from '../logic/derived';
import { cloudOf } from '../logic/save/lens';
import { emptyIn, unfertilizedIn } from './cloudTierVm';

export type CloudRun = (world: WorldSave, ctx: ActionContext) => ActionResultOf<WorldSave>;

export interface ButtonVm {
  label: string;
  /** Visible reason when the button is off, null when it works. */
  reason: string | null;
}

/** Dry-runs an action with a throwaway rng. */
export function probe(world: WorldSave, run: CloudRun, now: number): ErrorCode | null {
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
  water: string;
}

export function hudVm(world: WorldSave, now: number): HudVm {
  const xp = worldXp(world);
  const { level, next, percent } = levelProgress(xp, WORLD_LEVELS);
  const g = cloudOf(world);
  return {
    coins: gold(world.wallet.coins),
    level: t(vi.cloud.level, { level }),
    xp: next === null ? vi.cloud.xpMax : t(vi.cloud.xp, { current: gold(xp), next: gold(next) }),
    xpProgress: percent,
    water: `${world.inventory.items[WATER_ITEM] ?? 0} + ${springStock(g, now)}`,
  };
}

export interface SeedVm {
  flowerId: string;
  name: string;
  art: string;
  line: string;
  growsIn: string;
  kind: string;
  selected: boolean;
}

export function paletteVm(world: WorldSave, selected: string): SeedVm[] {
  return FLOWER_LIST.map((f) => ({
    flowerId: f.id,
    name: f.nameVi,
    // The flower it grows (owner's layout mock-up): a picture reads faster than six look-alike seed packets.
    art: itemArtId(f.produceItem),
    line: t(vi.cloud.seedLine, { price: gold(ITEMS[f.seedItem as ItemId].priceGold), count: world.inventory.items[f.seedItem] ?? 0 }),
    growsIn: t(vi.cloud.growsIn, { time: formatDuration(f.growMs) }),
    kind: vi.cloud.kind[f.kind],
    selected: f.id === selected,
  }));
}

export interface BulkVm {
  collect: ButtonVm;
  water: ButtonVm;
  harvest: ButtonVm;
  plantAll: ButtonVm;
  fertilizeAll: ButtonVm;
  expand: ButtonVm;
}

const reasonOf = (error: ErrorCode, fallback: string): string =>
  error === 'NOTHING_TO_DO' ? fallback : error === 'INSUFFICIENT_GOLD' ? vi.cloud.noGold : error === 'INSUFFICIENT_ITEM' ? vi.cloud.noWater : vi.error[error];

/** The buttons under the beds. Sowing and fertilising act on the tier on screen (decision 028); the rest on the whole cloud. */
export function bulkVm(
  world: WorldSave,
  now: number,
  selected: string,
  tier: number,
  run: { collect: CloudRun; water: CloudRun; harvest: CloudRun; plantAll: CloudRun; fertilizeAll: CloudRun },
): BulkVm {
  const g = cloudOf(world);
  const views = plotViews(g, now);
  const growing = views.filter((v) => v.stage === 'growing').length;
  const waterE = probe(world, run.water, now);
  const collectE = probe(world, run.collect, now);
  const harvestE = probe(world, run.harvest, now);
  const plantE = emptyIn(world, tier).length === 0 ? 'NOTHING_TO_DO' : probe(world, run.plantAll, now);
  const fertE = unfertilizedIn(world, tier).length === 0 ? 'NOTHING_TO_DO' : probe(world, run.fertilizeAll, now);
  const next = nextExpansion(g);
  return {
    collect: { label: t(vi.cloud.collectWater, { count: springStock(g, now) }), reason: collectE ? (collectE === 'NOTHING_TO_COLLECT' ? vi.cloud.noWaterYet : vi.error[collectE]) : null },
    water: { label: vi.cloud.water, reason: waterE ? reasonOf(waterE, growing === 0 ? vi.cloud.noCrops : vi.cloud.allWatered) : null },
    harvest: { label: vi.cloud.harvest, reason: harvestE ? reasonOf(harvestE, vi.cloud.nothingRipe) : null },
    plantAll: {
      label: `${vi.cloud.plantAll}${FLOWERS[selected] ? ` (${FLOWERS[selected]!.nameVi})` : ''}`,
      reason: plantE ? reasonOf(plantE, vi.cloud.noEmpty) : null,
    },
    fertilizeAll: {
      label: vi.cloud.fertilizeAll,
      reason: fertE ? (fertE === 'INSUFFICIENT_ITEM' ? vi.cloud.noFertilizer : reasonOf(fertE, vi.cloud.noFertilizable)) : null,
    },
    expand: next ? expandVm(world, next) : { label: vi.cloud.expandMax, reason: vi.cloud.expandMax },
  };
}

/** The "open more plots" button: a whole tier past the first one, gated by the world level (decision 023). */
export function expandVm(world: WorldSave, next: Expansion): ButtonVm {
  const label = next.tier !== null ? t(vi.cloud.expandTier, { n: next.tier + 1, gold: gold(next.price) }) : t(vi.cloud.expand, { gold: gold(next.price) });
  const reason = worldLevel(world, WORLD_LEVELS) < next.level ? t(vi.cloud.needLevel, { level: next.level }) : world.wallet.coins < next.price ? vi.cloud.noGold : null;
  return { label, reason };
}

export interface PlotCardVm {
  index: number;
  title: string;
  stage: 'empty' | 'growing' | 'ripe' | 'wilted';
  stageText: string;
  flowerName: string | null;
  /** Lines under the title: progress, time to bloom, water, fertiliser. */
  lines: string[];
  water: ButtonVm | null;
  fertilize: ButtonVm | null;
  harvest: ButtonVm | null;
}

export function plotCardVm(world: WorldSave, index: number, now: number, dayOffsetMs: number, run: { water: CloudRun; fertilize: CloudRun; harvest: CloudRun }): PlotCardVm | null {
  const g = cloudOf(world);
  const plot = g.plots[index];
  if (!plot) return null;
  const flower = plot.cropId ? FLOWERS[plot.cropId] : undefined;
  const stage = flower ? plotStage(plot, PLOT_RULES, now) : 'empty';
  const view = plotViews(g, now, dayOffsetMs)[index]!;
  const lines: string[] = [];
  if (flower && stage === 'growing') {
    lines.push(t(vi.cloud.progress, { percent: Math.round(view.share * 100) }));
    lines.push(t(vi.cloud.ripeIn, { time: formatDuration(msToRipe(plot, flower, PLOT_RULES, false, now)) }));
    lines.push(view.watered ? vi.cloud.wetState : vi.cloud.dryState);
    if (plot.fertilized) lines.push(vi.cloud.fertilizedState);
    if (flower.kind === 'NIGHT') lines.push(vi.cloud.nightBonus);
  } else if (flower && plot.ripeAt !== null) {
    if (stage === 'ripe') lines.push(t(vi.cloud.wiltIn, { time: formatDuration(Math.max(0, plot.ripeAt + PLOT_RULES.witherAfterMs - now)) }));
    lines.push(t(vi.cloud.yieldNow, { count: view.yield, name: nameOfItem(flower.produceItem) }));
    if (flower.kind === 'NIGHT') lines.push(vi.cloud.nightBonus);
  }
  const fertilizers = world.inventory.items.item_fertilizer ?? 0;
  const growing = stage === 'growing';
  const waterE = growing ? probe(world, run.water, now) : 'NOTHING_TO_DO';
  return {
    index,
    title: t(vi.cloud.plotTitle, { n: index + 1 }),
    stage,
    stageText: vi.cloud.stage[stage],
    flowerName: flower?.nameVi ?? null,
    lines,
    water: growing ? { label: vi.cloud.giveWater, reason: waterE ? reasonOf(waterE, vi.cloud.wetState) : null } : null,
    fertilize: growing
      ? { label: t(vi.cloud.giveFertilizer, { count: fertilizers }), reason: plot.fertilized ? vi.cloud.fertilizedState : fertilizers === 0 ? vi.cloud.noFertilizer : null }
      : null,
    harvest: flower && plot.ripeAt !== null ? { label: vi.cloud.harvestPlot, reason: null } : null,
  };
}

export interface SpringVm {
  level: number;
  stock: string;
  levelText: string;
  /** "Next drop in …" or "full". */
  flow: string;
  collect: ButtonVm;
  /** The next level's button, null at the top. */
  next: (ButtonVm & { level: number }) | null;
}

/** " + 3 Ngọc trai" for the materials a level takes (empty when none). */
const materialsText = (materials: Readonly<Record<string, number | undefined>>): string => {
  const parts = Object.entries(materials).filter(([, n]) => (n ?? 0) > 0).map(([id, n]) => `${n} ${nameOfItem(id)}`);
  return parts.length === 0 ? '' : ` + ${parts.join(', ')}`;
};

const missingMaterial = (world: WorldSave, materials: Readonly<Record<string, number | undefined>>): string | null => {
  const lack = Object.entries(materials).find(([id, n]) => (world.inventory.items[id] ?? 0) < (n ?? 0));
  return lack ? t(vi.cloud.noMaterial, { name: nameOfItem(lack[0]) }) : null;
};

export function springVm(world: WorldSave, now: number): SpringVm {
  const g = cloudOf(world);
  const level = springLevel(g.spring.level);
  const stock = springStock(g, now);
  const next = nextSpringLevel(g);
  const nextRow = next ? springLevel(next.level) : null;
  return {
    level: g.spring.level,
    stock: t(vi.cloud.springStock, { count: stock, capacity: level.capacity }),
    levelText: t(vi.cloud.springLevel, { level: g.spring.level, interval: formatDuration(level.intervalMs) }),
    flow: stock >= level.capacity ? vi.cloud.springFull : t(vi.cloud.springNext, { time: formatDuration(msToNextWater(g, now)) }),
    collect: stock > 0 ? { label: t(vi.cloud.collectWater, { count: stock }), reason: null } : { label: t(vi.cloud.collectWater, { count: 0 }), reason: vi.cloud.noWaterYet },
    next:
      next && nextRow
        ? {
            level: next.level,
            label: t(vi.cloud.springUp, { level: next.level, interval: formatDuration(nextRow.intervalMs), capacity: nextRow.capacity, gold: gold(next.price) }) + materialsText(next.materials),
            reason: world.wallet.coins < next.price ? vi.cloud.noGold : missingMaterial(world, next.materials),
          }
        : null,
  };
}

export interface RecipeVm {
  recipe: Recipe;
  name: string;
  inputs: { name: string; have: number; need: number }[];
  outputs: string;
  duration: string;
  /** Most batches the bag allows (capped at the cauldron's limit). */
  maxBatches: number;
  /** Why the recipe cannot be made yet (a technology to buy), or null. */
  locked: string | null;
}

export interface CauldronVm {
  name: string;
  built: boolean;
  priceText: string;
  buildReason: string | null;
  recipes: RecipeVm[];
  /** The running or waiting job, null when idle. */
  job: null | { name: string; done: number; total: number; ready: number; nextIn: string | null; endsIn: string | null };
}

export function cauldronVm(world: WorldSave, now: number): CauldronVm {
  const g = cloudOf(world);
  const j = g.cauldron.job;
  const jr = j ? RECIPES[j.recipeId] : undefined;
  const next = j && jr ? nextBatchAt(j, jr, now) : null;
  return {
    name: vi.cloud.cauldron,
    built: g.cauldron.built,
    priceText: t(vi.cloud.cauldronNotBuilt, { gold: gold(CB.cauldron.price) }),
    buildReason: world.wallet.coins < CB.cauldron.price ? vi.cloud.noGold : null,
    recipes: recipesOf(CAULDRON).map((recipe) => ({
      recipe,
      name: recipe.name,
      inputs: Object.entries(recipe.inputs).map(([id, need]) => ({ name: nameOfItem(id), have: world.inventory.items[id] ?? 0, need })),
      outputs: Object.entries(recipe.outputs).map(([id, n]) => `${n} ${nameOfItem(id)}`).join(', '),
      duration: t(vi.cloud.perBatch, { time: formatDuration(sped(recipe, techBonus(world, 'productionSpeed'))) }),
      maxBatches: Math.min(CB.cauldron.maxBatches + techBonus(world, 'maxBatches'), affordableBatches(recipe, world.inventory.items)),
      locked: recipeLocked(world, recipe) ? t(vi.tech.locked, { tech: TECHS[recipe.requires!.tech]?.nameVi ?? recipe.requires!.tech, level: recipe.requires!.level }) : null,
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
