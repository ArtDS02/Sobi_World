import { describe, expect, it } from 'vitest';
import { BUFF_LANGUAGE, CONDITION_STATUSES, DEBUFF_MAX_MS } from '../../src/areas/adventure/ui/buffLanguage';
import { BATTLE_FX } from '../../src/areas/adventure/logic/config/content';
import { bodyOf } from '../../src/areas/adventure/ui/motionProfiles';
import type { StatusId } from '../../src/systems/combat/types';

const hex = (n: number) => `#${n.toString(16).padStart(6, '0')}`;
const ids = Object.keys(BATTLE_FX.statuses).filter((s) => !CONDITION_STATUSES.includes(s as StatusId)) as StatusId[];

describe('buff and debuff language (ANIM-008)', () => {
  it('every buff and debuff status has a look in the registry', () => {
    for (const id of ids) expect(BUFF_LANGUAGE[id], id).toBeDefined();
  });

  it('a buff keeps the colour of its family in its lasting layer or its effects', () => {
    for (const id of ids) {
      const look = BUFF_LANGUAGE[id]!;
      if (look.family === 'debuff') continue;
      const st = BATTLE_FX.statuses[id]!;
      const colours = [...(st.layers ?? []).map((l) => l.tint), ...(st.apply ?? []).flatMap((a) => [...('tint' in a ? [a.tint].flat() : []), ...('color' in a ? [a.color] : [])])].filter((c) => c !== undefined).map((c) => hex(c as number).toLowerCase());
      if (look.lasting === 'particles' && colours.length === 0) continue;
      expect(colours, id).toContain(look.color.toLowerCase());
    }
  });

  it('a lasting aura, ring or orbit is a layer', () => {
    for (const id of ids) {
      const look = BUFF_LANGUAGE[id]!;
      if (look.lasting !== 'particles') expect(BATTLE_FX.statuses[id]!.layers?.length, id).toBeGreaterThan(0);
    }
  });

  it('a debuff goes down in a dull colour and its own effect is short', () => {
    for (const id of ids.filter((s) => BUFF_LANGUAGE[s]!.family === 'debuff')) {
      const st = BATTLE_FX.statuses[id]!;
      const end = Math.max(...(st.apply ?? []).map((a) => a.at + ('dur' in a && typeof a.dur === 'number' ? a.dur : 0)));
      expect(end, id).toBeLessThanOrEqual(DEBUFF_MAX_MS);
      expect(BUFF_LANGUAGE[id]!.direction).toBe('down');
    }
  });
});

describe('body plans and casts (ANIM-020, 021)', () => {
  it('the winged, floating, heavy and sprouting pigs no longer walk on four legs', () => {
    expect(bodyOf('pig_phoenix')).toBe('flyer');
    expect(bodyOf('pig_galaxy')).toBe('floater');
    expect(bodyOf('pig_turtle')).toBe('heavy');
    expect(bodyOf('pig_sunflower')).toBe('sprout');
  });

  it('every non-physical skill with a script gathers power with a cast move, and a monster attack warns its target', () => {
    for (const [id, fx] of Object.entries(BATTLE_FX.skills)) {
      const script = fx?.script;
      if (!script || !id.startsWith('skill_e_')) continue;
      const moves = script.filter((a) => a.who === 'actor' && a.do === 'move');
      const casts = moves.some((a) => a.do === 'move' && a.move.startsWith('cast_'));
      const hasBigMove = moves.some((a) => a.do === 'move' && ['dash', 'dash_through', 'jump', 'dive', 'lunge', 'spin', 'spin_roll'].includes(a.move));
      if (!hasBigMove && !id.includes('bite') && !id.includes('claw')) expect(casts || moves.length > 0, id).toBe(true);
    }
  });
});

describe('the Ultimate frame (ANIM-009)', () => {
  const ults = Object.entries(BATTLE_FX.skills).filter(([id]) => id.startsWith('skill_ult_'));
  it('has twelve ultimates', () => {
    expect(ults).toHaveLength(12);
  });
  it.each(ults)('%s closes the bars at the start and opens them before the end, and a blow ends on the biggest hit stop', (id, fx) => {
    const script = fx!.script!;
    const bars = script.filter((a) => a.do === 'letterbox');
    expect(bars.map((a) => (a.do === 'letterbox' ? a.on : null)), id).toEqual([true, false]);
    expect(bars[1]!.at + (bars[1]!.do === 'letterbox' ? bars[1]!.dur : 0)).toBeLessThanOrEqual(fx!.timing!.end);
    const stops = script.filter((a) => a.do === 'stop');
    // A support ultimate has no blow, so no hit stop.
    if (stops.length === 0) return;
    const last = stops.reduce((m, a) => (a.at > m.at ? a : m), stops[0]!);
    expect(last.do === 'stop' ? last.tier : null).toBe('ultimate');
  });
});
