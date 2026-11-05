// A puppet's want on the battle stage (decision 050): read from the step's beats and reactions, timed so the clip lands on the beat.
import { describe, expect, it } from 'vitest';
import type { PlayingStep } from '../../src/areas/adventure/ui/battleFxView';
import lineagesRaw from '../../content/adventure/lineages.json';
import { deliveryOf } from '../../src/areas/adventure/ui/battleMotion';
import { altOf, gestureOf, perfOf } from '../../src/areas/adventure/ui/battlePerf';
import { Performer, RIGS } from '../../src/systems/animation';

const beat = { actor: 'a', pose: 'attack', delivery: 'melee', element: null, skillId: null, targets: ['f'], circle: false, start: 0, cast: 0, release: 220, impact: 330, end: 650 };
const step = (extra: Partial<PlayingStep['motion']> = {}) =>
  ({ key: 's1', at: 0, enter: false, motion: { beats: [beat], reactions: [{ unit: 'f', kind: 'hit', at: 330 }], marks: [], eventAt: [], total: 650, speed: 1, ...extra } }) as unknown as PlayingStep;

describe('battle perf (puppets on the battle stage)', () => {
  it('a melee beat is an attack with its release, contact and end', () => {
    const w = perfOf('a', step(), 100, 'attack', false);
    expect(w.action).toBe('attack');
    expect(w.timing).toEqual({ t: 100, marks: { release: 220, contact: 330, end: 650 } });
  });

  it('the target is hurt from the impact, for as long as the reaction plays, then idles', () => {
    expect(perfOf('f', step(), 300, 'idle', false).action).toBe('idle');
    const w = perfOf('f', step(), 400, 'hurt', false);
    expect(w.action).toBe('hurt');
    expect(w.timing?.t).toBe(70);
    expect(perfOf('f', step(), 2000, 'idle', false).action).toBe('idle');
  });

  it('a reaction wins over the unit’s own beat; a unit that is out lies down; the winners celebrate', () => {
    const s = step({ reactions: [{ unit: 'a', kind: 'hit-crit', at: 200 }] });
    expect(perfOf('a', s, 250, 'hurt', false).action).toBe('hurt_crit');
    expect(perfOf('a', step(), 100, 'idle', true).action).toBe('ko');
    const won = step({ marks: [{ unit: 'a', kind: 'victory', id: 'win', at: 650, from: null }] });
    expect(perfOf('a', won, 900, 'idle', false).action).toBe('victory');
  });
});

describe('skill gestures (decision 050: the body of a skill)', () => {
  it('a skill names its gesture, or its script’s whole-body cast says it, or its delivery does', () => {
    expect(gestureOf({ skillId: 'skill_qs_quake', pose: 'cast', delivery: 'burst' })).toBe('slam');
    // skill_mm_sprout was written with `cast_bow`: a bow is channelling.
    expect(gestureOf({ skillId: 'skill_mm_sprout', pose: 'support', delivery: 'aura' })).toBe('channel');
    expect(gestureOf({ skillId: 'no_such_skill', pose: 'cast', delivery: 'projectile' })).toBe('shoot');
    expect(gestureOf({ skillId: null, pose: 'attack', delivery: 'melee' })).toBeNull();
  });

  it('a puppet tries the skill’s own clip, an ultimate’s, then the gesture and its nearest ones', () => {
    expect(altOf({ skillId: 'skill_qs_stone_skin', pose: 'support', delivery: 'aura' })).toEqual(['skill_qs_stone_skin', 'g_brace', 'g_channel']);
    expect(altOf({ skillId: 'skill_ult_mm', pose: 'ultimate', delivery: 'aura' }).slice(0, 2)).toEqual(['skill_ult_mm', 'ultimate']);
  });

  it('every skill of each prototype’s lineage plays a body clip of its own, not the generic cast', () => {
    const lineage = Object.fromEntries((lineagesRaw as { lineages: { id: string; unique: string[]; ultimate: string }[] }).lineages.map((l) => [l.id, [...l.unique, l.ultimate]]));
    const of: Record<string, string> = { pig_boar: 'moc_mau', pig_turtle: 'quy_son', fish_betta: 'hoa_giai', octopus: 'da_mac' };
    for (const [rig, line] of Object.entries(of)) {
      const p = new Performer(RIGS.get(rig)!, 't');
      for (const skillId of lineage[line]!) {
        const ult = skillId.startsWith('skill_ult_');
        const d = deliveryOf(skillId, ult);
        const clip = p.clipName(d.pose === 'attack' ? 'attack' : 'cast', altOf({ skillId, pose: d.pose, delivery: d.delivery }));
        expect(clip, `${rig} ${skillId}`).not.toBe('cast');
      }
    }
  });
});
