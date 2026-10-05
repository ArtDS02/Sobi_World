// Gene pool (DECISIONS MU-1): a species' genetic profile (pig type, rarity, theme, gene tags) and
// the weight a candidate child gets inside a random-genetics bucket. Pure.
//
// Extension point: future genetics (parent instance traits, dominant / recessive genes, mutation,
// a per-birth seed) plugs in through GeneticsContext — today only species-level data is used, and a
// species without gene tags simply breeds on rarity and parent type.
import { BREEDS, type Family } from '../../../core/config/breeds';
import { GENE_BONUSES, THEME_RELATIONS, type GeneBonuses } from '../../../core/config/genePool';
import type { BreedId } from '../../../core/config/ids';
import type { Rarity } from '../../../core/config/rarity';
import { SPECIES_TRAITS, type Trait } from '../../../core/config/speciesTraits';

export interface GeneProfile {
  pigType: BreedId;
  rarity: Rarity;
  /** The species' family (collection theme). */
  theme: Family;
  geneTags: readonly Trait[];
}

/** What genetics may read besides the two species. Every field optional (= today's behaviour). */
export interface GeneticsContext {
  bonuses?: GeneBonuses;
  relations?: readonly (readonly [Family, Family])[];
  /** Future: the parent instances' own traits (inherited, mutated) — unused today. */
  parentTraits?: readonly [readonly Trait[], readonly Trait[]];
}

export function geneProfile(id: BreedId): GeneProfile {
  const b = BREEDS[id];
  return { pigType: id, rarity: b.rarity, theme: b.family, geneTags: SPECIES_TRAITS[id] ?? [] };
}

export function themesRelated(
  x: Family,
  y: Family,
  relations: readonly (readonly [Family, Family])[] = THEME_RELATIONS,
): boolean {
  return x !== y && relations.some(([p, q]) => (p === x && q === y) || (p === y && q === x));
}

/** Weight of `candidate` inside its bucket for parents a × b (≥ bonuses.base > 0). */
export function geneWeight(
  candidate: BreedId,
  a: BreedId,
  b: BreedId,
  ctx: GeneticsContext = {},
): number {
  const B = ctx.bonuses ?? GENE_BONUSES;
  const rel = ctx.relations ?? THEME_RELATIONS;
  const c = geneProfile(candidate);
  const pa = geneProfile(a);
  const pb = geneProfile(b);
  const parentTags = new Set([
    ...(ctx.parentTraits?.[0] ?? pa.geneTags),
    ...(ctx.parentTraits?.[1] ?? pb.geneTags),
  ]);
  const shared = c.geneTags.filter((t) => parentTags.has(t)).length;
  const same = c.theme === pa.theme || c.theme === pb.theme;
  const related = !same && (themesRelated(c.theme, pa.theme, rel) || themesRelated(c.theme, pb.theme, rel));
  return (
    B.base +
    (same ? B.sameTheme : 0) +
    (related ? B.relatedTheme : 0) +
    B.perGeneTag * Math.min(shared, B.geneTagCap)
  );
}
