import { afterEach, describe, expect, it } from 'vitest';
import { battleFxFileSchema } from '../../content/schemas/adventure/battleFx';
import { scriptEnd, scriptSchema, type Act } from '../../content/schemas/adventure/battleScript';
import { BATTLE_FX } from '../../src/areas/adventure/logic/config/content';
import type { PlayingStep } from '../../src/areas/adventure/ui/battleFxView';
import { stepMotion } from '../../src/areas/adventure/ui/battleMotion';
import { stepPlan } from '../../src/areas/adventure/ui/battlePlan';
import { poseOf, type PoseAnchor } from '../../src/areas/adventure/ui/battlePose';
import { loopCues, stepScript } from '../../src/areas/adventure/ui/battleScript';
import { lookOf } from '../../src/areas/adventure/ui/motionProfiles';
import type { BattleEvent, BattleState } from '../../src/systems/combat/types';

// Decision 044: the scripts of battle_fx.json on the step's clock. A real skill is given a test script and put back after each test.
const SKILL = 'skill_cl_meteor';
const ally = 'a1';
const foes = ['e1', 'e2', 'e3'];
const battle = { combatants: [{ id: ally, side: 'ally' }, ...foes.map((id) => ({ id, side: 'enemy' }))] } as unknown as BattleState;
const sides = new Map<string, 'ally' | 'enemy'>([[ally, 'ally'], ...foes.map((id) => [id, 'enemy'] as [string, 'enemy'])]);
const anchors = new Map<string, PoseAnchor>([
  [ally, { side: 'ally', art: 'pig_knight', feet: { x: 100, y: 300 }, width: 100 }],
  ...foes.map((id, i) => [id, { side: 'enemy', art: 'enemy_mossling', feet: { x: 500 + i * 120, y: 300 }, width: 100 }] as [string, PoseAnchor]),
]);
const saved = { skill: BATTLE_FX.skills[SKILL], actions: { ...BATTLE_FX.actions }, statuses: { ...BATTLE_FX.statuses }, reactions: { ...BATTLE_FX.elementReactions } };

afterEach(() => {
  if (saved.skill) BATTLE_FX.skills[SKILL] = saved.skill;
  else delete BATTLE_FX.skills[SKILL];
  BATTLE_FX.actions = { ...saved.actions };
  BATTLE_FX.statuses = { ...saved.statuses };
  BATTLE_FX.elementReactions = { ...saved.reactions };
});

/** Gives the test skill `script` (checked by the file's schema) with its timing and stagger. */
function withScript(script: unknown[], extra: Record<string, unknown> = {}) {
  const parsed = battleFxFileSchema.parse({ ...structuredClone(rawOf()), skills: { [SKILL]: { timing: { release: 300, impact: 600, end: 1000 }, ...extra, script } } });
  BATTLE_FX.skills[SKILL] = parsed.skills[SKILL]!;
  BATTLE_FX.actions = parsed.actions;
  BATTLE_FX.statuses = parsed.statuses;
  BATTLE_FX.elementReactions = parsed.elementReactions;
}
// The file as written (colours as text): enough of it for the schema to read a skill.
const rawOf = () => {
  const hex = (n: number) => `#${n.toString(16).padStart(6, '0')}`;
  const look = (l: (typeof BATTLE_FX.elements)['FIRE']) => ({ ...l, color: hex(l!.color), glow: hex(l!.glow), ring: l!.ring === null ? null : hex(l!.ring), flash: l!.flash === null ? null : hex(l!.flash) });
  return {
    ...BATTLE_FX,
    particles: Object.fromEntries(Object.entries(BATTLE_FX.particles).map(([k, b]) => [k, { ...b, colors: b.colors.map(hex) }])),
    elements: Object.fromEntries(Object.entries(BATTLE_FX.elements).map(([k, l]) => [k, look(l)])),
    skills: {},
    actions: {},
    statuses: {},
    elementReactions: {},
  };
};

