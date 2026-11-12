// Writes docs/handover/VFX3D_SKILL_INVENTORY.md: every skill with its description, numbers, impact tier and the 3D effect it uses now.
// `npx tsx scripts/animation/skillInventory.ts`. The table is a generated view; the data stays in content/adventure/*.json.
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';

type Skill = { id: string; nameVi: string; descVi: string; type: string; category: string; element: string | null; target: string; power: number; hits?: number; mpCost: number; cooldown: number; effects?: { kind: string; status?: string; pct?: number; chance?: number; turns?: number; to?: string; count?: number; amount?: number }[] };
type Act = { do: string; fx?: string; color?: string; at?: number; dur?: number; who?: string };
const skills = (JSON.parse(readFileSync('content/adventure/skills.json', 'utf8')) as { skills: Skill[] }).skills;
const fx = (JSON.parse(readFileSync('content/adventure/battle_fx.json', 'utf8')) as { skills: Record<string, { timing: { release: number; impact: number; end: number }; script: Act[] }> }).skills;

const tier = (s: Skill) => (s.type === 'ultimate' ? 'T4' : s.power === 0 ? 'T0' : s.power < 0.9 ? 'T1' : s.power < 1.4 ? 'T2' : 'T3');
const eff = (s: Skill) =>
  (s.effects ?? [])
    .map((e) => {
      const to = e.to ? `→${e.to}` : '';
      if (e.kind === 'status') return `${e.status}${e.chance ? ` ${Math.round(e.chance * 100)}%` : ''}${e.turns ? ` ${e.turns}l` : ''}${to}`;
      if (e.kind === 'heal' || e.kind === 'shield') return `${e.kind} ${Math.round((e.pct ?? 0) * 100)}%${to}`;
      if (e.kind === 'mp') return `mp ${e.amount}${to}`;
      return `${e.kind}${e.count ? ' ' + e.count : ''}${to}`;
    })
    .join(', ') || '—';
const order = ['WATER', 'FIRE', 'NATURE', 'EARTH', 'METAL', 'LIGHTNING', 'LIGHT', 'DARK', 'VOID', 'SELF', '-'];
const group = (s: Skill) => (s.element ?? '-');
const sorted = [...skills].sort((a, b) => order.indexOf(group(a)) - order.indexOf(group(b)) || a.type.localeCompare(b.type) || a.id.localeCompare(b.id));

const lines: string[] = [];
lines.push('# Danh mục skill cho việc làm animation 3D (sinh tự động)', '');
lines.push('Sinh bằng `npx tsx scripts/animation/skillInventory.ts`; **đừng sửa tay**. Dữ liệu gốc: `content/adventure/skills.json`, `battle_fx.json`.', '');
lines.push('`Bậc` suy từ `power`: T0 hỗ trợ · T1 < 0,9 · T2 < 1,4 · T3 ≥ 1,4 · T4 tuyệt kỹ (chuẩn: `docs/animation/library/STANDARDS.md` §4). `3D hiện tại` = act `vfx3d` đang dùng (prototype, decision 059).', '');
lines.push(`Tổng: ${skills.length} skill.`, '');
let cur = '';
for (const s of sorted) {
  if (group(s) !== cur) {
    cur = group(s);
    lines.push('', `## ${cur === '-' ? 'Không hệ (hỗ trợ)' : cur === 'SELF' ? 'SELF (hệ của người tung)' : cur}`, '', '| id | Tên | Loại | Đích | Bậc | MP/CD | Hiệu quả | Mô tả (descVi) | 3D hiện tại | Kết thúc (ms) |', '|---|---|---|---|---|---|---|---|---|---|');
  }
  const f = fx[s.id];
  const v = f?.script.find((a) => a.do === 'vfx3d');
  lines.push(`| \`${s.id}\` | ${s.nameVi} | ${s.type} | ${s.target}${s.hits && s.hits > 1 ? ` ×${s.hits}` : ''} | ${tier(s)} | ${s.mpCost}/${s.cooldown} | ${eff(s)} | ${s.descVi} | ${v ? `\`${v.fx}\`${v.color ? ' ' + v.color : ''}` : '—'} | ${f ? f.timing.end : '—'} |`);
}
lines.push('');
mkdirSync('docs/handover', { recursive: true });
writeFileSync('docs/handover/VFX3D_SKILL_INVENTORY.md', lines.join('\n'), 'utf8');
console.log(`wrote docs/handover/VFX3D_SKILL_INVENTORY.md (${skills.length} skills)`);
