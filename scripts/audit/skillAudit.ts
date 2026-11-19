// Skill census CLI: counts of the skills by element, type, role and tier, their scores, and the gaps. Usage: npm run skill:audit [-- --min N] [--json]
import { readFileSync } from 'node:fs';
import { auditSkills, parseScores, renderMarkdown, type AuditedSkill } from './skillAuditLib';

/** Reads the content files and returns the audit of every skill. */
export function runSkillAudit(min: number) {
  const skills = (JSON.parse(readFileSync('content/adventure/skills.json', 'utf8')) as { skills: AuditedSkill[] }).skills;
  const statuses = (JSON.parse(readFileSync('content/adventure/statuses.json', 'utf8')) as { statuses: { id: string; kind: string }[] }).statuses;
  const control = new Set(statuses.filter((s) => s.kind === 'control').map((s) => s.id));
  const scores = parseScores(readFileSync('docs/animation/vfx3d/SCORES.md', 'utf8'));
  return auditSkills(skills, control, scores, { min });
}

if (/scripts[\\/]audit[\\/]skillAudit\.ts$/.test(process.argv[1] ?? '')) {
  const args = process.argv.slice(2);
  const i = args.indexOf('--min');
  const min = i >= 0 ? Number(args[i + 1]) : 10;
  const result = runSkillAudit(Number.isFinite(min) ? min : 10);
  console.log(args.includes('--json') ? JSON.stringify(result, null, 2) : renderMarkdown(result));
}
