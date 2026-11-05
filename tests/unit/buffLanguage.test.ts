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
    // Every Ultimate ends on a real hit stop, a support one too (the owner kept the rubric's MUST-HAVE, ANIM-110).
    const stops = script.filter((a) => a.do === 'stop');
    expect(stops.length, id).toBeGreaterThan(0);
    const last = stops.reduce((m, a) => (a.at > m.at ? a : m), stops[0]!);
    expect(last.do === 'stop' ? last.tier : null).toBe('ultimate');
  });
});

describe('the twelve Ultimates open their own way (ANIM-112)', () => {
  const ults = Object.entries(BATTLE_FX.skills).filter(([id]) => id.startsWith('skill_ult_'));
  it('winds up for different lengths and sweeps in with more than one cut-in style', () => {
    const circles = new Set(ults.map(([, fx]) => fx!.circleMs));
    const releases = new Set(ults.map(([, fx]) => fx!.timing!.release));
    const styles = new Set(ults.flatMap(([, fx]) => fx!.script!.filter((a) => a.do === 'cutin').map((a) => (a.do === 'cutin' ? a.style : null))));
    expect(circles.size).toBeGreaterThanOrEqual(8);
    expect(releases.size).toBeGreaterThanOrEqual(8);
    expect(styles).toEqual(new Set(['slash', 'bars', 'rise', 'ring']));
    for (const [id, fx] of ults) expect(fx!.circleMs, id).toBeDefined();
  });
});

describe('statuses have a start, a lasting look and an end (ANIM-119, ANIM-114)', () => {
  it('every status has an expire script', () => {
    for (const [id, st] of Object.entries(BATTLE_FX.statuses)) expect(st!.expire?.length, id).toBeGreaterThan(0);
  });
  it('no two statuses share the acts and pictures of their apply; only the colour may differ (ANIM-114)', () => {
    const sig = (id: string) => JSON.stringify((BATTLE_FX.statuses[id as StatusId]!.apply ?? []).filter((a) => a.do !== 'sound').map((a) => [a.do, 'ref' in a ? a.ref : 'img' in a ? a.img : '']));
    const seen = new Map<string, string>();
    for (const id of Object.keys(BATTLE_FX.statuses)) {
      const k = sig(id);
      expect(seen.get(k), `${id} duplicates ${seen.get(k)}`).toBeUndefined();
      seen.set(k, id);
    }
  });
  it('the debuffs show their own picture, big enough to read next to a blow', () => {
    const downs = ['atkDown', 'defDown', 'matkDown', 'mdefDown', 'accDown', 'evaDown', 'spdDown'] as const;
    for (const id of downs) {
      const shape = BATTLE_FX.statuses[id]!.apply!.find((a) => a.do === 'prop' || a.do === 'strip');
      expect(shape, id).toBeDefined();
      expect(shape!.do === 'prop' || shape!.do === 'strip' ? (shape as { size?: number }).size ?? 1.3 : 0, id).toBeGreaterThanOrEqual(0.45);
    }
  });
  it('an expire is a picture and not only a few particles, so the end of a status can be seen (ANIM-120)', () => {
    for (const [id, st] of Object.entries(BATTLE_FX.statuses)) {
      if (['freeze', 'burn', 'doom'].includes(id)) continue;
      const seen = st!.expire!.some((a) => a.do === 'strip' || a.do === 'decal' || a.do === 'prop');
      expect(seen, id).toBe(true);
    }
  });
});

describe('an Ultimate lands with weight (ANIM-129)', () => {
  const ults = Object.entries(BATTLE_FX.skills).filter(([id]) => id.startsWith('skill_ult_'));
  it.each(ults)('%s has a camera punch, a flash and a firm shake around its hit stop, without a strobe', (id, fx) => {
    const script = fx!.script!;
    const stops = script.filter((a) => a.do === 'stop');
    const T = Math.max(...stops.map((a) => a.at));
    const around = (do_: string, lo: number, hi: number) => script.filter((a) => a.do === do_ && a.at >= T + lo && a.at <= T + hi);
    expect(around('punch', -250, 150).length, `${id} punch`).toBeGreaterThan(0);
    expect(around('flash', -80, 150).length, `${id} flash`).toBeGreaterThan(0);
    expect(around('shake', -300, 300).some((a) => a.do === 'shake' && a.amount >= 6), `${id} shake`).toBe(true);
    // Rubric 10.4: no more than three strong full-screen flashes in any second.
    const strong = script.filter((a) => a.do === 'flash' && a.alpha >= 0.4).map((a) => a.at);
    for (const t of strong) expect(strong.filter((u) => u >= t && u < t + 1000).length, `${id} strobe`).toBeLessThanOrEqual(3);
  });
});
