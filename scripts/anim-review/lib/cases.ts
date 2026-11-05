// The list of capture cases, derived from the game's own content through the lab hook (nothing is hard-coded per skill).
import type { Page } from '@playwright/test';
import type { LabCase } from './session';

interface SkillRow {
  id: string;
  type: string;
  element: string | null;
  target: string | null;
  statuses: string[];
  hasLook: boolean;
}
interface StatusRow {
  id: string;
  hasApply: boolean;
  hasLoop: boolean;
  hasLayers: boolean;
  hasExpire: boolean;
  /** The apply script without colours or sounds: which acts and which pictures it uses. */
  applySig: string;
}

/** A status that lands on its own side (buffs) is put on the striker; the others go on the foe. */
const selfStatus = (id: string) => /Up$/.test(id) || ['shield', 'taunt', 'regen', 'autoRevive'].includes(id);

export const SUITES = ['pilot', 'skills', 'ultimates', 'statuses', 'reactions', 'variants', 'all'] as const;
export type Suite = (typeof SUITES)[number];

const PIG = 'pig_knight';
const WOLF = 'enemy_forest_wolf';

/** The lab fields that show a skill the way the game would use it (who strikes, how many stand on each side). */
function configOf(s: SkillRow): Record<string, unknown> {
  const t = s.target ?? 'enemy';
  const foes = ['allEnemies', 'randomEnemies', 'all'].includes(t) ? 3 : 1;
  const allies = t === 'allAllies' || t === 'all' ? 3 : t === 'ally' ? 2 : 1;
  const base = { skill: s.id, allies, foes, crit: false, ko: false, fast: false, reduce: false, reaction: '', phase: false, win: false, corruption: 0 };
  return s.type === 'enemy' ? { ...base, fromEnemy: true, attacker: WOLF, target: PIG } : { ...base, fromEnemy: false, attacker: PIG, target: WOLF };
}

export interface CaseSet {
  cases: LabCase[];
  /** caseId of an `apply` status case -> caseIds of other statuses whose apply uses the same acts and pictures (only the colour may differ). */
  statusTwins: Record<string, string[]>;
  /** Cases that cannot be shown by the lab, with the reason (they appear in the manifest as `absent`). */
  absent: { caseId: string; group: string; reason: string }[];
}

export async function buildCases(page: Page, suite: Suite, only: string[]): Promise<CaseSet> {
  const skills = (await page.evaluate('window.__animLab.skills()')) as SkillRow[];
  const reactions = (await page.evaluate('window.__animLab.reactions()')) as string[];
  const statuses = (await page.evaluate('window.__animLab.statuses()')) as StatusRow[];
  const cases: LabCase[] = [];
  const absent: CaseSet['absent'] = [];
  const statusTwins: Record<string, string[]> = {};
  for (const st of statuses) statusTwins[`battle.status.${st.id}.apply`] = statuses.filter((o) => o.id !== st.id && o.applySig === st.applySig).map((o) => `battle.status.${o.id}.apply`);
  const want = (s: Suite) => suite === s || suite === 'all';

  const ults = skills.filter((s) => s.type === 'ultimate');
  const plain = skills.filter((s) => s.type !== 'ultimate');
  if (want('ultimates')) for (const s of ults) cases.push({ caseId: `battle.ult.${s.id}`, group: 'ultimate', config: configOf(s) });
  if (want('skills')) for (const s of plain) cases.push({ caseId: `battle.skill.${s.id}`, group: 'skill', config: configOf(s) });
  if (want('reactions')) for (const r of reactions) cases.push({ caseId: `battle.reaction.${r}`, group: 'reaction', config: { ...configOf({ id: '', type: 'class', element: null, target: 'enemy', statuses: [], hasLook: false }), reaction: r } });
  if (want('statuses')) {
    // Each status is put on by the plain attack alone (never by the skill that happens to carry it, whose own effects would hide it), then
    // shown in its three phases: applied, lasting (its loop or lasting layers, left alone), ended.
    const base = configOf({ id: '', type: 'class', element: null, target: 'enemy', statuses: [], hasLook: false });
    for (const st of statuses) {
      const config = { ...base, status: st.id, statusTo: selfStatus(st.id) ? 'self' : 'foe' };
      cases.push({ caseId: `battle.status.${st.id}.apply`, group: 'status', config, mode: 'apply' });
      if (st.hasLoop || st.hasLayers) cases.push({ caseId: `battle.status.${st.id}.loop`, group: 'status', config, mode: 'loop' });
      else absent.push({ caseId: `battle.status.${st.id}.loop`, group: 'status', reason: 'content has neither a loop nor lasting layers for this status' });
      if (st.hasExpire) cases.push({ caseId: `battle.status.${st.id}.expire`, group: 'status', config, mode: 'expire' });
      else absent.push({ caseId: `battle.status.${st.id}.expire`, group: 'status', reason: 'content has no expire script for this status' });
    }
  }
  if (want('variants') && ults[0] && plain[0]) {
    // A skill that strikes a foe, so KO, crit and the rest show what they are for (a self buff would show nothing).
    const p = plain.find((x) => x.id === 'skill_cl_power_strike') ?? plain.find((x) => x.type === 'class' && x.target === 'enemy') ?? plain[0]!;
    for (const [tag, patch] of [['reduce', { reduce: true }], ['crit', { crit: true }], ['fast', { fast: true }], ['ko', { ko: true }], ['win', { win: true }]] as const) {
      cases.push({ caseId: `battle.variant.${p.id}.${tag}`, group: 'variant', config: { ...configOf(p), ...patch } });
    }
    for (const u of ults.slice(0, 3)) cases.push({ caseId: `battle.variant.${u.id}.reduce`, group: 'variant', config: { ...configOf(u), reduce: true } });
    cases.push({ caseId: `battle.variant.${p.id}.multi33`, group: 'variant', config: { ...configOf(p), allies: 3, foes: 3 } });
  }
  if (suite === 'pilot') {
    const u = ults[0];
    const p = plain.find((s) => s.type === 'class');
    const st = statuses.find((x) => x.id === 'freeze') ?? statuses[0];
    if (u) cases.push({ caseId: `battle.ult.${u.id}`, group: 'ultimate', config: configOf(u) });
    if (p) cases.push({ caseId: `battle.skill.${p.id}`, group: 'skill', config: configOf(p) });
    if (st) cases.push({ caseId: `battle.status.${st.id}.apply`, group: 'status', config: { ...configOf({ id: '', type: 'class', element: null, target: 'enemy', statuses: [], hasLook: false }), status: st.id, statusTo: selfStatus(st.id) ? 'self' : 'foe' }, mode: 'apply' });
    if (st && st.hasExpire) cases.push({ caseId: `battle.status.${st.id}.expire`, group: 'status', config: { ...configOf({ id: '', type: 'class', element: null, target: 'enemy', statuses: [], hasLook: false }), status: st.id, statusTo: selfStatus(st.id) ? 'self' : 'foe' }, mode: 'expire' });
  }
  const keep = (id: string) => only.length === 0 || only.some((o) => id === o || id.startsWith(o));
  return { statusTwins, cases: cases.filter((c) => keep(c.caseId)), absent: absent.filter((a) => keep(a.caseId) || a.caseId.includes('*')) };
}

/** The case the gates use (the first ultimate, else the first skill). */
export async function gateCase(page: Page): Promise<LabCase> {
  const skills = (await page.evaluate('window.__animLab.skills()')) as SkillRow[];
  const s = skills.find((x) => x.type === 'ultimate') ?? skills[0]!;
  return { caseId: `gate.${s.id}`, group: 'gate', config: configOf(s) };
}
