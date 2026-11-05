// The Animation & VFX library (decision 049): every reference record is valid and points at things the game has.
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { actSchema } from '../../content/schemas/adventure/battleScript';
import { refProblems, type GameIds } from '../../scripts/anim-review/lib/library';

const ROOT = join(__dirname, '../..');
const REFS = join(ROOT, 'docs/animation/library/refs');
const json = (p: string) => JSON.parse(readFileSync(join(ROOT, p), 'utf8')) as Record<string, unknown>;
const fx = json('content/adventure/battle_fx.json') as { statuses: object; actions: object; elementReactions: object };

const ids: GameIds = {
  acts: new Set(actSchema.options.map((o) => o.shape.do.value)),
  skills: new Set((json('content/adventure/skills.json').skills as { id: string }[]).map((s) => s.id)),
  statuses: new Set(Object.keys(fx.statuses)),
  actions: new Set(Object.keys(fx.actions)),
  reactions: new Set(Object.keys(fx.elementReactions)),
};

const good = {
  id: 'REF-WATER-TEST-001',
  name: 'test',
  group: 'elemental/projectile',
  element: 'WATER',
  motifs: ['bubble'],
  tier: 2,
  phases: [
    { phase: 'preparation', ms: [0, 300], desc: 'wind-up', acts: ['pose cast', 'move cast_coil'] },
    { phase: 'impact', ms: [600, 700], desc: 'hit', acts: ['stop medium', 'strip fx_splash'] },
  ],
  layers: ['L1-body', 'L3-particles', 'L4-feedback'],
  particles: 'drops',
  secondary: [],
  purpose: 'test',
  complexity: 'S',
  sources: [{ kind: 'GAME', title: 'capture' }],
  sobiTranslation: 'warm outline',
  implementedBy: ['skill_nh_bubble', 'status:wet'],
  status: 'draft',
};

describe('animation reference library', () => {
  it('accepts a valid record and rejects broken ones', () => {
    expect(refProblems(good, 'REF-WATER-TEST-001', ids)).toEqual([]);
    expect(refProblems({ ...good, implementedBy: ['skill_nope'] }, 'REF-WATER-TEST-001', ids)).toHaveLength(1);
    expect(refProblems({ ...good, phases: [{ ...good.phases[0], acts: ['explode'] }, good.phases[1]] }, 'REF-WATER-TEST-001', ids)[0]).toMatch(/not an act/);
    expect(refProblems({ ...good, sources: [{ kind: 'F', title: 'pack' }] }, 'REF-WATER-TEST-001', ids)[0]).toMatch(/licence/);
    expect(refProblems({ ...good, sources: [{ kind: 'R', title: 'x', url: 'asset/reference/x.png' }] }, 'REF-WATER-TEST-001', ids)[0]).toMatch(/R source/);
    expect(refProblems({ ...good, status: 'implemented' }, 'REF-WATER-TEST-001', ids)[0]).toMatch(/evidence/);
    expect(refProblems(good, 'REF-OTHER-001', ids)[0]).toMatch(/file name/);
  });

  it('every record in docs/animation/library/refs is valid', () => {
    const files = readdirSync(REFS).filter((f) => f.endsWith('.json'));
    expect(files.length).toBeGreaterThan(0);
    const problems = files.flatMap((f) => refProblems(JSON.parse(readFileSync(join(REFS, f), 'utf8')), f.replace(/\.json$/, ''), ids));
    expect(problems).toEqual([]);
  });
});
