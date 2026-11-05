// The data audit of battle scripts (scripts/anim-review/lib/scriptAudit.ts): still pictures moved around, impact against power, phases.
import { describe, expect, it } from 'vitest';
import { actualTier, audit, auditSkill, expectedTier, liveness, type AuditAct, type AuditSkill } from '../../scripts/anim-review/lib/scriptAudit';

const skill = (over: Partial<AuditSkill> = {}): AuditSkill => ({ id: 's', type: 'unique', category: 'magical', element: 'WATER', target: 'enemy', power: 1.2, ...over });
const frames = { fx_splash: 4, fx_long: 8 };
const none = new Set<string>();

/** A complete, healthy skill: wind-up, a flipbook that changes shape, impact of its tier, particles after. */
const healthy: AuditAct[] = [
  { do: 'pose', at: 0, dur: 300, who: 'actor', pose: 'cast' },
  { do: 'move', at: 0, dur: 300, who: 'actor', move: 'cast_coil' },
  { do: 'strip', at: 300, dur: 500, who: 'target', img: 'fx_long', size: 0.8 },
  { do: 'stop', at: 600, who: 'actor', tier: 'medium' },
  { do: 'shake', at: 600, dur: 200, who: 'field', amount: 4 },
  { do: 'burst', at: 800, who: 'target', ref: 'drop_fall' },
  { do: 'decal', at: 800, dur: 400, who: 'targets', kind: 'puddle' },
];

describe('anim script audit', () => {
  it('ranks power into tiers, ultimates and supports apart', () => {
    expect(expectedTier(skill({ power: 0 }))).toBe(0);
    expect(expectedTier(skill({ type: 'ultimate', power: 0 }))).toBe(4);
    expect(expectedTier(skill({ power: 0.6 }))).toBe(1);
    expect(expectedTier(skill({ power: 1.2 }))).toBe(2);
    expect(expectedTier(skill({ power: 2 }))).toBe(3);
  });

  it('reads the impact tier from hit-stop, shake, punch and flash', () => {
    expect(actualTier([])).toBe(0);
    expect(actualTier([{ do: 'stop', tier: 'heavy' }])).toBe(3);
    expect(actualTier([{ do: 'shake', amount: 4 }])).toBe(2);
    expect(actualTier([{ do: 'shake', amount: 8 }, { do: 'stop', tier: 'light' }])).toBe(4);
  });

  it('tells a still picture from a shape that changes', () => {
    expect(liveness({ do: 'prop', img: 'fxp_wave' }, frames)).toBe(0);
    expect(liveness({ do: 'strip', img: 'fx_splash' }, frames)).toBe(0.5);
    expect(liveness({ do: 'strip', img: 'fx_long' }, frames)).toBe(1);
    expect(liveness({ do: 'ribbon' }, frames)).toBe(1);
  });

  it('gives no flag to a healthy skill', () => {
    expect(auditSkill(skill(), healthy, frames, none).flags).toEqual([]);
  });

  it('flags a wave that is one still picture swept across the field (the tsunami case)', () => {
    const acts: AuditAct[] = [
      ...healthy.slice(0, 2),
      { do: 'ribbon', at: 300, dur: 900, who: 'field', thickness: 0.13 },
      { do: 'prop', at: 300, dur: 900, who: 'field', img: 'fxp_wave_crest', path: 'sweep', size: 0.55 },
      ...healthy.slice(3),
    ];
    const r = auditSkill(skill(), acts, frames, none);
    expect(r.hero).toEqual({ do: 'prop', img: 'fxp_wave_crest', liveness: 0 });
    expect(r.flags).toContain('STATIC_HERO');
    expect(r.flags).toContain('STATIC_SHARE');
  });

  it('counts one picture shown by several acts as one object', () => {
    const bubble = (at: number, dur: number, size: number): AuditAct => ({ do: 'prop', at, dur, who: 'target', img: 'fxp_bubble', size });
    const acts: AuditAct[] = [...healthy.slice(0, 2), bubble(0, 200, 0.3), bubble(200, 300, 0.3), { do: 'strip', at: 0, dur: 330, who: 'actor', img: 'fx_splash', size: 0.4 }, ...healthy.slice(3)];
    expect(auditSkill(skill(), acts, frames, none).hero?.img).toBe('fxp_bubble');
  });

  it('flags an impact far under the power, and a support that shakes the screen', () => {
    const weak = healthy.filter((a) => a.do !== 'stop' && a.do !== 'shake');
    expect(auditSkill(skill({ power: 2 }), weak, frames, none).flags).toContain('IMPACT_UNDER_TIER');
    const loud: AuditAct[] = [...healthy.slice(0, 3), { do: 'shake', at: 300, dur: 200, amount: 6 }];
    expect(auditSkill(skill({ power: 0, element: null }), loud, frames, none).flags).toContain('IMPACT_OVER_TIER');
  });

  it('flags a skill with no wind-up and nothing after the hit', () => {
    const flags = auditSkill(skill(), healthy.slice(2, 5), frames, none).flags;
    expect(flags).toContain('NO_PREPARATION');
    expect(flags).toContain('NO_AFTERMATH');
  });

  it('marks flipbooks shared by many skills and ranks class skills higher (seen on every pig)', () => {
    const skills = Array.from({ length: 7 }, (_, i) => skill({ id: `s${i}`, type: i === 0 ? 'class' : 'unique' }));
    const shared: AuditAct[] = [healthy[0]!, { do: 'strip', at: 0, dur: 500, who: 'target', img: 'fx_splash', size: 1 }, ...healthy.slice(3)];
    const r = audit({ skills, scripts: Object.fromEntries(skills.map((s) => [s.id, shared])), frames });
    expect(r.flipbookUse.fx_splash).toHaveLength(7);
    expect(r.skills[0]!.id).toBe('s0');
    expect(r.skills[0]!.flags).toContain('SHARED_FLIPBOOK_HERO');
    expect(r.byElement.WATER!.skills).toBe(7);
  });

  it('flags a skill without a script', () => {
    expect(auditSkill(skill(), undefined, frames, none).flags).toEqual(['NO_SCRIPT']);
  });
});
