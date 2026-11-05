// A data audit of the battle animation scripts (content/adventure/battle_fx.json): what a script says it draws, read without playing it.
// It finds the defects a count of acts hides: a skill whose main picture is a still image moved around (a `prop` tweened in place of
// a shape that changes), an impact weaker or stronger than the skill's power, missing phases, a time outside the budget, a flipbook
// shared by many skills. Pure (no file access): scripts/anim-review/audit.ts feeds it the content and writes the report.
// The thresholds are proposals of the reference research (docs/animation-review/audit/README.md), hints for the reviewer, never a score.

export interface AuditAct {
  do: string;
  at?: number;
  dur?: number;
  who?: string;
  img?: string;
  size?: number;
  path?: string;
  tier?: string;
  amount?: number;
  alpha?: number;
  zoom?: number;
  stagger?: number;
  [k: string]: unknown;
}
export interface AuditSkill {
  id: string;
  type: string;
  category: string;
  element: string | null;
  target: string | null;
  power: number;
}
export interface AuditInput {
  skills: AuditSkill[];
  scripts: Record<string, AuditAct[] | undefined>;
  /** Frames of each flipbook picture (`fx_…` with `frames` in the asset manifest); a picture not listed is a still. */
  frames: Record<string, number>;
}

/** Power tiers T0..T4 (research §5.4): what a skill of this power should feel like. */
export type Tier = 0 | 1 | 2 | 3 | 4;

export function expectedTier(s: AuditSkill): Tier {
  if (s.type === 'ultimate') return 4;
  if (s.power <= 0) return 0;
  if (s.power < 0.9) return 1;
  if (s.power < 1.4) return 2;
  return 3;
}

const STOP_TIER: Readonly<Record<string, Tier>> = { light: 1, medium: 2, heavy: 3, ultimate: 4 };

/** The tier the script's own impact acts give (the strongest of hit-stop, shake, punch, flash). */
export function actualTier(acts: readonly AuditAct[]): Tier {
  let t = 0;
  for (const a of acts) {
    if (a.do === 'stop') t = Math.max(t, STOP_TIER[a.tier ?? 'light'] ?? 1);
    if (a.do === 'shake') {
      const amp = a.amount ?? 0;
      t = Math.max(t, amp >= 7 ? 4 : amp >= 5 ? 3 : amp >= 3 ? 2 : amp > 0 ? 1 : 0);
    }
    if (a.do === 'punch') t = Math.max(t, (a.zoom ?? 1) >= 1.04 ? 3 : 2);
    if (a.do === 'flash') t = Math.max(t, (a.alpha ?? 1) >= 0.4 ? 3 : 1);
    if (a.do === 'slowmo') t = Math.max(t, 3);
  }
  return t as Tier;
}

/** Acts that draw a shape (the candidates for the skill's main picture). */
const SHAPE_ACTS = new Set(['prop', 'strip', 'ribbon', 'beam', 'cone', 'tether']);
const IMPACT_ACTS = new Set(['stop', 'shake', 'punch', 'flash', 'split', 'slowmo']);
/** The five layers of research §5.2. */
const LAYER_OF: Readonly<Record<string, string>> = {
  tint: 'L0-screen', vignette: 'L0-screen', letterbox: 'L0-screen', cutin: 'L0-screen',
  prop: 'L1-body', strip: 'L1-body', ribbon: 'L1-body', beam: 'L1-body', cone: 'L1-body', tether: 'L1-body',
  glow: 'L2-core', trail: 'L2-core', marker: 'L2-core',
  burst: 'L3-particles', decal: 'L3-particles',
  stop: 'L4-feedback', shake: 'L4-feedback', punch: 'L4-feedback', flash: 'L4-feedback', split: 'L4-feedback', slowmo: 'L4-feedback',
};

/** How alive a shape act is on its own: 1 changes shape every frame, 0 is a still picture only moved / scaled / turned. */
export function liveness(a: AuditAct, frames: Readonly<Record<string, number>>): number {
  if (a.do === 'ribbon' || a.do === 'beam' || a.do === 'cone' || a.do === 'tether') return 1;
  const n = a.img ? (frames[a.img] ?? 1) : a.do === 'strip' ? 4 : 1;
  if (n <= 1) return 0;
  // A short flipbook changes shape but steps visibly: 4 frames count half, 8 or more count whole.
  return Math.min(1, n / 8);
}

