// Day / night settings (DN) as the source text the game imports: the block between the
// `// <admin:dayNight>` markers of src/core/config/dayNight.ts, formatted by hand (fixed key order).
import { DAY_PHASES, type DayNightSettings } from '../../src/core/config/dayNight';

const OPEN = '// <admin:dayNight>';
const CLOSE = '// </admin:dayNight>';

export function dayNightBlock(s: DayNightSettings): string {
  const phases = DAY_PHASES.map((p) => `    ${p}: '${s.phases[p]}',`).join('\n');
  return [
    OPEN,
    'export const DAY_NIGHT: DayNightSettings = {',
    `  enabled: ${s.enabled},`,
    '  phases: {',
    phases,
    '  },',
    `  blendMinutes: ${s.blendMinutes},`,
    `  transitionMs: ${s.transitionMs},`,
    '};',
    CLOSE,
  ].join('\n');
}

/** `source` with its admin block replaced; throws when the markers are missing. */
export function replaceDayNightBlock(source: string, s: DayNightSettings): string {
  const start = source.indexOf(OPEN);
  const end = source.indexOf(CLOSE);
  if (start < 0 || end < start) throw new Error('dayNight.ts: thiếu marker <admin:dayNight>');
  return source.slice(0, start) + dayNightBlock(s) + source.slice(end + CLOSE.length);
}
