// Numbers measured from a played step and from its frames, plus the flags of rubric §10.3
// (docs/animation-review/ANIMATION_QUALITY_RUBRIC.md). Flags are hints for the reviewer, never a score.
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import type { LabInfo } from './session';
import { ROOT } from './stamp';

type Cue = LabInfo['cues'][number];
type Act = { do: string; at: number; dur?: number; tier?: string; amount?: number; on?: boolean; alpha?: number; ref?: string; img?: string };

/** The hit-stop lengths of the tiers, read from the game's own table (never copied here). */
export function hitStopTable(): Record<string, number> {
  const src = readFileSync(join(ROOT, 'src/areas/adventure/scene/battle/screenFx.ts'), 'utf8');
  const m = /HIT_STOP_MS[^=]*=\s*\{([^}]*)\}/.exec(src);
  if (!m) throw new Error('HIT_STOP_MS not found in screenFx.ts (the harness reads the hit-stop tiers from it)');
  const out: Record<string, number> = {};
  for (const [, k, v] of m[1]!.matchAll(/(\w+):\s*(\d+)/g)) out[k!] = Number(v);
  return out;
}

const actOf = (c: Cue): Act | null => {
  if (c.kind !== 'act') return null;
  const cue = c.cue as { act?: Act } | undefined;
  return cue?.act ? { ...cue.act, at: c.at } : null;
};

const VISUAL_ACTS = new Set(['burst', 'strip', 'prop', 'beam', 'ribbon', 'tether', 'cone', 'decal', 'marker', 'trail', 'tint', 'vignette', 'flash', 'cutin', 'glow']);

export interface CaseMetrics {
  durationMs: number;
  beats: { start: number; cast: number; release: number; impact: number; end: number; circle: boolean } | null;
  anticipationMs: number | null;
  circleMs: number | null;
  cues: string[];
  hitStopMs: number | null;
  shake: { amp: number; ms: number } | null;
  layerClasses: string[];
  ultIntro: boolean | null;
  ultOutro: boolean | null;
  skippable: null;
  flashesPerSec: number;
  scriptSig: string;
  statusMarks: { id: string; at: number }[];
  changedFrames: number;
  frameCount: number;
  maxChangeVsStart: number;
  consoleErrors: string[];
  missingAssets: string[];
  overflowFrames: null;
}

export function measure(info: LabInfo, group: string, px: { changedFrames: number; frameCount: number; maxChangeVsStart: number }, errors: string[], missing: string[]): CaseMetrics {
  const stops = hitStopTable();
  const b = info.beats[0] ?? null;
  const acts = info.cues.map(actOf).filter((a): a is Act => !!a);
  const stopMs = acts.filter((a) => a.do === 'stop').map((a) => stops[a.tier ?? 'light'] ?? 0);
  const shakes = acts.filter((a) => a.do === 'shake');
  const layers = new Set<string>();
  for (const c of info.cues) {
    if (['circle', 'charge', 'shot', 'land', 'fx', 'afterimage', 'teleport'].includes(c.kind)) layers.add(c.kind);
    const a = actOf(c);
    if (a && VISUAL_ACTS.has(a.do)) layers.add(a.do);
  }
  const dims = info.cues.filter((c) => c.kind === 'dim') as (Cue & { to: number })[];
  const boxes = acts.filter((a) => a.do === 'letterbox');
  const intro = group === 'ultimate' ? dims.some((d) => d.to > 0) || boxes.some((a) => a.on) || acts.some((a) => a.do === 'cutin') : null;
  const outro = group === 'ultimate' ? (dims.length > 0 ? dims[dims.length - 1]!.to === 0 : false) || boxes.some((a) => a.on === false) : null;
  const flashes = acts.filter((a) => a.do === 'flash' && (a.alpha ?? 1) >= 0.5).map((a) => a.at);
  const flashesPerSec = flashes.reduce((m, t) => Math.max(m, flashes.filter((u) => u >= t && u < t + 1000).length), 0);
  const sig = createHash('sha1').update(JSON.stringify(info.cues.map((c) => [c.kind, actOf(c)?.do ?? '', Math.round(c.at / 50)]))).digest('hex').slice(0, 10);
  return {
    durationMs: Math.round(info.total),
    beats: b ? { start: b.start, cast: b.cast, release: b.release, impact: b.impact, end: b.end, circle: b.circle } : null,
    // The wind-up proper: from the end of the magic circle (`cast`, = `start` when there is none) to the release (rubric §5 lists it apart from the circle).
    anticipationMs: b ? b.release - b.cast : null,
    circleMs: b && b.circle ? b.cast - b.start : null,
    cues: [...new Set(info.cues.map((c) => (c.kind === 'act' ? `act:${actOf(c)?.do ?? '?'}` : c.kind)))],
    hitStopMs: stopMs.length > 0 ? Math.max(...stopMs) : null,
    shake: shakes.length > 0 ? { amp: Math.max(...shakes.map((a) => a.amount ?? 0)), ms: Math.max(...shakes.map((a) => a.dur ?? 0)) } : null,
    layerClasses: [...layers].sort(),
    ultIntro: intro,
    ultOutro: outro,
    skippable: null,
    flashesPerSec,
    scriptSig: sig,
    statusMarks: info.marks.filter((m) => m.kind === 'status').map((m) => ({ id: m.id, at: Math.round(m.at) })),
    ...px,
    consoleErrors: errors,
    missingAssets: missing,
    overflowFrames: null,
  };
}

const range = (v: number | null, lo: number, hi: number) => v !== null && (v < lo || v > hi);

/** Rubric §10.3 flags for one case (hints only). `others` maps scriptSig → caseIds of the same group, for DUPLICATE_SCRIPT. */
export function flagsOf(m: CaseMetrics, group: string, dup: string[]): string[] {
  const f: string[] = [];
  const ult = group === 'ultimate';
  // A status case plays the plain attack that carries it: the skill timing ranges say nothing about the status.
  if (group === 'status') return [...(m.maxChangeVsStart < 0.005 ? ['NO_VISIBLE_CHANGE'] : []), ...(m.consoleErrors.length > 0 ? ['CONSOLE_ERRORS'] : []), ...(m.missingAssets.length > 0 ? ['MISSING_ASSETS'] : []), ...(dup.length > 0 ? ['DUPLICATE_SCRIPT'] : [])];
  if (m.hitStopMs !== null && (ult ? range(m.hitStopMs, 150, 300) : range(m.hitStopMs, 50, 100))) f.push('HITSTOP_RANGE');
  if (m.hitStopMs === null && ult) f.push('HITSTOP_RANGE');
  if (range(m.anticipationMs, 150, 300)) f.push('ANTICIPATION_RANGE');
  if (m.circleMs !== null && range(m.circleMs, 300, 600)) f.push('CIRCLE_RANGE');
  if (['skill', 'ultimate'].includes(group) && range(m.durationMs, ult ? 2500 : 800, ult ? 5000 : 1800)) f.push('DURATION_RANGE');
  if (ult && m.layerClasses.length < 3) f.push('ULT_LAYERS');
  if (ult && (!m.ultIntro || !m.ultOutro)) f.push('ULT_INTRO_OUTRO');
  if (m.maxChangeVsStart < 0.005) f.push('NO_VISIBLE_CHANGE');
  if (m.flashesPerSec > 3) f.push('FLASH_RATE');
  if (m.consoleErrors.length > 0) f.push('CONSOLE_ERRORS');
  if (m.missingAssets.length > 0) f.push('MISSING_ASSETS');
  if (dup.length > 0) f.push('DUPLICATE_SCRIPT');
  return f;
}
