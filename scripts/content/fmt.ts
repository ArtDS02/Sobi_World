// npm run content:fmt: rewrites every content JSON file in the stable layout (the one the Admin writes), so a hand edit is a clean diff.
import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { contentJson } from './format';

for (const dir of readdirSync('content', { withFileTypes: true }).filter((d) => d.isDirectory() && d.name !== 'schemas')) {
  for (const f of readdirSync(`content/${dir.name}`).filter((n) => n.endsWith('.json'))) {
    const file = `content/${dir.name}/${f}`;
    const before = readFileSync(file, 'utf8').replace(/\r\n/g, '\n');
    const after = contentJson(JSON.parse(before));
    if (after !== before) {
      writeFileSync(file, after);
      console.log(`formatted ${file}`);
    }
  }
}