/** The screen size of a shape act: a band (ribbon) or a line counts its thickness, a picture its size. */
function sizeOf(a: AuditAct): number {
  if (a.do === 'ribbon') return typeof a.thickness === 'number' ? a.thickness : 0.1;
  if (a.do === 'beam' || a.do === 'tether' || a.do === 'cone') return 0.3;
  return typeof a.size === 'number' ? a.size : 0.6;
}
/** The screen weight of a shape act: its size times how long it shows (a field-wide act counts double). */
const weightOf = (a: AuditAct) => sizeOf(a) * (a.dur ?? (a.do === 'strip' ? 330 : 400)) * (a.who === 'field' ? 2 : 1);
/** Acts of the same picture are one object seen several times (a bubble that pops, flies, then hovers). */
const keyOf = (a: AuditAct) => a.img ?? a.do;

/** Time budget per kind of skill at speed x1 (research §5.3), ms. */
export function budgetOf(s: AuditSkill): [number, number] {
  if (s.type === 'ultimate') return [2500, 4500];
  if (s.power <= 0) return [700, 1400];
  return expectedTier(s) >= 3 ? [1300, 2000] : [900, 1500];
}

export interface SkillAudit {
  id: string;
  type: string;
  element: string;
  power: number;
  acts: number;
  durationMs: number;
  tier: { expected: Tier; actual: Tier };
  /** Share (0..1, by screen weight) of the drawn shapes that are still pictures moved around. */
  staticShare: number;
  /** The heaviest shape act: what the player remembers. */
  hero: { do: string; img: string | null; liveness: number } | null;
  layers: string[];
  phases: { preparation: boolean; impact: boolean; aftermath: boolean };
  flags: string[];
  priority: number;
}

const FLAG_WEIGHT: Readonly<Record<string, number>> = {
  STATIC_HERO: 3, STATIC_SHARE: 2, IMPACT_UNDER_TIER: 3, IMPACT_OVER_TIER: 1, NO_PREPARATION: 2, NO_AFTERMATH: 1, FEW_LAYERS: 2,
  DURATION_OVER: 1, DURATION_UNDER: 1, SHARED_FLIPBOOK_HERO: 1, NO_SCRIPT: 3,
};
/** How often a player sees a skill of this type (class skills are on every pig). */
const SEEN: Readonly<Record<string, number>> = { class: 3, unique: 2, enemy: 2, ultimate: 1 };

