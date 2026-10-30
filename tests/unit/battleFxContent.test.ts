import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { actImages, scriptEnd, type Act } from '../../content/schemas/adventure/battleScript';
import { BATTLE_FX, SKILLS } from '../../src/areas/adventure/logic/config/content';
import { STATUS_IDS } from '../../src/systems/combat/types';

// Decision 044: the content of the battle animation (the design all_animation_sobi_adventure_final.md moved into battle_fx.json).
const manifest = JSON.parse(readFileSync('public/assets/manifest/assets.json', 'utf8')) as Record<string, { id: string }[] | number>;
const ids = new Set(Object.values(manifest).flatMap((rows) => (Array.isArray(rows) ? rows.map((r) => r.id) : [])));
const reactionIds = (JSON.parse(readFileSync('content/adventure/reactions.json', 'utf8')) as { reactions: { id: string }[] }).reactions.map((r) => r.id);

/** Every script of the file with where it is. */
function scripts(): [string, readonly Act[]][] {
  const out: [string, readonly Act[]][] = [];
  for (const [id, s] of Object.entries(BATTLE_FX.skills)) if (s.script) out.push([`skills.${id}`, s.script]);
  for (const [id, acts] of Object.entries(BATTLE_FX.actions)) out.push([`actions.${id}`, acts!]);
  for (const [id, st] of Object.entries(BATTLE_FX.statuses)) {
    if (st?.apply) out.push([`statuses.${id}.apply`, st.apply]);
    if (st?.loop) out.push([`statuses.${id}.loop`, st.loop.script]);
  }
  for (const [id, acts] of Object.entries(BATTLE_FX.elementReactions)) out.push([`elementReactions.${id}`, acts]);
  return out;
}

describe('battle animation content (decision 044)', () => {
  it('every skill of the game has its own script and timing', () => {
    for (const s of Object.values(SKILLS)) {
      const own = BATTLE_FX.skills[s.id];
      expect(own?.script?.length, s.id).toBeGreaterThan(0);
      expect(own?.timing, s.id).toBeDefined();
    }
  });

  it('every picture a script, a burst or a status names is a row of the manifest', () => {
    const named = new Set<string>();
    for (const [, acts] of scripts()) for (const a of acts) for (const img of actImages(a)) named.add(img);
    for (const b of Object.values(BATTLE_FX.particles)) if (b.art) named.add(b.art);
    for (const st of Object.values(BATTLE_FX.statuses)) {
      if (!st) continue;
      named.add(st.icon);
      if (st.cover) named.add(st.cover.img);
    }
    for (const l of Object.values(BATTLE_FX.elements)) if (l?.boom?.startsWith('fx_')) named.add(l.boom);
    const missing = [...named].filter((id) => !ids.has(id));
    expect(missing).toEqual([]);
    expect(named.size).toBeGreaterThan(100);
  });

  it('every burst a script names exists (or is a sprite, a strip, or the element particle)', () => {
    for (const [where, acts] of scripts()) {
      for (const a of acts) {
        if (a.do !== 'burst') continue;
        const ok = a.ref.startsWith('$') || a.ref.startsWith('fx') || a.ref in BATTLE_FX.particles;
        expect(ok, `${where}: ${a.ref}`).toBe(true);
      }
    }
  });

  it('no script plays past its beat; a turn stays under 5.6 s, an Ultimate under 3.5 s', () => {
    for (const [id, s] of Object.entries(BATTLE_FX.skills)) {
      if (!s.script || !s.timing) continue;
      expect(scriptEnd(s.script), id).toBeLessThanOrEqual(s.timing.end);
      expect(s.timing.end, id).toBeLessThanOrEqual(SKILLS[id]?.type === 'ultimate' ? 3500 : 5600);
      expect(s.timing.release, id).toBeLessThanOrEqual(s.timing.impact);
    }
    for (const [id, acts] of Object.entries(BATTLE_FX.actions)) expect(scriptEnd(acts!), id).toBeLessThanOrEqual(1500);
    for (const [id, acts] of Object.entries(BATTLE_FX.elementReactions)) expect(scriptEnd(acts), id).toBeLessThanOrEqual(1200);
  });

  it('every status has a badge and every elemental reaction a script', () => {
    for (const s of STATUS_IDS) expect(BATTLE_FX.statuses[s]?.icon, s).toBeTruthy();
    for (const r of reactionIds) expect(BATTLE_FX.elementReactions[r]?.length, r).toBeGreaterThan(0);
  });

  it('every element has its particle and impact (a class skill takes the one of its user)', () => {
    for (const [id, l] of Object.entries(BATTLE_FX.elements)) {
      expect(l?.spark, id).toBeTruthy();
      expect(l?.boom, id).toBeTruthy();
    }
  });
});
