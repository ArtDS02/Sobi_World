// Pure core of the skill census (no file access): role of a skill, the SCORES.md parser, the counts and gaps, a markdown table.
// scripts/audit/skillAudit.ts feeds it the content files and prints the result.
import { expectedTier, type AuditSkill, type Tier } from '../anim-review/lib/scriptAudit';

export interface SkillEffect {
  kind: string;
  status?: string;
  to?: string;
}
export interface AuditedSkill extends AuditSkill {
  effects?: SkillEffect[];
}

export type Role = 'ultimate' | 'control' | 'support' | 'area' | 'single';
export const ROLES: readonly Role[] = ['single', 'area', 'support', 'control', 'ultimate'];
export const TYPES = ['unique', 'ultimate', 'class', 'enemy'] as const;
/** Fixed order of the element rows; '—' stands for a skill without element (null). */
export const ELEMENT_ROWS = ['FIRE', 'WATER', 'EARTH', 'METAL', 'LIGHTNING', 'NATURE', 'LIGHT', 'DARK', 'VOID', 'SELF', '—'] as const;
const PLAYER_ELEMENTS: readonly string[] = ELEMENT_ROWS.slice(0, 9);

const AREA = new Set(['allEnemies', 'randomEnemies', 'all']);
const ENEMY_SIDE = new Set(['enemy', 'allEnemies', 'randomEnemies', 'all']);

/** Main role, highest priority first: ultimate > control > support > area > single. */
export function skillRole(skill: AuditedSkill, controlStatusIds: ReadonlySet<string>): Role {
  if (skill.type === 'ultimate') return 'ultimate';
  const enemySide = ENEMY_SIDE.has(skill.target ?? '');
  const controls = (skill.effects ?? []).some(
    (e) => e.kind === 'status' && controlStatusIds.has(e.status ?? '') && (e.to === 'foes' || (enemySide && e.to !== 'self' && e.to !== 'allies')),
  );
  if (controls) return 'control';
  if (skill.category === 'support') return 'support';
  if (AREA.has(skill.target ?? '')) return 'area';
  return 'single';
}

/** Scores of docs/animation/vfx3d/SCORES.md: the score column is found by its header ("Tự chấm" or "Điểm"); the last numeric row of an id wins. */
export function parseScores(markdown: string): Map<string, number> {
  const scores = new Map<string, number>();
  let col = -1;
  let inTable = false;
  for (const line of markdown.split(/\r?\n/)) {
    if (!line.trim().startsWith('|')) {
      inTable = false;
      col = -1;
      continue;
    }
    const cells = line.trim().replace(/^\||\|$/g, '').split('|').map((c) => c.trim());
    if (!inTable) {
      inTable = true;
      col = cells.findIndex((c) => c.includes('Tự chấm') || c.includes('Điểm'));
      continue;
    }
    if (col < 0 || cells.every((c) => /^:?-+:?$/.test(c))) continue;
    const text = (cells[col] ?? '').replace(/\*\*/g, '').replace(/~/g, '').replace(',', '.').trim();
    if (!/^\d+(?:\.\d+)?$/.test(text)) continue;
    // Only ids in the cells before the score column count (the name cell, never a note).
    for (const m of cells.slice(0, col).join(' ').matchAll(/`(skill_[a-z0-9_]+)`/g)) scores.set(m[1]!, Number(text));
  }
  return scores;
}

export interface ElementRow {
  element: string;
  total: number;
  byType: Record<string, number>;
  byRole: Record<Role, number>;
  byTier: Record<Tier, number>;
  scoreMin: number | null;
  scoreAvg: number | null;
  scoreMax: number | null;
}
export interface AuditResult {
  rows: ElementRow[];
  total: ElementRow;
  elementGaps: { element: string; players: number }[];
  roleGaps: { element: string; role: Role }[];
  missingScores: string[];
  min: number;
}

const round1 = (n: number) => Math.round(n * 10) / 10;
const emptyRow = (element: string): ElementRow => ({
  element,
  total: 0,
  byType: Object.fromEntries(TYPES.map((t) => [t, 0])),
  byRole: { single: 0, area: 0, support: 0, control: 0, ultimate: 0 },
  byTier: { 0: 0, 1: 0, 2: 0, 3: 0, 4: 0 },
  scoreMin: null,
  scoreAvg: null,
  scoreMax: null,
});

