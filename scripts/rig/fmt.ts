// npm run rig:fmt — rewrites content/anim/rigs/*.json in the house layout (short arrays on one line) after a hand or tool edit.
import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { rigText } from './rigText';

const dir = join(process.cwd(), 'content/anim/rigs');
for (const f of readdirSync(dir).filter((n) => n.endsWith('.json'))) writeFileSync(join(dir, f), rigText(JSON.parse(readFileSync(join(dir, f), 'utf8'))));
