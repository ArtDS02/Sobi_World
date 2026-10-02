// Day / night (DN task): which phase a local time-of-day is in and the blended look to draw. Pure:
// callers pass the minute of the local day (0..1439), never a clock.
import {
  DAY_NIGHT_LIMITS,
  DAY_PHASES,
  PHASE_LOOKS,
  type DayNightSettings,
  type DayPhase,
  type PhaseLook,
} from '../config/dayNight';

export const MINUTES_PER_DAY = 1440;

/** "HH:MM" → minutes after midnight, or null when malformed / out of range. */
export function parseHm(text: string): number | null {
  const m = /^(\d{1,2}):(\d{2})$/.exec(text.trim());
  if (!m) return null;
  const h = Number(m[1]);
  const min = Number(m[2]);
  return h < 24 && min < 60 ? h * 60 + min : null;
}

/** Minutes after midnight → "HH:MM". */
export function formatHm(minute: number): string {
  const m = ((Math.floor(minute) % MINUTES_PER_DAY) + MINUTES_PER_DAY) % MINUTES_PER_DAY;
  return `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`;
}

/** Admin / test validation: messages for every broken rule (empty = valid). */
export function dayNightIssues(s: DayNightSettings): string[] {
  const issues: string[] = [];
  let prev = -1;
  for (const phase of DAY_PHASES) {
    const at = parseHm(s.phases[phase] ?? '');
    if (at === null) issues.push(`${phase}: giờ không hợp lệ (HH:MM)`);
    else if (at <= prev) issues.push(`${phase}: phải sau mốc trước`);
    else prev = at;
  }
  if (!Number.isInteger(s.blendMinutes) || s.blendMinutes < 0) {
    issues.push('blendMinutes: số nguyên ≥ 0');
  } else if (s.blendMinutes > DAY_NIGHT_LIMITS.blendMaxMinutes) {
    issues.push(`blendMinutes: tối đa ${DAY_NIGHT_LIMITS.blendMaxMinutes}`);
  } else if (issues.length === 0 && s.blendMinutes > shortestPhase(s)) {
    issues.push('blendMinutes: dài hơn pha ngắn nhất');
  }
  if (!Number.isInteger(s.transitionMs) || s.transitionMs < 0) {
    issues.push('transitionMs: số nguyên ≥ 0');
  } else if (s.transitionMs > DAY_NIGHT_LIMITS.transitionMaxMs) {
    issues.push(`transitionMs: tối đa ${DAY_NIGHT_LIMITS.transitionMaxMs}`);
  }
  return issues;
}

/** Phase start times in DAY_PHASES order (assumes valid settings). */
function starts(s: DayNightSettings): number[] {
  return DAY_PHASES.map((p) => parseHm(s.phases[p]) ?? 0);
}

function shortestPhase(s: DayNightSettings): number {
  const at = starts(s);
  return Math.min(
    ...at.map((a, i) => {
      const next = at[(i + 1) % at.length]!;
      return (next - a + MINUTES_PER_DAY) % MINUTES_PER_DAY || MINUTES_PER_DAY;
    }),
  );
}

/** Index of the phase whose start is the latest one at or before `minute` (cyclic). */
function phaseIndex(at: number[], minute: number): number {
  let index = at.length - 1; // before the first start: still last night
  at.forEach((a, i) => {
    if (a <= minute) index = i;
  });
  return index;
}

/** The phase the local time is in (its start ≤ minute < next start, wrapping at midnight). */
export function phaseAt(minute: number, s: DayNightSettings): DayPhase {
  return DAY_PHASES[phaseIndex(starts(s), wrap(minute))]!;
}

const wrap = (minute: number) => ((minute % MINUTES_PER_DAY) + MINUTES_PER_DAY) % MINUTES_PER_DAY;

export interface DayBlend {
  from: DayPhase;
  to: DayPhase;
  /** 0 = all `from`, 1 = all `to` (eased). */
  t: number;
}

const smooth = (t: number) => t * t * (3 - 2 * t);

/**
 * Which two phases are on screen: around each start time the previous phase blends into the next
 * over `blendMinutes`, centred on the start (half before, half after).
 */
export function blendAt(minute: number, s: DayNightSettings): DayBlend {
  const at = starts(s);
  const m = wrap(minute);
  const i = phaseIndex(at, m);
  const n = at.length;
  const half = s.blendMinutes / 2;
  const sinceStart = (m - at[i]! + MINUTES_PER_DAY) % MINUTES_PER_DAY;
  const toNext = (at[(i + 1) % n]! - m + MINUTES_PER_DAY) % MINUTES_PER_DAY;
  const phase = DAY_PHASES[i]!;
  if (half > 0 && sinceStart < half) {
    const prev = DAY_PHASES[(i - 1 + n) % n]!;
    return { from: prev, to: phase, t: smooth(0.5 + sinceStart / (2 * half)) };
  }
  if (half > 0 && toNext <= half) {
    const next = DAY_PHASES[(i + 1) % n]!;
    return { from: phase, to: next, t: smooth(0.5 - toNext / (2 * half)) };
  }
  return { from: phase, to: phase, t: 0 };
}

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

/** Channel-wise blend of two 0xRRGGBB colours. */
export function mixColor(a: number, b: number, t: number): number {
  const ch = (c: number, shift: number) => (c >> shift) & 0xff;
  const mix = (shift: number) => Math.round(lerp(ch(a, shift), ch(b, shift), t)) << shift;
  return mix(16) | mix(8) | mix(0);
}

export function mixLook(a: PhaseLook, b: PhaseLook, t: number): PhaseLook {
  return {
    skyTop: mixColor(a.skyTop, b.skyTop, t),
    skyBottom: mixColor(a.skyBottom, b.skyBottom, t),
    ambient: mixColor(a.ambient, b.ambient, t),
    shadow: lerp(a.shadow, b.shadow, t),
    stars: lerp(a.stars, b.stars, t),
    moon: lerp(a.moon, b.moon, t),
    lights: lerp(a.lights, b.lights, t),
  };
}

export const sameLook = (a: PhaseLook, b: PhaseLook) =>
  (Object.keys(a) as (keyof PhaseLook)[]).every((k) => Math.abs(a[k] - b[k]) < 1e-3);

export interface DayScene {
  phase: DayPhase;
  blend: DayBlend;
  look: PhaseLook;
}

/**
 * What the farm shows at `minute` (local). Disabled → always `day`; a preview phase (admin / dev
 * only, never saved) shows that phase's pure look whatever the clock says.
 */
export function dayScene(
  minute: number,
  s: DayNightSettings,
  preview: DayPhase | null = null,
): DayScene {
  const fixed = preview ?? (s.enabled ? null : 'day');
  if (fixed) {
    return { phase: fixed, blend: { from: fixed, to: fixed, t: 0 }, look: PHASE_LOOKS[fixed] };
  }
  const blend = blendAt(minute, s);
  const look = mixLook(PHASE_LOOKS[blend.from], PHASE_LOOKS[blend.to], blend.t);
  return { phase: phaseAt(minute, s), blend, look };
}

/** Local minute of the day of a `Date`-free split (hours, minutes) — callers read their clock. */
export const minuteOf = (hours: number, minutes: number) => wrap(hours * 60 + minutes);
