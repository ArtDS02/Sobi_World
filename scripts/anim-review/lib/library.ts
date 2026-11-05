// The schema of a reference record of the Animation & VFX library (docs/animation/library/refs/<REF-ID>.json, decision 049) and the
// checks that tie a record to the game: act names the engine knows, skills / statuses / actions that exist, a licence kind on every
// source. Pure: tests/scripts/animLibrary.test.ts reads the files and the content and runs these.
import { z } from 'zod';

export const ELEMENTS = ['METAL', 'NATURE', 'WATER', 'FIRE', 'EARTH', 'LIGHTNING', 'DARK', 'LIGHT', 'VOID', 'NONE'] as const;
export const PHASES = ['preparation', 'startup', 'execution', 'travel', 'impact', 'aftermath', 'recovery'] as const;
export const LAYERS = ['L0-screen', 'L1-body', 'L2-core', 'L3-particles', 'L4-feedback'] as const;
/** R: study only (third-party, no licence) · F: free to use (licence named) · L: needs permission · GAME: frames of Sobi itself. */
export const SOURCE_KINDS = ['R', 'F', 'L', 'GAME'] as const;

const source = z
  .strictObject({
    kind: z.enum(SOURCE_KINDS),
    title: z.string().min(1),
    url: z.string().optional(),
    license: z.string().optional(),
    note: z.string().optional(),
  })
  .refine((s) => s.kind !== 'F' || !!s.license, { message: 'an F source names its licence' })
  // A study-only source never points at a picture inside the repo (decision 048: no third-party art in the project).
  .refine((s) => s.kind !== 'R' || !/^(asset|art_inbox|public|docs)\//.test(s.url ?? ''), { message: 'an R source cannot point at a file in the repo' });

const phase = z.strictObject({
  phase: z.enum(PHASES),
  ms: z.tuple([z.number().int().min(0), z.number().int().min(0)]).refine(([a, b]) => b > a, { message: 'ms [from, to] must grow' }),
  desc: z.string().min(1),
  acts: z.array(z.string().min(1)).min(1),
});

export const refSchema = z.strictObject({
  id: z.string().regex(/^REF-[A-Z0-9]+(-[A-Z0-9]+)+-\d{3}$/),
  name: z.string().min(1),
  group: z.string().regex(/^[a-z]+\/[a-z-]+$/),
  element: z.enum(ELEMENTS),
  motifs: z.array(z.string().regex(/^[a-z]+$/)),
  tier: z.number().int().min(0).max(4),
  phases: z.array(phase).min(2),
  layers: z.array(z.enum(LAYERS)).min(1),
  particles: z.string().min(1),
  secondary: z.array(z.string().min(1)),
  purpose: z.string().min(1),
  complexity: z.enum(['S', 'M', 'L', 'XL']),
  sources: z.array(source).min(1),
  sobiTranslation: z.string().min(1),
  /** skill id, or `status:<id>`, `action:<id>`, `reaction:<id>`. */
  implementedBy: z.array(z.string().regex(/^(skill_[a-z0-9_]+|(status|action|reaction):[a-zA-Z0-9_]+)$/)),
  status: z.enum(['draft', 'approved', 'implemented']),
  /** Capture run ids that show the reference implemented (required for `implemented`). */
  evidence: z.array(z.string()).optional(),
});
export type Ref = z.output<typeof refSchema>;

export interface GameIds {
  acts: ReadonlySet<string>;
  skills: ReadonlySet<string>;
  statuses: ReadonlySet<string>;
  actions: ReadonlySet<string>;
  reactions: ReadonlySet<string>;
}

/** Problems of one record against the game (empty = fine). `file` is the record's file name without `.json`. */
export function refProblems(raw: unknown, file: string, ids: GameIds): string[] {
  const parsed = refSchema.safeParse(raw);
  if (!parsed.success) return parsed.error.issues.map((i) => `${file}: ${i.path.join('.')} ${i.message}`);
  const r = parsed.data;
  const out: string[] = [];
  if (r.id !== file) out.push(`${file}: id ${r.id} differs from the file name`);
  for (let i = 1; i < r.phases.length; i += 1)
    if (r.phases[i]!.ms[0] < r.phases[i - 1]!.ms[0]) out.push(`${file}: phases must be in time order (${r.phases[i]!.phase})`);
  for (const p of r.phases)
    for (const a of p.acts) {
      const name = a.split(' ')[0]!;
      if (!ids.acts.has(name)) out.push(`${file}: act "${name}" (${p.phase}) is not an act of the engine`);
    }
  for (const t of r.implementedBy) {
    const [kind, id] = t.includes(':') ? (t.split(':') as [string, string]) : ['skill', t];
    const set = kind === 'skill' ? ids.skills : kind === 'status' ? ids.statuses : kind === 'action' ? ids.actions : ids.reactions;
    if (!set.has(id)) out.push(`${file}: implementedBy ${t} does not exist`);
  }
  if (r.status === 'implemented' && (r.evidence ?? []).length === 0) out.push(`${file}: an implemented reference needs a capture run in evidence`);
  return out;
}