export function auditSkill(s: AuditSkill, acts: readonly AuditAct[] | undefined, frames: Readonly<Record<string, number>>, sharedImgs: ReadonlySet<string>): SkillAudit {
  const list = acts ?? [];
  const flags: string[] = [];
  if (list.length === 0) flags.push('NO_SCRIPT');
  // An act with no length (a burst, a sound) still shows for a while: count 300 ms for the visible ones.
  const end = (a: AuditAct) => (a.at ?? 0) + (a.dur ?? (a.do === 'sound' || a.do === 'pose' ? 0 : 300));
  const durationMs = list.reduce((m, a) => Math.max(m, end(a)), 0);
  const shapes = list.filter((a) => SHAPE_ACTS.has(a.do));
  const total = shapes.reduce((m, a) => m + weightOf(a), 0);
  const still = shapes.filter((a) => liveness(a, frames) === 0).reduce((m, a) => m + weightOf(a), 0);
  const staticShare = total > 0 ? still / total : 0;
  const firstImpact = list.filter((a) => IMPACT_ACTS.has(a.do)).reduce((m, a) => Math.min(m, a.at ?? 0), Infinity);
  // The main picture is what delivers the skill: the heaviest object shown before the first impact (all of them when there is none).
  const delivering = shapes.filter((a) => (a.at ?? 0) < firstImpact);
  const groups = new Map<string, { act: AuditAct; w: number }>();
  for (const a of delivering.length > 0 ? delivering : shapes) {
    const g = groups.get(keyOf(a));
    groups.set(keyOf(a), { act: g?.act ?? a, w: (g?.w ?? 0) + weightOf(a) });
  }
  const heroAct = [...groups.values()].reduce<{ act: AuditAct; w: number } | null>((best, g) => (!best || g.w > best.w ? g : best), null)?.act ?? null;
  const hero = heroAct ? { do: heroAct.do, img: heroAct.img ?? null, liveness: liveness(heroAct, frames) } : null;
  const tier = { expected: expectedTier(s), actual: actualTier(list) };
  const layers = [...new Set(list.map((a) => LAYER_OF[a.do]).filter((x): x is string => !!x))].sort();
  const phases = {
    preparation: list.some((a) => (a.do === 'pose' || a.do === 'move' || a.do === 'glow') && (a.at ?? 0) <= (Number.isFinite(firstImpact) ? firstImpact : durationMs) && a.who !== 'targets' && a.who !== 'target'),
    impact: Number.isFinite(firstImpact),
    aftermath:
      Number.isFinite(firstImpact) &&
      list.some((a) => (a.do === 'decal' && (a.at ?? 0) >= firstImpact) || (['burst', 'decal', 'ribbon', 'prop', 'strip', 'tint'].includes(a.do) && (a.at ?? 0) >= firstImpact + 150)),
  };
  if (hero && hero.liveness === 0) flags.push('STATIC_HERO');
  if (staticShare > 0.3) flags.push('STATIC_SHARE');
  if (list.length > 0 && tier.expected >= 1 && tier.actual < tier.expected - 1) flags.push('IMPACT_UNDER_TIER');
  if (tier.actual > tier.expected + 1) flags.push('IMPACT_OVER_TIER');
  if (list.length > 0 && !phases.preparation) flags.push('NO_PREPARATION');
  if (tier.expected >= 1 && list.length > 0 && !phases.aftermath) flags.push('NO_AFTERMATH');
  const minLayers = s.type === 'ultimate' ? 5 : tier.expected >= 3 ? 4 : tier.expected >= 1 ? 3 : 2;
  if (list.length > 0 && layers.length < minLayers) flags.push('FEW_LAYERS');
  const [lo, hi] = budgetOf(s);
  if (list.length > 0 && durationMs > hi) flags.push('DURATION_OVER');
  if (list.length > 0 && durationMs < lo) flags.push('DURATION_UNDER');
  if (hero?.img && sharedImgs.has(hero.img)) flags.push('SHARED_FLIPBOOK_HERO');
  const gap = flags.reduce((m, f) => m + (FLAG_WEIGHT[f] ?? 1), 0);
  return {
    id: s.id,
    type: s.type,
    // SELF: a class skill takes the element of its user; no element at all is a support skill.
    element: s.element ?? 'SUPPORT',
    power: s.power,
    acts: list.length,
    durationMs,
    tier,
    staticShare: Number(staticShare.toFixed(2)),
    hero,
    layers,
    phases,
    flags,
    priority: gap * (SEEN[s.type] ?? 1),
  };
}

export interface AuditReport {
  skills: SkillAudit[];
  /** Flipbook picture → skills whose script uses it. */
  flipbookUse: Record<string, string[]>;
  byElement: Record<string, { skills: number; meanPriority: number; staticHero: number; impactUnder: number; flags: Record<string, number> }>;
}

/** A flipbook used by more skills than this is "shared": as a main picture it makes skills look alike. */
export const SHARED_LIMIT = 5;

export function audit(input: AuditInput): AuditReport {
  const flipbookUse: Record<string, string[]> = {};
  for (const s of input.skills)
    for (const a of input.scripts[s.id] ?? []) if (a.img && (input.frames[a.img] ?? 1) > 1) flipbookUse[a.img] = [...new Set([...(flipbookUse[a.img] ?? []), s.id])];
  const shared = new Set(Object.entries(flipbookUse).filter(([, v]) => v.length > SHARED_LIMIT).map(([k]) => k));
  const skills = input.skills.map((s) => auditSkill(s, input.scripts[s.id], input.frames, shared)).sort((a, b) => b.priority - a.priority || a.id.localeCompare(b.id));
  const byElement: AuditReport['byElement'] = {};
  for (const r of skills) {
    const e = (byElement[r.element] ??= { skills: 0, meanPriority: 0, staticHero: 0, impactUnder: 0, flags: {} });
    e.skills += 1;
    e.meanPriority += r.priority;
    if (r.flags.includes('STATIC_HERO')) e.staticHero += 1;
    if (r.flags.includes('IMPACT_UNDER_TIER')) e.impactUnder += 1;
    for (const f of r.flags) e.flags[f] = (e.flags[f] ?? 0) + 1;
  }
  for (const e of Object.values(byElement)) e.meanPriority = Number((e.meanPriority / e.skills).toFixed(1));
  return { skills, flipbookUse, byElement };
}
