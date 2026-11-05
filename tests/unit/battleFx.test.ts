import { describe, expect, it } from 'vitest';
import { BATTLE_FX, ENEMY_LIST, SKILLS } from '../../src/areas/adventure/logic/config/content';
import type { PlayingStep } from '../../src/areas/adventure/ui/battleFxView';
import { stepMotion } from '../../src/areas/adventure/ui/battleMotion';
import { stepPlan } from '../../src/areas/adventure/ui/battlePlan';
import { easeOutBack, poseOf, settle } from '../../src/areas/adventure/ui/battlePose';
import { lookOf, poseArts, timingOf, TIMING } from '../../src/areas/adventure/ui/motionProfiles';
import type { BattleEvent, BattleState } from '../../src/systems/combat/types';

const ally = 'sobi_farm:p1';
const foe = 'enemy_mossling#1';
const battle = { combatants: [{ id: ally, side: 'ally' }, { id: foe, side: 'enemy' }] } as unknown as BattleState;
const sides = new Map([[ally, 'ally'], [foe, 'enemy']] as const);
const hit = (actor: string, target: string, extra: Partial<Extract<BattleEvent, { type: 'damage' }>> = {}): BattleEvent => ({ type: 'damage', actor, target, amount: 50, crit: false, mult: 1, skillId: null, absorbed: 0, element: 'NATURE', ...extra });
const playing = (log: BattleEvent[], enter = false): PlayingStep => {
  const motion = stepMotion(battle, log);
  return { key: 'k', at: 0, fx: { floaters: [], banner: null, shake: false, shakeAt: 0 }, motion, enter, shown: 0 };
};

describe('battle_fx.json (decision 042)', () => {
  it('names only skills and creatures of the game', () => {
    for (const id of Object.keys(BATTLE_FX.skills)) expect(SKILLS[id], id).toBeDefined();
    const enemies = new Set(ENEMY_LIST.map((e) => e.art));
    for (const art of Object.keys(BATTLE_FX.creatures)) expect(enemies.has(art) || art.startsWith('fish_') || art.startsWith('pig_'), art).toBe(true);
  });

  it('every skill gets a look and a timing, its own over its element', () => {
    for (const s of Object.values(SKILLS)) {
      const look = lookOf((s.element ?? null) as never, s.id);
      expect(look.projectile.core, s.id).toBeTruthy();
      expect(look.impact.length + (look.strike === 'none' ? 0 : 1), s.id).toBeGreaterThan(0);
    }
    expect(lookOf('NATURE').projectile.core).toBe('leaf');
    expect(lookOf('NATURE').boom).toBe('fx_bloom');
    expect(lookOf(null).color).toBe(BATTLE_FX.elements.NEUTRAL!.color);
    expect(timingOf('cast', 'projectile', null)).toBe(TIMING.projectile);
    expect(timingOf('ultimate', 'burst', null)).toBe(TIMING.ultimate);
  });
});

describe('the cues of a step', () => {
  const log: BattleEvent[] = [
    { type: 'turn', actor: ally },
    { type: 'use', actor: ally, skillId: 'skill_mm_poison_thorn', ultimate: false },
    hit(ally, foe, { skillId: 'skill_mm_poison_thorn' }),
    { type: 'defeat', target: foe },
  ];

  it('a skill without a script: circle and chant, charge, shot, what lands, the hit and the knock-out, in time order', () => {
    const own = BATTLE_FX.skills.skill_mm_poison_thorn!;
    delete BATTLE_FX.skills.skill_mm_poison_thorn;
    try {
      const p = playing(log);
      const b = p.motion.beats[0]!;
      const cues = stepPlan(p, sides, false);
      const kinds = cues.map((c) => c.kind);
      expect(kinds).toEqual(expect.arrayContaining(['circle', 'charge', 'shot', 'land', 'fx']));
      expect(cues.find((c) => c.kind === 'circle')!.at).toBe(b.start);
      expect(cues.find((c) => c.kind === 'shot')!.at).toBe(b.release);
      expect(cues.find((c) => c.kind === 'land')!.at).toBe(b.impact);
      // The circle's chant; the hit and the knock-out sound as the general actions' scripts say (they replace adv_hit / adv_ko).
      expect(cues.filter((c) => c.kind === 'sound').map((c) => (c.kind === 'sound' ? c.sound : ''))).toEqual(['adv_cast', 'adv_pow', 'adv_bonk']);
      for (let i = 1; i < cues.length; i += 1) expect(cues[i]!.at).toBeGreaterThanOrEqual(cues[i - 1]!.at);
    } finally {
      BATTLE_FX.skills.skill_mm_poison_thorn = own;
    }
  });

  it('a skill with a script plays its acts instead (decision 044)', () => {
    const cues = stepPlan(playing(log), sides, false);
    expect(cues.some((c) => c.kind === 'act')).toBe(true);
    expect(cues.some((c) => c.kind === 'shot')).toBe(false);
    // ...after the magic circle every spell opens with (ANIM-001).
    const circle = cues.find((c) => c.kind === 'circle');
    expect(circle).toBeDefined();
    expect(Math.min(...cues.filter((c) => c.kind === 'act').map((c) => c.at))).toBeGreaterThanOrEqual(circle!.at);
  });

  it('reduced motion keeps the sounds and a still ring on who acts and who is aimed at (ANIM-111); a new battle brings every fighter in by its entrance script', () => {
    const calm = stepPlan(playing(log), sides, true);
    expect(calm.every((c) => c.kind === 'sound' || c.kind === 'still')).toBe(true);
    // Who acts is marked before the blow lands, and each unit it is for is marked when it lands.
    expect(calm.some((c) => c.kind === 'still' && c.role === 'actor' && c.unit === ally)).toBe(true);
    expect(calm.some((c) => c.kind === 'still' && c.role === 'target' && c.unit === foe)).toBe(true);
    const enter = stepPlan(playing(log, true), sides, false);
    expect(enter[0]).toMatchObject({ kind: 'sound', sound: 'adv_battle_start' });
    // The entrance plays before the step's clock starts, for every fighter.
    const early = enter.filter((c) => c.kind === 'act' && c.at < 0);
    expect(new Set(early.map((c) => (c.kind === 'act' ? c.cue.unit : null)))).toEqual(new Set([ally, foe]));
  });
});

