// What a fish's dialog shows, as plain data: needs, health and its warning, hearts, favourite food, traits, the purpose
// chips, what each care button can do, and the sale quote. Availability comes from dry-running the real action. Pure.
import type { Purpose } from '../../../../content/schemas/vocab';
import { itemArtId } from '../../../core/config/assetIds';
import { BOND } from '../../../core/config/bond';
import { HEALTH } from '../../../core/config/health';
import type { WorldSave } from '../../../core/save/world';
import { formatDuration, t } from '../../../i18n/format';
import { vi } from '../../../i18n/vi';
import { heartsOf, petsLeft } from '../../../systems/bond/bond';
import { TRAITS, type TraitDef } from '../../../systems/breeding';
import { gameDay } from '../../../systems/health/disease';
import { sellFish } from '../logic/actions/trade';
import { setFishPurpose } from '../logic/actions/care';
import { FEED_ITEM, FISH } from '../logic/config/content';
import { fishFavorite } from '../logic/favorite';
import { fishHealth, fishStage } from '../logic/fishLife';
import { fishQuote } from '../logic/pricing';
import { aquariumOf } from '../logic/save/lens';
import type { Fish } from '../logic/state';
import { gold, nameOfItem, num, probe, reasonFor, type AquariumRun, type ButtonVm } from './vmKit';

export interface TraitChipVm {
  id: string | null;
  name: string;
  effects: string;
  desc: string;
  tier: TraitDef['tier'] | null;
  hidden: 'open' | 'locked' | null;
}

const effectText = (d: TraitDef): string =>
  (Object.entries(d.effects) as [keyof TraitDef['effects'], number][]).map(([k, n]) => t(vi.heredity.effect[k], { n: num(n) })).join(' · ');

const chipOf = (id: string, hidden: TraitChipVm['hidden']): TraitChipVm => {
  const d = TRAITS.get(id);
  return { id, name: d?.nameVi ?? id, effects: d ? effectText(d) : '', desc: d?.descVi ?? '', tier: d?.tier ?? null, hidden };
};

/** The fish's traits: the visible ones, then the hidden one (named once 5 hearts opened it, a lock before). */
export function traitChips(f: Fish): TraitChipVm[] {
  const chips = (f.traits ?? []).map((id) => chipOf(id, null));
  if (f.hiddenTrait) {
    chips.push(
      heartsOf(f.bond, BOND) >= 5
        ? chipOf(f.hiddenTrait, 'open')
        : { id: null, name: '???', effects: '', desc: vi.heredity.hiddenLocked, tier: null, hidden: 'locked' },
    );
  }
  return chips;
}

export interface PurposeChip {
  id: Purpose;
  label: string;
  title: string;
  active: boolean;
  reason: string | null;
  run: AquariumRun;
}

export interface FishCardVm {
  id: string;
  name: string;
  speciesName: string;
  art: string;
  rarity: string;
  stageText: string;
  genderText: string;
  generation: string;
  parents: string | null;
  needs: { hunger: number; clean: number; growth: number };
  needText: { hunger: string; clean: string; growth: string };
  health: { state: 'healthy' | 'ill' | 'critical'; text: string; warning: string | null };
  hearts: number;
  heartsText: string;
  heartsSummary: string;
  favorite: { itemId: string; item: string; art: string; have: number };
  quality: string;
  traits: TraitChipVm[];
  feed: ButtonVm;
  feedFavorite: ButtonVm;
  pet: ButtonVm;
  treat: ButtonVm;
  sell: ButtonVm;
  purposes: PurposeChip[];
  quote: { lines: string[]; price: number };
}

const HEART_FULL = '♥';
const HEART_EMPTY = '♡';
const PURPOSES: readonly Purpose[] = ['SHIP', 'BREED', 'PET'];

