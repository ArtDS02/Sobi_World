// Animation scenarios (docs/animation/library/scenarios, decision 049): every file has a valid header, points at things the game has,
// and is written in the agreed sections.
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { KIND_DIR, scenarioProblems, type ScenarioWorld } from '../../scripts/anim-review/lib/scenario';

const ROOT = join(__dirname, '../..');
const LIB = join(ROOT, 'docs/animation/library');
const json = (p: string) => JSON.parse(readFileSync(join(ROOT, p), 'utf8')) as Record<string, unknown>;
const fx = json('content/adventure/battle_fx.json') as { statuses: object; actions: object; elementReactions: object };
const manifest = json('public/assets/manifest/assets.json');
const filesIn = (dir: string, ext: string) => (existsSync(dir) ? readdirSync(dir).filter((f) => f.endsWith(ext)) : []);

const world: ScenarioWorld = {
  units: {
    skill: new Set((json('content/adventure/skills.json').skills as { id: string }[]).map((s) => s.id)),
    status: new Set(Object.keys(fx.statuses)),
    action: new Set(Object.keys(fx.actions)),
    reaction: new Set(Object.keys(fx.elementReactions)),
  },
  manifest: new Set(Object.values(manifest).flatMap((v) => (Array.isArray(v) ? (v as { id?: string }[]).map((a) => a.id ?? '') : []))),
  refs: new Set(filesIn(join(LIB, 'refs'), '.json').map((f) => f.replace(/\.json$/, ''))),
  bibles: new Set(['elements', 'motifs', 'actions'].flatMap((d) => filesIn(join(LIB, 'bibles', d), '.md').map((f) => `${d}/${f.replace(/\.md$/, '')}`))),
};

const body = ['Ý tưởng', 'Hiện tại', 'Kịch bản theo nhịp', 'Bóc lớp', 'Asset', 'Các bước dựng', 'Nghiệm thu'].map((s, i) => `## ${i + 1}. ${s}\nx\n`).join('');
const doc = (h: object) => `# t\n\n\`\`\`json scenario\n${JSON.stringify(h)}\n\`\`\`\n\n${body}`;
const good = {
  id: 'skill_nh_bubble', kind: 'skill', name: 'Bong Bóng Nước', element: 'WATER', tier: 2, durationMs: 1150, status: 'draft',
  refs: ['REF-WATER-BUBBLE-001'], bibles: ['elements/WATER', 'actions/projectile'],
  assets: [{ id: 'fxp_bubble_big', state: 'have', layer: 'L1' }, { id: 'fx_test_new_thing', state: 'new', layer: 'L1', spec: '6 frames' }],
  engine: [],
};

describe('animation scenarios', () => {
  it('accepts a valid scenario and rejects broken ones', () => {
    expect(scenarioProblems(doc(good), 'skill_nh_bubble', 'skills', world)).toEqual([]);
    expect(scenarioProblems(doc({ ...good, id: 'skill_nope' }), 'skill_nope', 'skills', world)[0]).toMatch(/does not exist/);
    expect(scenarioProblems(doc(good), 'skill_nh_bubble', 'statuses', world)[0]).toMatch(/belongs in/);
    expect(scenarioProblems(doc({ ...good, assets: [{ id: 'fx_splash', state: 'new', layer: 'L1', spec: 'x' }] }), 'skill_nh_bubble', 'skills', world)[0]).toMatch(/already in the manifest/);
    expect(scenarioProblems(doc({ ...good, assets: [{ id: 'fx_missing', state: 'have', layer: 'L1' }] }), 'skill_nh_bubble', 'skills', world)[0]).toMatch(/not in the manifest/);
    expect(scenarioProblems(doc({ ...good, assets: [{ id: 'fx_missing', state: 'new', layer: 'L1' }] }), 'skill_nh_bubble', 'skills', world)[0]).toMatch(/spec/);
    expect(scenarioProblems(doc({ ...good, refs: ['REF-NOPE-001'] }), 'skill_nh_bubble', 'skills', world)[0]).toMatch(/reference/);
    expect(scenarioProblems(doc(good).replace('## 4. Bóc lớp', '## 4. Lớp'), 'skill_nh_bubble', 'skills', world)[0]).toMatch(/missing section/);
    expect(scenarioProblems('# no header', 'skill_nh_bubble', 'skills', world)[0]).toMatch(/no/);
  });

  it('every scenario file in the library is valid', () => {
    const problems: string[] = [];
    let n = 0;
    for (const dir of Object.values(KIND_DIR))
      for (const f of filesIn(join(LIB, 'scenarios', dir), '.md')) {
        n += 1;
        problems.push(...scenarioProblems(readFileSync(join(LIB, 'scenarios', dir, f), 'utf8'), f.replace(/\.md$/, ''), dir, world));
      }
    expect(n).toBeGreaterThan(0);
    expect(problems).toEqual([]);
  });
});
