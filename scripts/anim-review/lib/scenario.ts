// The animation scenario of one skill / status / action / reaction (docs/animation/library/scenarios/<kind>/<id>.md, decision 049):
// a Markdown storyboard with a JSON header (```json scenario) that tests can check — the unit exists, the assets it says the game has
// are in the manifest, the new ones are not yet, the references and bibles it builds on exist, the required sections are written.
// Pure: tests/scripts/animScenario.test.ts reads the files and the content and runs these.
import { z } from 'zod';

export const SCENARIO_KINDS = ['skill', 'status', 'action', 'reaction'] as const;
/** Folder of each kind under docs/animation/library/scenarios/. */
export const KIND_DIR: Readonly<Record<(typeof SCENARIO_KINDS)[number], string>> = { skill: 'skills', status: 'statuses', action: 'actions', reaction: 'reactions' };
/** draft: written · approved: owner OK'd the storyboard · built: in battle_fx.json · verified: capture + review passed. */
export const SCENARIO_STATES = ['draft', 'approved', 'built', 'verified'] as const;
/** The sections every scenario has, in this order (their `## n.` headings). */
export const SECTIONS = ['Ý tưởng', 'Hiện tại', 'Kịch bản theo nhịp', 'Bóc lớp', 'Asset', 'Các bước dựng', 'Nghiệm thu'] as const;

const asset = z.strictObject({
  id: z.string().regex(/^(fx|fxp|fxs|st)_[a-z0-9_]+$/),
  /** have: in the manifest · new: to make · edit: in the manifest, to redo. */
  state: z.enum(['have', 'new', 'edit']),
  layer: z.enum(['L0', 'L1', 'L2', 'L3', 'L4']),
  /** For new / edit: frames, size, what each frame shows (the Artist's brief). */
  spec: z.string().optional(),
});

export const scenarioHeader = z
  .strictObject({
    id: z.string().min(1),
    kind: z.enum(SCENARIO_KINDS),
    name: z.string().min(1),
    element: z.string().min(1),
    tier: z.number().int().min(0).max(4),
    durationMs: z.number().int().positive(),
    status: z.enum(SCENARIO_STATES),
    refs: z.array(z.string()),
    bibles: z.array(z.string().regex(/^(elements|motifs|actions)\/[A-Za-z-]+$/)).min(1),
    assets: z.array(asset),
    /** Engine abilities the scenario needs that the game does not have yet (named, decided in a decision). */
    engine: z.array(z.string().regex(/^[a-z_]+$/)),
  })
  .refine((h) => h.assets.every((a) => a.state === 'have' || !!a.spec), { message: 'a new / edit asset needs a spec' });
export type ScenarioHeader = z.output<typeof scenarioHeader>;

export interface ScenarioWorld {
  units: Readonly<Record<(typeof SCENARIO_KINDS)[number], ReadonlySet<string>>>;
  manifest: ReadonlySet<string>;
  refs: ReadonlySet<string>;
  bibles: ReadonlySet<string>;
}

/** The JSON header of a scenario file, or null when it has none. */
export function headerOf(md: string): unknown {
  const m = /```json scenario\n([\s\S]*?)\n```/.exec(md);
  return m ? (JSON.parse(m[1]!) as unknown) : null;
}

/** Problems of one scenario (empty = fine). `file` is its file name without `.md`, `dir` its folder (skills, statuses…). */
export function scenarioProblems(md: string, file: string, dir: string, w: ScenarioWorld): string[] {
  let raw: unknown;
  try {
    raw = headerOf(md);
  } catch (e) {
    return [`${file}: header is not JSON (${(e as Error).message})`];
  }
  if (raw === null) return [`${file}: no \`\`\`json scenario header`];
  const parsed = scenarioHeader.safeParse(raw);
  if (!parsed.success) return parsed.error.issues.map((i) => `${file}: ${i.path.join('.')} ${i.message}`);
  const h = parsed.data;
  const out: string[] = [];
  if (h.id !== file) out.push(`${file}: id ${h.id} differs from the file name`);
  if (KIND_DIR[h.kind] !== dir) out.push(`${file}: a ${h.kind} scenario belongs in scenarios/${KIND_DIR[h.kind]}/`);
  if (!w.units[h.kind].has(h.id)) out.push(`${file}: ${h.kind} ${h.id} does not exist in the game`);
  for (const a of h.assets) {
    if (a.state === 'new' && w.manifest.has(a.id)) out.push(`${file}: asset ${a.id} is marked new but is already in the manifest`);
    if (a.state !== 'new' && !w.manifest.has(a.id)) out.push(`${file}: asset ${a.id} is marked ${a.state} but is not in the manifest`);
  }
  for (const r of h.refs) if (!w.refs.has(r)) out.push(`${file}: reference ${r} does not exist`);
  for (const b of h.bibles) if (!w.bibles.has(b)) out.push(`${file}: bible ${b} does not exist`);
  let at = 0;
  SECTIONS.forEach((s, i) => {
    const pos = md.indexOf(`## ${i + 1}. ${s}`);
    if (pos < 0) out.push(`${file}: missing section "## ${i + 1}. ${s}"`);
    else if (pos < at) out.push(`${file}: section "${s}" out of order`);
    else at = pos;
  });
  return out;
}
