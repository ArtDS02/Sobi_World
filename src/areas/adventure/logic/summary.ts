// The Adventure's lines for the "while you were away" screen (AreaModule.getSummary, spec §5): what waits for the player.
import type { SummaryLine } from '../../../core/area-registry/registry';
import type { AdventureState } from './state';

export const ADVENTURE_GOTO = { target: 'adventure' } as const;

export function adventureSummaryLines(a: AdventureState, now: number): SummaryLine[] {
  const lines: SummaryLine[] = [];
  if (a.run && a.run.phase !== 'done') lines.push({ key: 'summary.adventure.run', goto: ADVENTURE_GOTO });
  if (a.run?.phase === 'done') lines.push({ key: 'summary.adventure.result', goto: ADVENTURE_GOTO });
  const loot = Object.values(a.pending).reduce((n, v) => n + v, 0);
  if (loot > 0) lines.push({ key: 'summary.adventure.loot', params: { count: loot }, goto: ADVENTURE_GOTO });
  const rested = Object.values(a.fighters).filter((f) => f.exhaustedUntil !== null && f.exhaustedUntil > a.lastTickedAt && f.exhaustedUntil <= now).length;
  if (rested > 0) lines.push({ key: 'summary.adventure.rested', params: { count: rested } });
  return lines;
}
