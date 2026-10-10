// The "next step" chip (spec V2 §13: always know what to do next): what the player could do now, from the Areas'
// suggestions and the world's own rewards, most urgent first. Pure.
import type { Suggestion } from '../../core/area-registry/registry';
import type { Goals } from '../../core/goals/api';
import { missingLines } from '../../core/goals/orders';
import { goalProgress } from '../../core/goals/daily';
import type { WorldSave } from '../../core/save/world';
import { t } from '../../i18n/format';
import { vi } from '../../i18n/vi';

/** Where the chip's button leads: a panel, a pig, a part of the farm or a place (the shell interprets it). */
export type NextGoto = { target: string; id?: string };

export interface NextStepVm {
  /** Identifies this suggestion, so a dismissed one stays dismissed until the suggestion changes. */
  id: string;
  text: string;
  tone: 'info' | 'warn' | 'alert';
  goto: NextGoto | null;
  /** How many more things wait after this one. */
  more: number;
}

export interface NextStepInput {
  world: WorldSave;
  goals: Goals;
  /** The Areas' own suggestions (registry.suggest), most urgent first. */
  area: readonly Suggestion[];
  place: 'plaza' | 'area' | 'garden' | 'aquarium' | 'cloud';
  /** The local day number, for today's login reward. */
  day: number;
  /** The next locked Area and what it needs, null when every Area is open. */
  next: { name: string; level: number } | null;
}

const text = (key: string, params: Readonly<Record<string, string | number>> = {}): string =>
  t(key.split('.').reduce<unknown>((o, k) => (o as Record<string, unknown> | undefined)?.[k], vi) as string, params);

const fromArea = (s: Suggestion): Candidate => ({ id: s.key + JSON.stringify(s.params ?? {}), text: text(s.key, s.params), tone: s.tone ?? 'info', goto: s.goto ?? null, priority: s.priority });

interface Candidate {
  id: string;
  text: string;
  tone: NextStepVm['tone'];
  goto: NextGoto | null;
  priority: number;
}

export function nextStepVm(input: NextStepInput): NextStepVm | null {
  const { world, goals, day } = input;
  const out: Candidate[] = input.area.map(fromArea);
  const login = world.progression.daily;
  if (login.lastDay === null || day > login.lastDay) {
    out.push({ id: 'login', text: text('suggest.world.login'), tone: 'info', goto: { target: 'panel', id: 'achievements' }, priority: 70 });
  }
  if (goals.claimableCount(world) > 0) {
    out.push({ id: 'reward', text: text('suggest.world.reward'), tone: 'info', goto: { target: 'panel', id: 'achievements' }, priority: 60 });
  }
  if (world.goals.board.slots.some((o) => o && missingLines(o, world.inventory.items).length === 0)) {
    out.push({ id: 'deliver', text: text('suggest.world.deliver'), tone: 'info', goto: { target: 'panel', id: 'orders' }, priority: 58 });
  }
  const open = world.goals.daily.goals.find((g) => !g.reached);
  if (open) {
    const template = (vi.goals.daily.templates as Record<string, string>)[open.id] ?? open.id;
    const progress = t(vi.goals.daily.progress, { current: goalProgress(open, world.progression.stats), target: open.target });
    out.push({ id: `goal:${open.id}`, text: text('suggest.world.goal', { text: t(template, { n: open.target }), progress }), tone: 'info', goto: { target: 'panel', id: 'achievements' }, priority: 5 });
  }
  if (input.next) {
    out.push({ id: `unlock:${input.next.name}`, text: text('suggest.world.unlock', { level: input.next.level, area: input.next.name }), tone: 'info', goto: null, priority: 2 });
  }
  if (input.place === 'plaza') {
    // A new player in the plaza is told where to walk before anything else (the shop is reached from the farm).
    const fresh = !world.progression.stats.pigsBought;
    out.push({ id: fresh ? 'enterFarm' : 'explore', text: text(fresh ? 'suggest.world.enterFarm' : 'suggest.world.explore'), tone: 'info', goto: null, priority: fresh ? 92 : 1 });
  }
  out.sort((a, b) => b.priority - a.priority);
  const top = out[0];
  if (!top) return { id: 'done', text: text('suggest.world.done'), tone: 'info', goto: null, more: 0 };
  return { id: top.id, text: top.text, tone: top.tone, goto: top.goto, more: Math.max(0, out.filter((c) => c.priority >= 10).length - 1) };
}