describe('key poses', () => {
  it('a pose falls back to the picture itself; the hurt face of decision 041 still counts', () => {
    expect(poseArts('pig_knight', 'idle')).toEqual(['cb_pig_knight_idle', 'pig_knight']);
    expect(poseArts('pig_knight', 'hurt')).toEqual(['cb_pig_knight_hurt', 'pig_knight_hurt', 'cb_pig_knight_idle', 'pig_knight']);
    expect(poseArts('pig_knight', 'attack')[0]).toBe('cb_pig_knight_attack');
  });

  it('the body shows the cast pose while it casts and the hurt pose when the blow lands', () => {
    const p = playing(log2());
    const b = p.motion.beats[0]!;
    const anchors = new Map([
      [ally, { side: 'ally' as const, art: 'pig_knight', feet: { x: 100, y: 300 }, width: 100 }],
      [foe, { side: 'enemy' as const, art: 'enemy_mossling', feet: { x: 500, y: 300 }, width: 100 }],
    ]);
    expect(poseOf(ally, anchors.get(ally)!, anchors, p, b.cast + 10, 0).posture).toBe('cast');
    const hurt = p.motion.reactions.find((r) => r.kind === 'hit')!;
    expect(poseOf(foe, anchors.get(foe)!, anchors, p, hurt.at + 50, 0).posture).toBe('hurt');
    expect(poseOf(foe, anchors.get(foe)!, anchors, p, -5000, 0).posture).toBe('idle');
  });
});

function log2(): BattleEvent[] {
  return [{ type: 'turn', actor: ally }, { type: 'use', actor: ally, skillId: 'skill_mm_poison_thorn', ultimate: false }, hit(ally, foe, { skillId: 'skill_mm_poison_thorn' })];
}

describe('motion feel', () => {
  const anchors = new Map([
    [ally, { side: 'ally' as const, art: 'pig_knight', feet: { x: 100, y: 300 }, width: 100 }],
    [foe, { side: 'enemy' as const, art: 'enemy_mossling', feet: { x: 500, y: 300 }, width: 100 }],
  ]);
  const melee = () => {
    const p = playing([{ type: 'turn', actor: ally }, { type: 'use', actor: ally, skillId: null, ultimate: false }, hit(ally, foe)]);
    return { p, b: p.motion.beats[0]! };
  };

  it('the easings start and end where they should, and the spring runs past rest', () => {
    expect(easeOutBack(0)).toBeCloseTo(0);
    expect(easeOutBack(1)).toBeCloseTo(1);
    expect(Math.max(...[0.5, 0.6, 0.7, 0.8].map(easeOutBack))).toBeGreaterThan(1);
    expect(settle(0)).toBe(0);
    expect(settle(1)).toBe(1);
    expect(Math.max(...Array.from({ length: 40 }, (_, i) => settle(i / 40)))).toBeGreaterThan(1);
  });

  it('a plain attack coils back first, dashes in, hits and comes home, standing over its shadow', () => {
    const { p, b } = melee();
    expect(b.delivery).toBe('melee');
    const at = (t: number) => poseOf(ally, anchors.get(ally)!, anchors, p, t, 0);
    expect(at(b.cast + 100).dx).toBeLessThan(-5);
    const arrived = at(b.cast + 200 + 0.5 * 420);
    expect(arrived.dx).toBeGreaterThan(200);
    expect(arrived.sx).toBeGreaterThan(1.05);
    expect(at(b.cast + 200 + 0.8 * 420).air).toBeGreaterThan(1);
    expect(Math.abs(at(b.end + 600).dx)).toBeLessThan(3.5);
    for (let t = b.start; t <= b.end + 600; t += 10) {
      const q = at(t);
      for (const v of [q.dx, q.dy, q.rot, q.sx, q.sy, q.air]) expect(Number.isFinite(v)).toBe(true);
      expect(q.air).toBeGreaterThanOrEqual(0);
      expect(q.sx).toBeGreaterThan(0.5);
      expect(q.sy).toBeGreaterThan(0.5);
    }
  });

  it('a body that is hit is knocked back, then springs past rest and settles', () => {
    const { p } = melee();
    const r = p.motion.reactions.find((x) => x.kind === 'hit')!;
    const at = (t: number) => poseOf(foe, anchors.get(foe)!, anchors, p, t, 0);
    expect(at(r.at + 80).dx).toBeGreaterThan(10);
    expect(Math.abs(at(r.at + 700).dx)).toBeLessThan(3.5);
  });
});
