// The Codex (spec V2 §6): what the player has discovered, per kind (`breed`, `crop`, `item`…), in
// `collection.discovered`, and the milestones of total entries. A first discovery pays a little; a milestone
// pays when the player claims it. Breeds are discovered by the Farm's own rules (its balance pays them).
import type { codexFileSchema } from '../../../content/schemas/shared/codex';
import type { z } from 'zod';
import { changeCurrency } from '../economy/ledger';
import type { WorldLevelUp } from '../progression/xp';
import type { WorldSave } from '../save/world';
import type { ActionContext, ActionResultOf } from '../types';

export type CodexRules = z.infer<typeof codexFileSchema>;
export type Milestone = CodexRules['milestones'][number];

/** One thing that can be discovered. The name and art are the Area's (shown by the screens, never stored). */
export interface CodexEntry {
  id: string;
  name: string;
  artId?: string;
  rarity?: string;
  /** Said under an undiscovered entry's "???" (a clue, never the answer) and, once found, what the entry is. */
  hint?: string;
  detail?: string;
}

/** Everything of one kind the world offers; the Areas list theirs (`AreaModule.codex`). */
export interface CodexKind {
  id: string;
  name: string;
  entries: readonly CodexEntry[];
}

export const codexCounts = (discovered: Readonly<Record<string, readonly string[]>>): { total: number; byKind: Record<string, number> } => {
  const byKind = Object.fromEntries(Object.entries(discovered).map(([kind, ids]) => [kind, ids.length]));
  return { total: Object.values(byKind).reduce((n, c) => n + c, 0), byKind };
};

export type CodexEvent =
  | { type: 'CODEX_DISCOVERED'; kind: string; id: string; coins: number; xp: number }
  | { type: 'CODEX_MILESTONE_REACHED'; id: string }
  | { type: 'CODEX_MILESTONE_CLAIMED'; id: string; coins: number; gems: number; xp: number };

type AddXp = (w: WorldSave, xp: number) => { state: WorldSave; events: WorldLevelUp[] };

/** Records `id` of `kind` if it is new, with its first-discovery bonus; the same world otherwise. */
export function discover(
  world: WorldSave,
  kind: 'crop' | 'item' | 'fish' | 'flower',
  id: string,
  rules: CodexRules,
  ctx: ActionContext,
  addXp: AddXp,
): { state: WorldSave; events: (CodexEvent | WorldLevelUp)[] } {
  const known = world.collection.discovered[kind] ?? [];
  if (known.includes(id)) return { state: world, events: [] };
  const bonus = rules.discovery[kind];
  let state: WorldSave = {
    ...world,
    collection: { ...world.collection, discovered: { ...world.collection.discovered, [kind]: [...known, id] } },
  };
  if (bonus.coins > 0) {
    const paid = changeCurrency(state, 'coins', bonus.coins, { type: 'CODEX_DISCOVERY', refId: id }, ctx);
    if (paid.ok) state = paid.state;
  }
  const xp = addXp(state, bonus.xp);
  return { state: xp.state, events: [{ type: 'CODEX_DISCOVERED', kind, id, coins: bonus.coins, xp: bonus.xp }, ...xp.events] };
}

/** Milestones the total reaches and that are not claimed yet. */
export const claimableMilestones = (rules: CodexRules, total: number, claimed: readonly string[]): Milestone[] =>
  rules.milestones.filter((m) => total >= m.entries && !claimed.includes(m.id));

/** Pays one milestone. */
export function claimMilestone(
  world: WorldSave,
  args: { id: string },
  ctx: ActionContext,
  rules: CodexRules,
  addXp: AddXp,
): ActionResultOf<WorldSave, CodexEvent | WorldLevelUp> {
  const m = rules.milestones.find((x) => x.id === args.id);
  if (!m) return { ok: false, error: 'INVALID_REQUEST' };
  if (world.collection.claimed.includes(m.id)) return { ok: false, error: 'ALREADY_CLAIMED' };
  if (codexCounts(world.collection.discovered).total < m.entries) return { ok: false, error: 'ACHIEVEMENT_LOCKED' };
  let state: WorldSave = { ...world, collection: { ...world.collection, claimed: [...world.collection.claimed, m.id] } };
  for (const [currency, amount] of [['coins', m.coins], ['gems', m.gems]] as const) {
    if (amount <= 0) continue;
    const paid = changeCurrency(state, currency, amount, { type: 'CODEX_MILESTONE', refId: m.id }, ctx);
    if (!paid.ok) return paid;
    state = paid.state;
  }
  const xp = addXp(state, m.xp);
  return { ok: true, state: xp.state, events: [{ type: 'CODEX_MILESTONE_CLAIMED', id: m.id, coins: m.coins, gems: m.gems, xp: m.xp }, ...xp.events] };
}