function fillScores(row: ElementRow, values: number[]): void {
  if (!values.length) return;
  row.scoreMin = round1(Math.min(...values));
  row.scoreMax = round1(Math.max(...values));
  row.scoreAvg = round1(values.reduce((a, b) => a + b, 0) / values.length);
}

export function auditSkills(skills: readonly AuditedSkill[], controlStatusIds: ReadonlySet<string>, scores: ReadonlyMap<string, number>, opts: { min: number }): AuditResult {
  const rows = ELEMENT_ROWS.map(emptyRow);
  const total = emptyRow('Tổng');
  const values = new Map<string, number[]>(ELEMENT_ROWS.map((e) => [e, []]));
  const allValues: number[] = [];
  const playerRole = new Map<string, number>();
  const players = new Map<string, number>();
  const missingScores: string[] = [];

  for (const s of skills) {
    const el = s.element ?? '—';
    const row = rows.find((r) => r.element === el);
    if (!row) continue;
    const role = skillRole(s, controlStatusIds);
    const tier = expectedTier(s);
    for (const r of [row, total]) {
      r.total++;
      r.byType[s.type] = (r.byType[s.type] ?? 0) + 1;
      r.byRole[role]++;
      r.byTier[tier]++;
    }
    const score = scores.get(s.id);
    if (score === undefined) missingScores.push(s.id);
    else {
      values.get(el)!.push(score);
      allValues.push(score);
    }
    if (s.type !== 'enemy') {
      players.set(el, (players.get(el) ?? 0) + 1);
      playerRole.set(`${el}|${role}`, (playerRole.get(`${el}|${role}`) ?? 0) + 1);
    }
  }
  for (const r of rows) fillScores(r, values.get(r.element)!);
  fillScores(total, allValues);

  const elementGaps = PLAYER_ELEMENTS.map((element) => ({ element, players: players.get(element) ?? 0 })).filter((g) => g.players < opts.min);
  const roleGaps = PLAYER_ELEMENTS.flatMap((element) => ROLES.filter((role) => !playerRole.get(`${element}|${role}`)).map((role) => ({ element, role })));
  return { rows, total, elementGaps, roleGaps, missingScores, min: opts.min };
}

const fmt = (n: number | null) => (n === null ? '-' : String(n));

/** The census as Vietnamese markdown tables. */
export function renderMarkdown(r: AuditResult): string {
  const all = [...r.rows, r.total];
  const tiers = [0, 1, 2, 3, 4] as const;
  const out: string[] = [];
  out.push(`| Hệ | Tổng | ${TYPES.join(' | ')} | ${ROLES.join(' | ')} | B0 | B1 | B2 | B3 | B4 | Min | TB | Max |`);
  out.push(`|${'---|'.repeat(2 + TYPES.length + ROLES.length + tiers.length + 3)}`);
  for (const x of all) {
    const cells = [x.element, x.total, ...TYPES.map((t) => x.byType[t]), ...ROLES.map((k) => x.byRole[k]), ...tiers.map((t) => x.byTier[t]), fmt(x.scoreMin), fmt(x.scoreAvg), fmt(x.scoreMax)];
    out.push(`| ${cells.join(' | ')} |`);
  }
  out.push('', `Khoảng trống (skill người chơi, ngưỡng ${r.min} mỗi hệ):`);
  out.push(r.elementGaps.length ? r.elementGaps.map((g) => `- Hệ ${g.element}: ${g.players}/${r.min}`).join('\n') : '- Không có hệ nào thiếu.');
  out.push('', 'Ô hệ × vai bằng 0 (skill người chơi):');
  out.push(r.roleGaps.length ? r.roleGaps.map((g) => `- ${g.element} × ${g.role}`).join('\n') : '- Không có.');
  out.push('', 'Skill thiếu điểm:');
  out.push(r.missingScores.length ? r.missingScores.map((id) => `- ${id}`).join('\n') : '- Không có.');
  return out.join('\n');
}
