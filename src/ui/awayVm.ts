// "Trong lúc bạn vắng mặt" (spec §9.5): built from the catch-up events only. The trough line
// comes first — it is the one that teaches the player to stock up before logging off. Pure.
import type { GameEvent } from '../core/events';
import type { SaveGame } from '../core/types';
import { formatDuration, formatTime, t } from '../i18n/format';
import { vi } from '../i18n/vi';

export interface AwayVm {
  title: string;
  duration: string;
  /** The trough line, always present. */
  trough: string;
  troughRanOut: boolean;
  /** Everything else that happened; vi.away.nothing when empty. */
  lines: string[];
}

const count = (events: readonly GameEvent[], type: GameEvent['type']) =>
  events.filter((e) => e.type === type).length;

/** `after` is the save after the catch-up; `now` its time; `awayMs` how long the world slept. */
export function awayVm(
  events: readonly GameEvent[],
  after: SaveGame,
  now: number,
  awayMs: number,
): AwayVm {
  const left = now - awayMs;
  const zeroAts = events.flatMap((e) => (e.type === 'PIG_HUNGRY_ZERO' && e.stalled ? [e.at] : []));
  const emptiedAt = events.find((e) => e.type === 'TROUGH_EMPTY')?.at ?? null;
  // Pigs that are not growing now for lack of food, including ones already starving at departure.
  const stalled = after.pigs.filter((p) => p.hunger <= 0 && p.growthProgress < 100).length;
  const ranOut = emptiedAt !== null || stalled > 0;
  const since = zeroAts.length > 0 ? Math.min(...zeroAts) : Math.max(left, emptiedAt ?? left);
  const trough = ranOut
    ? t(vi.away.troughRanOut, {
        time: formatTime(emptiedAt ?? since),
        count: stalled,
        duration: formatDuration(Math.max(0, now - since)),
      })
    : vi.away.troughOk;

  const lines: string[] = [];
  const add = (template: string, n: number) => {
    if (n > 0) lines.push(t(template, { count: n }));
  };
  add(vi.away.grewUp, count(events, 'PIG_BECAME_ADULT'));
  add(vi.away.gotSick, count(events, 'PIG_BECAME_SICK'));
  add(vi.away.born, count(events, 'BIRTH'));
  add(vi.away.ordersNew, count(events, 'ORDER_NEW'));
  add(vi.away.ordersExpired, count(events, 'ORDER_EXPIRED'));
  if (lines.length === 0) lines.push(vi.away.nothing);

  return {
    title: vi.away.title,
    duration: t(vi.away.duration, { time: formatDuration(awayMs) }),
    trough,
    troughRanOut: ranOut,
    lines,
  };
}
