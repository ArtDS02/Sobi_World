// The skill census (scripts/audit/skillAuditLib.ts): roles, the SCORES.md parser, counts and gaps, and the real content.
import { describe, expect, it } from 'vitest';
import { runSkillAudit } from '../../scripts/audit/skillAudit';
import { auditSkills, parseScores, skillRole, type AuditedSkill } from '../../scripts/audit/skillAuditLib';

const control = new Set(['stun', 'freeze']);
const sk = (over: Partial<AuditedSkill> = {}): AuditedSkill => ({ id: 's', type: 'unique', category: 'magical', element: 'FIRE', target: 'enemy', power: 1, ...over });

describe('skillRole', () => {
  it('follows the priority ultimate > control > support > area > single', () => {
    expect(skillRole(sk({ type: 'ultimate', category: 'support', effects: [{ kind: 'status', status: 'stun' }] }), control)).toBe('ultimate');
    expect(skillRole(sk({ category: 'support', effects: [{ kind: 'status', status: 'stun' }] }), control)).toBe('control');
    expect(skillRole(sk({ category: 'support', target: 'allAllies' }), control)).toBe('support');
    expect(skillRole(sk({ target: 'allEnemies' }), control)).toBe('area');
    expect(skillRole(sk({ target: 'randomEnemies' }), control)).toBe('area');
    expect(skillRole(sk(), control)).toBe('single');
  });
  it('counts a control status only when it lands on foes', () => {
    expect(skillRole(sk({ category: 'support', target: 'allAllies', effects: [{ kind: 'status', status: 'stun' }] }), control)).toBe('support');
    expect(skillRole(sk({ category: 'support', target: 'self', effects: [{ kind: 'status', status: 'stun', to: 'foes' }] }), control)).toBe('control');
    expect(skillRole(sk({ effects: [{ kind: 'status', status: 'atkDown' }] }), control)).toBe('single');
  });
});

describe('parseScores', () => {
  const md = [
    '| Ngày | Skill | Điểm | Nhận xét |', '|---|---|---|---|',
    '| d | `skill_a` (A) | ~7 | x |', '| d | `skill_b` | chưa chấm số | x |', '',
    '| Skill | Hiệu ứng | Tự chấm | Còn yếu |', '|---|---|---|---|',
    '| `skill_a` A | fx | **7,5** | - |', '| `skill_c` C, `skill_d` D | fx | 7 | - |', '| `skill_e` | fx | chưa chấm | - |',
    '| `skill_b` | fx | 6,5 | - |', '| `skill_b` | fx | 8 | - |',
  ].join('\n');
  it('reads two column layouts, two ids per cell, bold, last row wins, skips non-numbers', () => {
    const m = parseScores(md);
    expect(m.get('skill_a')).toBe(7.5);
    expect(m.get('skill_c')).toBe(7);
    expect(m.get('skill_d')).toBe(7);
    expect(m.get('skill_b')).toBe(8);
    expect(m.has('skill_e')).toBe(false);
  });
  it('reads a tilde score', () => {
    expect(parseScores('| Skill | Điểm |\n|---|---|\n| `skill_x` | ~7 |').get('skill_x')).toBe(7);
  });
});

describe('auditSkills', () => {
  const skills = [
    sk({ id: 'a', element: 'FIRE' }),
    sk({ id: 'b', element: 'FIRE', target: 'allEnemies', type: 'class' }),
    sk({ id: 'c', element: 'WATER', type: 'enemy' }),
    sk({ id: 'd', element: null, category: 'support', power: 0, target: 'self' }),
  ];
  const r = auditSkills(skills, control, new Map([['a', 7], ['b', 8], ['c', 6]]), { min: 2 });
  it('counts by element, type, role and tier, with scores', () => {
    const fire = r.rows.find((x) => x.element === 'FIRE')!;
    expect(fire.total).toBe(2);
    expect(fire.byType.class).toBe(1);
    expect(fire.byRole.area).toBe(1);
    expect(fire.byTier[2]).toBe(2);
    expect([fire.scoreMin, fire.scoreAvg, fire.scoreMax]).toEqual([7, 7.5, 8]);
    expect(r.rows.find((x) => x.element === '—')!.total).toBe(1);
    expect(r.total.total).toBe(4);
  });
  it('reports gaps by min, empty element x role cells and missing scores', () => {
    expect(r.elementGaps.find((g) => g.element === 'FIRE')).toBeUndefined();
    expect(r.elementGaps.find((g) => g.element === 'WATER')?.players).toBe(0);
    expect(r.roleGaps).toContainEqual({ element: 'FIRE', role: 'control' });
    expect(r.roleGaps).not.toContainEqual({ element: 'FIRE', role: 'single' });
    expect(r.missingScores).toEqual(['d']);
  });
});

describe('real content', () => {
  it('has 134 skills, all scored, element rows summing to 134', () => {
    const r = runSkillAudit(10);
    expect(r.total.total).toBe(134);
    expect(r.rows.reduce((n, x) => n + x.total, 0)).toBe(134);
    expect(r.missingScores).toEqual([]);
  });
});