const use = (targets = foes): BattleEvent[] => [
  { type: 'turn', actor: ally },
  { type: 'use', actor: ally, skillId: SKILL, ultimate: false },
  ...targets.map((t): BattleEvent => ({ type: 'damage', actor: ally, target: t, amount: 30, crit: false, mult: 1, skillId: SKILL, absorbed: 0, element: 'FIRE' })),
];
const playing = (log: BattleEvent[], fast = false): PlayingStep => ({ key: 'k', at: 0, fx: { floaters: [], banner: null, shake: false, shakeAt: 0 }, motion: stepMotion(battle, log, fast), enter: false, shown: 0 });

describe('stagger (decision 044)', () => {
  it('each target of an area skill is hit, numbered and knocked back a little after the one before', () => {
    withScript([], { stagger: 120 });
    const m = stepMotion(battle, use());
    const hits = m.reactions.filter((r) => r.kind === 'hit').map((r) => r.at);
    expect(hits[1]! - hits[0]!).toBeCloseTo(120 * m.speed);
    expect(hits[2]! - hits[1]!).toBeCloseTo(120 * m.speed);
    expect(m.eventAt[3]).toBeCloseTo(hits[1]!);
    // The beat lasts until the last one has played out.
    expect(m.beats[0]!.end).toBeGreaterThan(hits[2]!);
  });

  it('a spell with a script still opens with its magic circle (ANIM-001), unless it opts out', () => {
    withScript([]);
    expect(stepMotion(battle, use()).beats[0]!.circle).toBe(true);
    withScript([], { circle: false });
    expect(stepMotion(battle, use()).beats[0]!.circle).toBe(false);
  });
});

describe('a skill script on the step clock', () => {
  const script = [
    { do: 'pose', who: 'actor', at: 0, dur: 300, pose: 'cast' },
    { do: 'move', who: 'actor', at: 0, dur: 300, move: 'rear' },
    { do: 'strip', who: 'targets', at: 600, img: 'fx_boom', tint: '$color' },
    { do: 'tint', who: 'field', at: 100, dur: 500, color: '#000000', alpha: 0.3 },
    { do: 'sound', who: 'actor', at: 0, sound: 'adv_fire_cast' },
    { do: 'stop', who: 'target', at: 600, dur: 80 },
  ];

  it('fills the look in, staggers the units of an act, keeps the screen as no unit, and plays body acts as moves', () => {
    withScript(script, { stagger: 100 });
    const p = playing(use());
    const s = stepScript(p, sides);
    const strips = s.cues.filter((c) => c.act.do === 'strip');
    expect(strips.map((c) => c.unit)).toEqual(foes);
    expect(strips[1]!.at - strips[0]!.at).toBeCloseTo(100 * p.motion.speed);
    expect((strips[0]!.act as Extract<Act, { do: 'strip' }>).tint).toBe(lookOf(p.motion.beats[0]!.element, SKILL).color);
    expect(strips[0]!.at).toBeCloseTo(p.motion.beats[0]!.impact);
    expect(s.cues.find((c) => c.act.do === 'tint')!.unit).toBeNull();
    expect(s.moves.map((m) => m.act.do).sort()).toEqual(['move', 'pose']);
    expect(s.scripted.has(ally)).toBe(true);
  });

  it('the script replaces the default charge, shot and landing; its sounds stay with reduced motion', () => {
    withScript(script);
    const p = playing(use(['e1']));
    const cues = stepPlan(p, sides, false);
    expect(cues.some((c) => c.kind === 'shot' || c.kind === 'land' || c.kind === 'charge')).toBe(false);
    expect(cues.some((c) => c.kind === 'act')).toBe(true);
    const reduced = stepPlan(p, sides, true);
    expect(reduced.every((c) => c.kind === 'sound')).toBe(true);
    expect(reduced.some((c) => c.kind === 'sound' && c.sound === 'adv_fire_cast')).toBe(true);
  });

  it('at x2 every act comes sooner and lasts less', () => {
    withScript(script);
    const slow = stepScript(playing(use(['e1'])), sides).cues.find((c) => c.act.do === 'tint')!;
    const fast = stepScript(playing(use(['e1']), true), sides).cues.find((c) => c.act.do === 'tint')!;
    expect(fast.at).toBeLessThan(slow.at);
    expect((fast.act as { dur: number }).dur).toBeLessThan((slow.act as { dur: number }).dur);
  });

  it('the body takes the script\'s pose and moves, not the default lean of a cast', () => {
    withScript(script);
    const p = playing(use(['e1']));
    const b = p.motion.beats[0]!;
    const mid = poseOf(ally, anchors.get(ally)!, anchors, p, b.cast + 150 * p.motion.speed, 0);
    expect(mid.posture).toBe('cast');
    expect(mid.rot).toBeLessThan(0); // rearing up (it looks right)
  });

  it('a vanished body stays gone until it appears again; a dash reaches its target and comes home', () => {
    withScript([
      { do: 'move', who: 'actor', at: 0, dur: 200, move: 'vanish' },
      { do: 'move', who: 'actor', at: 400, dur: 200, move: 'appear' },
      { do: 'move', who: 'actor', at: 800, dur: 600, move: 'dash' },
    ]);
    const p = playing(use(['e1']));
    const k = p.motion.speed;
    const at = (ms: number) => p.motion.beats[0]!.cast + ms * k;
    expect(poseOf(ally, anchors.get(ally)!, anchors, p, at(300), 0).opacity).toBe(0);
    expect(poseOf(ally, anchors.get(ally)!, anchors, p, at(700), 0).opacity).toBeGreaterThan(0.9);
    // A dash: half way through far from home (at its target), at the end back.
    expect(poseOf(ally, anchors.get(ally)!, anchors, p, at(1090), 0).dx).toBeGreaterThan(200);
    expect(Math.abs(poseOf(ally, anchors.get(ally)!, anchors, p, at(1405), 0).dx)).toBeLessThan(5);
  });
});

