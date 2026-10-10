// "Trong lúc bạn vắng mặt" (spec §5, §9.5): the lines come from the farm's getSummary (what happened in
// the catch-up and what needs the player now), the trough line first — it teaches the player to stock
// up before logging off. Lines that name a place carry a button to it. Pure.
import type { SummaryLine } from '../../../core/area-registry/registry';
import { BALANCE } from '../logic/config/balance';
import type { GameEvent } from '../logic/events';
import type { FarmGoto } from '../logic/summary';
import { farmSummaryLines } from '../logic/summary';
import type { FarmGame } from '../logic/types';
import { formatDuration, formatTime, t } from '../../../i18n/format';
import { vi } from '../../../i18n/vi';

export interface AwayLine {
  text: string;
  tone: 'info' | 'warn' | 'alert';
  /** A button to the place that needs care (undefined = nothing to do). */
  action?: { label: string; goto: FarmGoto };
}

export interface AwayVm {
  title: string;
  duration: string;
  /** The trough line, always present. */
  trough: string;
  troughRanOut: boolean;
  /** Button to the trough when it ran dry. */
  troughAction?: { label: string; goto: FarmGoto };
  /** Everything else that happened or needs care; one "all fine" line when empty. */
  lines: AwayLine[];
}

const BUTTON: Record<FarmGoto['target'], string> = {
  pig: vi.away.goPig,
  well: vi.away.goWell,
  trough: vi.away.goTrough,
  orders: vi.away.goOrders,
  garden: vi.away.goGarden,
};

/** `summary.farm.sick` → the string in the table. */
const template = (key: string): string =>
  key.split('.').reduce<unknown>((o, k) => (o as Record<string, unknown> | undefined)?.[k], vi) as string;

function lineVm(line: SummaryLine): AwayLine {
  const goto = line.goto as FarmGoto | undefined;
  return {
    text: t(template(line.key), line.params ?? {}),
    tone: line.tone ?? 'info',
    ...(goto ? { action: { label: BUTTON[goto.target], goto } } : {}),
  };
}

/** `after` is the save after the catch-up; `now` its time; `awayMs` how long the world slept. */
/** `others`: lines of the other Areas (the Garden), appended after the farm's own. */
export function awayVm(events: readonly GameEvent[], after: FarmGame, now: number, awayMs: number, others: readonly SummaryLine[] = []): AwayVm {
  const left = now - awayMs;
  const zeroAts = events.flatMap((e) => (e.type === 'PIG_HUNGRY_ZERO' && e.stalled ? [e.at] : []));
  const emptiedAt = events.find((e) => e.type === 'TROUGH_EMPTY')?.at ?? null;
  // Pigs that are not growing now for lack of food, including ones already starving at departure.
  const stalled = after.pigs.filter((p) => p.hunger <= BALANCE.GROWTH_MIN_HUNGER && p.growthProgress < 100).length;
  const ranOut = emptiedAt !== null || stalled > 0;
  const since = zeroAts.length > 0 ? Math.min(...zeroAts) : Math.max(left, emptiedAt ?? left);
  const trough = ranOut
    ? t(vi.away.troughRanOut, {
        time: formatTime(emptiedAt ?? since),
        count: stalled,
        duration: formatDuration(Math.max(0, now - since)),
      })
    : vi.away.troughOk;

  const lines = [...farmSummaryLines(events, after, now), ...others].map(lineVm);
  if (lines.length === 0) lines.push({ text: vi.away.nothing, tone: 'info' });

  return {
    title: vi.away.title,
    duration: t(vi.away.duration, { time: formatDuration(awayMs) }),
    trough,
    troughRanOut: ranOut,
    ...(ranOut ? { troughAction: { label: vi.away.goTrough, goto: { target: 'trough' } as FarmGoto } } : {}),
    lines,
  };
}
