// The creatures as companions (decision 039): two Guardian lines in one team share a bond (a bonus for the whole team), a fighter's
// feats earn titles, and each line has its own words for a win, a boss, a chest, a hard moment or a new level. Pure.
import { hashSeed, mulberry32 } from '../../../core/rng';
import type { QUIP_TRIGGERS } from '../../../../content/schemas/adventure/engagement';
import { ENGAGEMENT, type LineageId, type Synergy, type Title } from './config/content';
import type { Fighter, MemberMods, RunMember } from './state';

/** The bonds a team of these lines shares. */
export const activeSynergies = (lineages: readonly LineageId[]): Synergy[] => ENGAGEMENT.synergies.filter((s) => s.lineages.every((l) => lineages.includes(l)));

function addShares(into: Record<string, number>, from: Readonly<Record<string, number | undefined>> | undefined) {
  for (const [k, v] of Object.entries(from ?? {})) if (v !== undefined) into[k] = (into[k] ?? 0) + v;
}

/** Bonus mods added onto a member's (gear caps still apply in battle). */
export function addMods(mods: MemberMods, extra: Synergy['mods']): MemberMods {
  const out: MemberMods = {
    elementDamage: { ...mods.elementDamage },
    elementResist: { ...mods.elementResist },
    statusChance: { ...mods.statusChance },
    statusResist: { ...mods.statusResist },
    categoryDamage: { ...mods.categoryDamage },
  };
  addShares(out.elementDamage, extra.elementDamage);
  addShares(out.elementResist, extra.elementResist);
  addShares(out.statusChance, extra.statusChance);
  addShares(out.statusResist, extra.statusResist);
  addShares(out.categoryDamage, extra.categoryDamage);
  return out;
}

/** The team with its bonds applied to every member. */
export function withSynergies(team: readonly RunMember[]): RunMember[] {
  const bonds = activeSynergies(team.map((m) => m.lineage));
  return team.map((m) => ({ ...m, mods: bonds.reduce((mods, s) => addMods(mods, s.mods), m.mods) }));
}

/** Has the fighter earned the title. */
export function hasTitle(f: Pick<Fighter, 'feats' | 'bossClears'>, t: Title): boolean {
  switch (t.kind) {
    case 'battles':
      return f.feats.battles >= t.value;
    case 'bestHit':
      return f.feats.bestHit >= t.value;
    case 'ultimates':
      return f.feats.ultimates >= t.value;
    case 'rift':
      return f.feats.rift >= t.value;
    case 'boss':
      return t.target !== null && f.bossClears.includes(t.target);
    case 'nightmare':
      return t.target !== null && f.feats.nightmares.includes(t.target);
  }
}

/** Every title earned, highest rank first. */
export const titlesOf = (f: Pick<Fighter, 'feats' | 'bossClears'>): Title[] => ENGAGEMENT.titles.filter((t) => hasTitle(f, t)).sort((a, b) => b.rank - a.rank);

/** The title shown with its name (the highest earned), or null. */
export const titleOf = (f: Pick<Fighter, 'feats' | 'bossClears'> | undefined): Title | null => (f ? (titlesOf(f)[0] ?? null) : null);

export type QuipTrigger = (typeof QUIP_TRIGGERS)[number];

/** The line `n` of a Guardian line for a moment (wraps around). */
export function quipLine(lineage: LineageId, trigger: QuipTrigger, n: number): string {
  const lines = ENGAGEMENT.quips[lineage][trigger];
  return lines[((n % lines.length) + lines.length) % lines.length]!;
}

/** Who speaks and which line, drawn from `seed`; null when nobody does (a normal win speaks only now and then). */
export function pickQuip(team: readonly RunMember[], trigger: QuipTrigger, seed: number, always: boolean): { key: string; name: string; lineage: LineageId; n: number } | null {
  const rng = mulberry32(hashSeed('quip', seed, trigger));
  if (!always && rng.next() >= ENGAGEMENT.quipChance) return null;
  const standing = team.filter((m) => m.hp > 0);
  const pool = standing.length > 0 ? standing : team;
  if (pool.length === 0) return null;
  const m = pool[Math.floor(rng.next() * pool.length)]!;
  return { key: m.key, name: m.name, lineage: m.lineage, n: Math.floor(rng.next() * 8) };
}
