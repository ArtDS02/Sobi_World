// Checks docs/animation/new_skills.draft.json against the real skill schema and the game's existing ids (nothing is applied):
// `npx tsx scripts/animation/checkNewSkills.ts`. Prints one line per skill and exits 1 on any problem.
import { readFileSync } from 'node:fs';
import { skillSchema } from '../../content/schemas/adventure/skills';

const draft = JSON.parse(readFileSync('docs/animation/new_skills.draft.json', 'utf8')) as { enemy: unknown[]; player: unknown[] };
const existing = new Set((JSON.parse(readFileSync('content/adventure/skills.json', 'utf8')) as { skills: { id: string }[] }).skills.map((s) => s.id));
let bad = 0;
const seen = new Set<string>();
for (const [group, rows] of Object.entries({ enemy: draft.enemy, player: draft.player })) {
  for (const row of rows) {
    const r = skillSchema.safeParse(row);
    const id = (row as { id?: string }).id ?? '?';
    const problems: string[] = [];
    if (!r.success) problems.push(r.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; '));
    if (existing.has(id)) problems.push('id already in skills.json');
    if (seen.has(id)) problems.push('duplicate id in the draft');
    seen.add(id);
    if (group === 'enemy' && (row as { type?: string }).type !== 'enemy') problems.push('enemy group needs type enemy');
    if (group === 'player' && (row as { type?: string }).type !== 'unique') problems.push('player group needs type unique');
    if (problems.length) bad++;
    console.log(`${problems.length ? 'BAD' : 'ok '} ${group} ${id}${problems.length ? ' — ' + problems.join(' | ') : ''}`);
  }
}
console.log(bad === 0 ? `all ${seen.size} draft skills valid` : `${bad} problem(s)`);
process.exit(bad === 0 ? 0 : 1);