export function fishCardVm(world: WorldSave, fishId: string, now: number, dayOffsetMs: number): FishCardVm | null {
  const a = aquariumOf(world);
  const f = a.fish.find((x) => x.id === fishId);
  if (!f) return null;
  const species = FISH[f.breed]!;
  const hearts = heartsOf(f.bond, BOND);
  const health = fishHealth(f, now);
  const favoriteItem = fishFavorite(f);
  const quote = fishQuote(f, now);
  const stage = fishStage(f);
  const feedHave = world.inventory.items[FEED_ITEM] ?? 0;
  const favHave = world.inventory.items[favoriteItem] ?? 0;
  const run = (r: AquariumRun) => probe(world, r, now, dayOffsetMs);
  const day = gameDay(now, dayOffsetMs);

  const ill = f.isSick && f.lastSickAt !== undefined ? now - f.lastSickAt : 0;
  const critical = health === 'critical' || health === 'dead';
  const warning = !f.isSick
    ? null
    : critical
      ? t(vi.aquarium.warnCritical, { time: formatDuration(Math.max(0, (HEALTH.deathAfterMs ?? 0) - ill)) })
      : t(vi.aquarium.warnSick, { time: formatDuration(Math.max(0, (HEALTH.criticalAfterMs ?? 0) - ill)) });

  const feedError = f.hunger >= 100 ? vi.aquarium.full : feedHave === 0 ? vi.aquarium.noFeed : null;
  const favError = f.hunger >= 100 ? vi.aquarium.full : favHave === 0 ? vi.aquarium.noFavorite : null;
  const sellError = run((w, c) => sellFish(w, { fishId }, c));

  return {
    id: f.id,
    name: f.name,
    speciesName: species.nameVi,
    art: species.art,
    rarity: species.rarity,
    stageText: vi.aquarium.stage[stage],
    genderText: vi.aquarium.gender[f.gender],
    generation: t(vi.aquarium.generation, { n: f.generation ?? 1 }),
    parents: f.lineage?.mother && f.lineage.father ? t(vi.aquarium.parents, { mother: f.lineage.mother.name, father: f.lineage.father.name }) : null,
    needs: { hunger: Math.round(f.hunger), clean: Math.round(f.cleanliness), growth: Math.round(f.growthProgress) },
    needText: {
      hunger: t(vi.aquarium.hunger, { percent: Math.round(f.hunger) }),
      clean: t(vi.aquarium.clean, { percent: Math.round(f.cleanliness) }),
      growth: t(vi.aquarium.growth, { percent: Math.round(f.growthProgress) }),
    },
    health: { state: critical ? 'critical' : f.isSick ? 'ill' : 'healthy', text: critical ? vi.aquarium.critical : f.isSick ? vi.aquarium.sick : vi.aquarium.healthy, warning },
    hearts,
    heartsText: HEART_FULL.repeat(hearts) + HEART_EMPTY.repeat(5 - hearts),
    heartsSummary: t(vi.aquarium.hearts, { hearts }),
    favorite: { itemId: favoriteItem, item: nameOfItem(favoriteItem), art: itemArtId(favoriteItem), have: favHave },
    quality: t(vi.aquarium.quality, { quality: vi.quality[quote.quality] }),
    traits: traitChips(f),
    feed: { label: vi.aquarium.feed, reason: feedError },
    feedFavorite: { label: t(vi.aquarium.feedFavorite, { count: favHave }), reason: favError },
    pet: { label: vi.aquarium.pet, reason: petsLeft(f, day, BOND) <= 0 ? vi.aquarium.petLimit : null },
    treat: { label: vi.aquarium.treat, reason: !f.isSick ? vi.aquarium.notSick : (world.inventory.items.MEDICINE_COMMON ?? 0) === 0 ? vi.aquarium.noMedicine : null },
    sell: { label: t(vi.aquarium.sellFor, { gold: gold(quote.price) }), reason: sellError === 'FISH_NOT_MATURE' ? vi.aquarium.needAdult : sellError === 'FISH_IS_PET' ? vi.aquarium.isPet : sellError ? reasonFor(sellError) : null },
    purposes: PURPOSES.map((id): PurposeChip => {
      const r: AquariumRun = (w, c) => setFishPurpose(w, { fishId, purpose: id }, c);
      const error = run(r);
      const active = f.purpose === id;
      return { id, label: vi.purpose[id].name, title: vi.purpose[id].desc, active, reason: active ? null : error === 'FISH_NOT_MATURE' ? vi.aquarium.needAdult : error ? reasonFor(error) : null, run: r };
    }),
    quote: { price: quote.price, lines: quoteLines(f, now) },
  };
}

/** The lines of the sale dialog: the price is a base times named factors. */
export function quoteLines(f: Fish, now: number): string[] {
  const q = fishQuote(f, now);
  const lines = [
    t(vi.aquarium.quote.base, { gold: gold(q.base) }),
    t(vi.aquarium.quote.growth, { percent: Math.round(f.growthProgress), mult: num(q.growthFactor) }),
    t(vi.aquarium.quote.quality, { quality: vi.quality[q.quality], mult: num(q.qualityFactor) }),
  ];
  if (q.healthFactor !== 1) lines.push(t(vi.aquarium.quote.health, { mult: num(q.healthFactor) }));
  if (q.traitFactor !== 1) lines.push(t(vi.aquarium.quote.trait, { mult: num(q.traitFactor) }));
  lines.push(t(vi.aquarium.quote.final, { gold: gold(q.price) }));
  return lines;
}
