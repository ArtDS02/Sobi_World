// What the screens show about traits, the family tree and the Breeder's rumours (GĐ7). Pure view-models:
// the rules live in systems/breeding and logic/heredity.ts.
import { formatDec, t } from '../../../i18n/format';
import { vi } from '../../../i18n/vi';
import { gameDay } from '../../../systems/health/disease';
import { BREEDING_RULES_DEFAULT, flattenAncestors, mutationChance, rumorsOfDay, TRAITS, type Ancestor, type Rumor, type TraitDef } from '../../../systems/breeding';
import { RUMOR_TEXTS } from '../../../core/config/breeding';
import { MUTATIONS } from '../logic/config/breedingRules';
import { BREEDS } from '../logic/config/breeds';
import type { BreedId } from '../logic/config/ids';
import { parentTraits, pigHearts } from '../logic/heredity';
import type { FarmGame, Pig } from '../logic/types';

/** One trait as a chip: its name, what it does, and whether it is a hidden one (open or still closed). */
export interface TraitChipVm {
  id: string | null;
  name: string;
  /** "Giá x1.25 · Lớn nhanh x1.3" */
  effects: string;
  desc: string;
  tier: TraitDef['tier'] | null;
  hidden: 'open' | 'locked' | null;
}

const effectText = (d: TraitDef): string =>
  (Object.entries(d.effects) as [keyof TraitDef['effects'], number][])
    .map(([k, n]) => t(vi.heredity.effect[k], { n: formatDec(n) }))
    .join(' · ');

const chipOf = (id: string, hidden: TraitChipVm['hidden']): TraitChipVm => {
  const d = TRAITS.get(id);
  return { id, name: d?.nameVi ?? id, effects: d ? effectText(d) : '', desc: d?.descVi ?? '', tier: d?.tier ?? null, hidden };
};

/** The pig's traits: the visible ones, then the hidden one (named once 5 hearts opened it, a lock before). */
export function traitChips(pig: Pig): TraitChipVm[] {
  const chips = (pig.traits ?? []).map((id) => chipOf(id, null));
  if (pig.hiddenTrait) {
    chips.push(
      pigHearts(pig) >= 5
        ? chipOf(pig.hiddenTrait, 'open')
        : { id: null, name: '???', effects: '', desc: vi.heredity.hiddenLocked, tier: null, hidden: 'locked' },
    );
  }
  return chips;
}

export interface AncestorVm {
  name: string;
  breedName: string;
  artId: string;
  gender: 'MALE' | 'FEMALE';
  generation: string;
  traits: string[];
  /** Species the farm no longer lists is shown by id, never hidden. */
  known: boolean;
}

export interface PedigreeLevelVm {
  title: string;
  ancestors: AncestorVm[];
}

export interface PedigreeVm {
  title: string;
  self: AncestorVm;
  /** Bred pigs: one level per generation back, nearest first. */
  levels: PedigreeLevelVm[];
  /** Empty for a pig that was bought or born before the tree was kept. */
  empty: string | null;
}

const ancestorVm = (a: Ancestor): AncestorVm => {
  const def = BREEDS[a.breed as BreedId];
  return {
    name: a.name,
    breedName: def?.nameVi ?? a.breed,
    artId: def?.artId ?? 'pig_classic',
    gender: a.gender,
    generation: t(vi.heredity.generation, { n: a.generation }),
    traits: (a.traits ?? []).map((id) => TRAITS.get(id)?.nameVi ?? id),
    known: def !== undefined,
  };
};

/** The family tree of a pig (or a newborn): itself, then its ancestors level by level. */
export function pedigreeVm(pig: Pick<Pig, 'name' | 'breed' | 'gender' | 'generation' | 'traits' | 'lineage'>): PedigreeVm {
  const self = ancestorVm({ name: pig.name, breed: pig.breed, gender: pig.gender, generation: pig.generation ?? 1, ...(pig.traits ? { traits: pig.traits } : {}) });
  const tree = pig.lineage;
  const levels: PedigreeLevelVm[] = [];
  let level = tree ? [tree.mother, tree.father].filter((a): a is Ancestor => !!a) : [];
  while (level.length > 0) {
    levels.push({
      title: vi.heredity.levels[levels.length] ?? vi.heredity.levelFar,
      ancestors: level.map(ancestorVm),
    });
    level = level.flatMap((a) => [a.mother, a.father].filter((x): x is Ancestor => !!x));
  }
  return {
    title: t(vi.heredity.pedigreeTitle, { name: pig.name }),
    self,
    levels,
    empty: levels.length === 0 ? t(vi.heredity.pedigreeNoParents, { name: pig.name }) : null,
  };
}

/** How many ancestors a tree holds (tests, the panel's button hint). */
export const ancestorCount = (pig: Pick<Pig, 'lineage'>): number => (pig.lineage ? flattenAncestors(pig.lineage).length : 0);

export interface BreedingExtrasVm {
  /** "Cơ hội đột biến: 4%" for this pair. */
  mutation: string;
  /** "Vận may: +6% cơ hội ra heo hiếm", or null when none is saved. */
  pity: string | null;
  /** Traits each parent can pass on: "Mập mạp, Móng vàng (ẩn)". */
  mother: string[];
  father: string[];
}

/** The extra lines of the breeding dialog: parents' traits, the mutation chance of the pair and the saved pity. */
export function breedingExtras(save: FarmGame, a: Pig, b: Pig): BreedingExtrasVm {
  const chance = mutationChance([parentTraits(a), parentTraits(b)], TRAITS, BREEDING_RULES_DEFAULT);
  const pity = save.breedingPity ?? 0;
  const names = (p: Pig) => [...(p.traits ?? []).map((id) => TRAITS.get(id)?.nameVi ?? id), ...(p.hiddenTrait ? [`${TRAITS.get(p.hiddenTrait)?.nameVi ?? '???'} (${vi.heredity.hiddenTag})`] : [])];
  return {
    mutation: t(vi.heredity.mutation, { n: formatDec(chance) }),
    pity: pity > 0 ? t(vi.heredity.pity, { n: formatDec(pity) }) : null,
    mother: names(a),
    father: names(b),
  };
}

export interface BreederVm {
  rumors: Rumor[];
}

/** The Breeder's rumours for the day of `now` (stable within the day, the same for every save that knows the same breeds). */
export function breederVm(save: FarmGame, now: number, dayOffsetMs: number): BreederVm {
  const known = new Set<string>(save.collection.discoveredBreeds);
  const look = (breed: string) => {
    const def = BREEDS[breed as BreedId];
    return {
      clue: t(vi.breeder.clue, { rarity: vi.rarity[def.rarity].toLowerCase(), family: vi.family[def.family] }),
      rarity: def.rarity,
      theme: vi.family[def.family],
    };
  };
  return {
    rumors: rumorsOfDay({
      day: gameDay(now, dayOffsetMs),
      recipes: MUTATIONS.filter((m) => BREEDS[m.result].enabled).map((m) => ({ parents: m.parents, result: m.result })),
      isKnown: (b) => known.has(b),
      look,
      texts: RUMOR_TEXTS,
      perDay: BREEDING_RULES_DEFAULT.rumors.perDay,
    }),
  };
}
