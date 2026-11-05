// `npm run anim:audit [-- --check]`: the data audit of every skill's battle script (lib/scriptAudit.ts), read from content and the
// asset manifest. Writes docs/animation-review/audit/inventory.json (machine) and AUDIT.md (people). Read-only on content; no browser.
// `--check` writes nothing and fails when the files on disk are not what the audit gives now (stale report).
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { audit, SHARED_LIMIT, type AuditAct, type AuditReport, type AuditSkill } from './lib/scriptAudit';
import { ROOT } from './lib/stamp';

const read = <T>(p: string): T => JSON.parse(readFileSync(join(ROOT, p), 'utf8')) as T;
const fx = read<{ skills: Record<string, { script?: AuditAct[] }> }>('content/adventure/battle_fx.json');
const skills = read<{ skills: AuditSkill[] }>('content/adventure/skills.json').skills;
const manifest = read<{ fx: { id: string; frames?: { count: number } }[] }>('public/assets/manifest/assets.json');
const frames: Record<string, number> = {};
for (const a of manifest.fx) if (a.frames) frames[a.id] = a.frames.count;

const report = audit({ skills, scripts: Object.fromEntries(Object.entries(fx.skills).map(([k, v]) => [k, v.script])), frames });

const FLAG_VI: Readonly<Record<string, string>> = {
  STATIC_HERO: 'hình chủ đạo là ảnh tĩnh chỉ được di chuyển / phóng / xoay',
  STATIC_SHARE: '> 30% diện tích hình vẽ là ảnh tĩnh',
  IMPACT_UNDER_TIER: 'tác động (hit-stop / rung / chớp) thấp hơn bậc sức mạnh ≥ 2 bậc',
  IMPACT_OVER_TIER: 'tác động cao hơn bậc sức mạnh ≥ 2 bậc',
  NO_PREPARATION: 'không có lấy đà của người ra đòn trước va chạm',
  NO_AFTERMATH: 'không có dư âm sau va chạm (hạt, vết, khói)',
  FEW_LAYERS: 'ít lớp hơn mức tối thiểu theo bậc',
  DURATION_OVER: 'dài hơn ngân sách thời gian',
  DURATION_UNDER: 'ngắn hơn ngân sách thời gian',
  SHARED_FLIPBOOK_HERO: `hình chủ đạo là flipbook dùng chung > ${SHARED_LIMIT} skill`,
  NO_SCRIPT: 'không có kịch bản',
};

/** Whether a skill already has its animation scenario (docs/animation/library/scenarios/skills/<id>.md, decision 049). */
const hasScenario = (id: string) => existsSync(join(ROOT, 'docs/animation/library/scenarios/skills', `${id}.md`));

function markdown(r: AuditReport): string {
  const L: string[] = ['# AUDIT kịch bản animation (dữ liệu)', ''];
  const written = r.skills.filter((s) => hasScenario(s.id)).length;
  L.push('Sinh bằng `npm run anim:audit` từ `content/adventure/battle_fx.json`, `skills.json`, manifest asset. **Không sửa tay.** Cách đọc và ngưỡng: [README.md](README.md). Cờ là gợi ý cho reviewer, không phải điểm.', '');
  L.push(`**Kịch bản animation** (\`docs/animation/library/scenarios/\`): ${written}/${r.skills.length} skill đã có.`, '');
  L.push('## Theo hệ', '', '| hệ | skill | ưu tiên TB | hình chủ đạo tĩnh | tác động dưới bậc | cờ hay gặp |', '|---|---|---|---|---|---|');
  for (const [e, x] of Object.entries(r.byElement).sort((a, b) => b[1].meanPriority - a[1].meanPriority)) {
    const top = Object.entries(x.flags).sort((a, b) => b[1] - a[1]).slice(0, 3).map(([f, n]) => `${f} ×${n}`).join(', ');
    L.push(`| ${e} | ${x.skills} | ${x.meanPriority} | ${x.staticHero} | ${x.impactUnder} | ${top} |`);
  }
  L.push('', '## Flipbook dùng nhiều', '', '| ảnh | số skill |', '|---|---|');
  for (const [img, ids] of Object.entries(r.flipbookUse).sort((a, b) => b[1].length - a[1].length)) L.push(`| \`${img}\` | ${ids.length} |`);
  L.push('', '## Mọi skill (ưu tiên cao trước)', '', '| skill | loại | hệ | power | bậc cần / có | ms | ảnh tĩnh | hình chủ đạo | lớp | cờ | ưu tiên | kịch bản |', '|---|---|---|---|---|---|---|---|---|---|---|---|');
  for (const s of r.skills) {
    const hero = s.hero ? `${s.hero.do}${s.hero.img ? ` \`${s.hero.img}\`` : ''} (${s.hero.liveness})` : '-';
    L.push(`| \`${s.id}\` | ${s.type} | ${s.element} | ${s.power} | T${s.tier.expected} / T${s.tier.actual} | ${s.durationMs} | ${Math.round(s.staticShare * 100)}% | ${hero} | ${s.layers.length} | ${s.flags.join(', ')} | ${s.priority} | ${hasScenario(s.id) ? `[có](../../animation/library/scenarios/skills/${s.id}.md)` : '–'} |`);
  }
  L.push('', '## Nghĩa của cờ', '', ...Object.entries(FLAG_VI).map(([f, t]) => `- \`${f}\`: ${t}`), '');
  return L.join('\n');
}

const dir = join(ROOT, 'docs/animation-review/audit');
const outJson = JSON.stringify(report, null, 2) + '\n';
const outMd = markdown(report);
if (process.argv.includes('--check')) {
  const same = (p: string, s: string) => existsSync(p) && readFileSync(p, 'utf8') === s;
  const ok = same(join(dir, 'inventory.json'), outJson) && same(join(dir, 'AUDIT.md'), outMd);
  console.log(ok ? 'audit up to date' : 'audit is stale: run npm run anim:audit');
  process.exitCode = ok ? 0 : 1;
} else {
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, 'inventory.json'), outJson);
  writeFileSync(join(dir, 'AUDIT.md'), outMd);
  const flagged = report.skills.filter((s) => s.flags.length > 0).length;
  console.log(`${report.skills.length} skills audited, ${flagged} with flags -> docs/animation-review/audit/`);
}
