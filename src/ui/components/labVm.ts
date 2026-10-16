// What the crossing lab shows (decision 035), shared by the Garden and the Cloud: two parent slots, what they give and
// with which chance, the cross button with its fee, and the crossing book. The Area hands in its species, recipes and
// lab state, and a dry-run of its cross action so a disabled reason is what dispatch would answer. Pure; unit-tested.
import type { ErrorCode } from '../../core/config/errors';
import { formatInt, t } from '../../i18n/format';
import { vi } from '../../i18n/vi';
import { crossChance, recipeFor, type HybridRecipe, type HybridRules } from '../../systems/hybrid';

export interface LabSpecies {
  id: string;
  name: string;
  /** Icon of its harvest (what a try uses). */
  art: string;
  /** Harvests of it in the bag. */
  have: number;
}

export interface LabInput {
  title: string;
  species: readonly LabSpecies[];
  recipes: readonly HybridRecipe[];
  rules: HybridRules;
  found: readonly string[];
  misses: Readonly<Record<string, number>>;
  cost: number;
  coins: number;
  /** Seeds a success gives. */
  seeds: number;
  /** Error of crossing a + b now, or null when it would run. */
  probe: (a: string, b: string) => ErrorCode | null;
}

export interface LabSlotVm {
  id: string;
  name: string;
  art: string;
  have: string;
  /** Enough of it for this try (two when both slots hold it). */
  enough: boolean;
}

export interface LabResultVm {
  /** The result's name, or "Giống bí ẩn" while it has never been found. */
  name: string;
  art: string;
  /** Not found yet: the picture is shown as a dark silhouette. */
  mystery: boolean;
  chance: number;
  chanceText: string;
  /** "Đã hụt 2 lần…" or "Lần này chắc chắn…", or null. */
  pity: string | null;
}

export interface LabBookEntryVm {
  recipeId: string;
  parents: readonly [LabSlotVm, LabSlotVm];
  result: LabResultVm;
  found: boolean;
  /** Both harvests are in the bag. */
  ready: boolean;
  status: string;
}

export interface LabVm {
  title: string;
  intro: string;
  progress: string;
  /** 0..100: share of the hybrids found. */
  progressPercent: number;
  slots: readonly [LabSlotVm | null, LabSlotVm | null];
  /** What the chosen pair gives; null when a slot is empty or the pair has no recipe. */
  result: LabResultVm | null;
  /** Why there is no result line ("Chọn đủ hai cây", "Cặp này không ra giống mới"). */
  note: string | null;
  cross: { label: string; reason: string | null };
  picker: readonly LabSlotVm[];
  book: readonly LabBookEntryVm[];
}

const reasonOf = (e: ErrorCode): string =>
  e === 'INSUFFICIENT_GOLD' ? vi.garden.noGold : e === 'INSUFFICIENT_ITEM' ? vi.lab.pickTwo : e === 'NO_HYBRID_RECIPE' ? vi.lab.noRecipe : vi.error[e];

function slot(s: LabSpecies | undefined, need: number): LabSlotVm | null {
  if (!s) return null;
  return { id: s.id, name: s.name, art: s.art, have: t(vi.lab.have, { count: formatInt(s.have) }), enough: s.have >= need };
}

function resultOf(r: HybridRecipe, input: LabInput, byId: ReadonlyMap<string, LabSpecies>): LabResultVm {
  const misses = input.misses[r.id] ?? 0;
  const chance = Math.round(crossChance(r, misses, input.rules));
  const found = input.found.includes(r.result);
  const target = byId.get(r.result);
  return {
    name: found ? (target?.name ?? r.result) : vi.lab.unknown,
    art: target?.art ?? '',
    mystery: !found,
    chance,
    chanceText: t(vi.lab.chance, { percent: chance }),
    pity: chance >= 100 ? vi.lab.sure : misses > 0 ? t(vi.lab.pity, { misses }) : null,
  };
}

export function labVm(input: LabInput, a: string | null, b: string | null): LabVm {
  const byId = new Map(input.species.map((s) => [s.id, s]));
  const same = a !== null && a === b;
  const slots = [slot(a ? byId.get(a) : undefined, same ? 2 : 1), slot(b ? byId.get(b) : undefined, same ? 2 : 1)] as const;
  const recipe = a && b ? recipeFor(input.recipes, a, b) : undefined;
  const error = a && b ? input.probe(a, b) : 'INSUFFICIENT_ITEM';
  const results = new Set(input.recipes.map((r) => r.result));
  const found = [...results].filter((id) => input.found.includes(id)).length;
  const fee = formatInt(input.cost);
  return {
    title: input.title,
    intro: t(vi.lab.intro, { gold: fee }),
    progress: t(vi.lab.progress, { found, total: results.size }),
    progressPercent: results.size === 0 ? 0 : Math.round((found / results.size) * 100),
    slots,
    result: recipe ? resultOf(recipe, input, byId) : null,
    note: !a || !b ? vi.lab.pickTwo : recipe ? null : vi.lab.noRecipe,
    cross: {
      label: t(vi.lab.cross, { gold: fee }),
      // Missing harvests name the one that is short ("Thiếu Cà rốt").
      reason: !error ? null : error === 'INSUFFICIENT_ITEM' && slots[0] && slots[1] ? t(vi.lab.missing, { name: (slots[0].enough ? slots[1] : slots[0]).name }) : reasonOf(error),
    },
    picker: input.species.map((s) => slot(s, 1)!),
    book: input.recipes.map((r) => {
      const p0 = byId.get(r.parents[0]), p1 = byId.get(r.parents[1]);
      const twice = r.parents[0] === r.parents[1];
      const parents = [slot(p0, twice ? 2 : 1)!, slot(p1, twice ? 2 : 1)!] as const;
      const ready = parents[0].enough && parents[1].enough;
      const isFound = input.found.includes(r.result);
      return {
        recipeId: r.id,
        parents,
        result: resultOf(r, input, byId),
        found: isFound,
        ready,
        status: ready ? vi.lab.ready : t(vi.lab.missing, { name: (parents[0].enough ? parents[1] : parents[0]).name }),
      };
    }),
  };
}
