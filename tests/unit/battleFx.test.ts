import { describe, expect, it } from 'vitest';
import { BATTLE_FX, ENEMY_LIST, SKILLS } from '../../src/areas/adventure/logic/config/content';
import type { PlayingStep } from '../../src/areas/adventure/ui/battleFxView';
import { stepMotion } from '../../src/areas/adventure/ui/battleMotion';
import { stepPlan } from '../../src/areas/adventure/ui/battlePlan';
import { poseOf } from '../../src/areas/adventure/ui/battlePose';
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
    expect(lookOf('NATURE', 'skill_mm_poison_thorn').projectile.core).toBe('shard');
    expect(lookOf('NATURE').projectile.core).toBe('leaf');
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

  it('a skill: circle and chant, charge, shot, what lands, the hit and the knock-out, in time order', () => {
    const p = playing(log);
    const b = p.motion.beats[0]!;
    const cues = stepPlan(p, sides, false);
    const kinds = cues.map((c) => c.kind);
    expect(kinds).toEqual(expect.arrayContaining(['circle', 'charge', 'shot', 'land', 'fx']));
    expect(cues.find((c) => c.kind === 'circle')!.at).toBe(b.start);
    expect(cues.find((c) => c.kind === 'shot')!.at).toBe(b.release);
    expect(cues.find((c) => c.kind === 'land')!.at).toBe(b.impact);
    expect(cues.filter((c) => c.kind === 'sound').map((c) => (c.kind === 'sound' ? c.sound : ''))).toEqual(['adv_cast', 'adv_hit', 'adv_ko']);
    for (let i = 1; i < cues.length; i += 1) expect(cues[i]!.at).toBeGreaterThanOrEqual(cues[i - 1]!.at);
  });

  it('reduced motion keeps only the sounds; a new battle brings every fighter in', () => {
    expect(stepPlan(playing(log), sides, true).every((c) => c.kind === 'sound')).toBe(true);
    const enter = stepPlan(playing(log, true), sides, false);
    expect(enter.filter((c) => c.kind === 'teleport')).toHaveLength(2);
    expect(enter[0]).toMatchObject({ kind: 'sound', sound: 'adv_battle_start' });
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