describe('statuses, reactions and the general actions', () => {
  it('a status with its own look plays it instead of the generic arrows; an elemental reaction plays its script', () => {
    withScript([]);
    BATTLE_FX.statuses = { poison: { icon: 'st_poison', apply: [{ do: 'burst', at: 0, who: 'actor', ref: 'thorn_poison' }] } } as never;
    BATTLE_FX.elementReactions = { reaction_shock: [{ do: 'flash', at: 0, who: 'field', dur: 100, color: 0xffffff, alpha: 0.3 }] } as never;
    BATTLE_FX.actions = { debuff: [{ do: 'burst', at: 0, who: 'actor', ref: 'debuff_arrows' }] } as never;
    const log: BattleEvent[] = [...use(['e1']), { type: 'status', actor: ally, target: 'e1', status: 'poison', skillId: SKILL }, { type: 'reaction', target: 'e1', reaction: 'reaction_shock' }];
    const s = stepScript(playing(log), sides);
    const refs = s.cues.filter((c) => c.act.do === 'burst').map((c) => (c.act as { ref: string }).ref);
    expect(refs).toContain('thorn_poison');
    expect(refs).not.toContain('debuff_arrows');
    expect(s.cues.some((c) => c.act.do === 'flash')).toBe(true);
  });

  it('a status loop is played on its unit from now, without body moves or sounds', () => {
    const cues = loopCues([{ do: 'burst', at: 50, who: 'actor', ref: 'thorn_poison' }, { do: 'move', at: 0, who: 'actor', dur: 100, move: 'hop' }, { do: 'sound', at: 0, who: 'actor', sound: 'adv_hit' }], 'e1');
    expect(cues).toHaveLength(1);
    expect(cues[0]).toMatchObject({ at: 50, unit: 'e1' });
  });

  it('a script ends when its last act (or a held frame) is over', () => {
    const acts = scriptSchema.parse([
      { do: 'strip', at: 100, img: 'fx_boom', dur: 300, hold: 200 },
      { do: 'shake', at: 50, dur: 100, amount: 4 },
    ]);
    expect(scriptEnd(acts)).toBe(600);
  });
});
