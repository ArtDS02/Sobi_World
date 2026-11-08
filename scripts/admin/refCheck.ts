// Reference check (plan 8.7) from the command line: id-shaped strings in content/ that point at no row.
// Usage: npx tsx scripts/admin/refCheck.ts   (exit 1 when something is broken)
import { readContent } from './contentFiles';
import { CONTENT_FILES } from './contentCatalog';
import { brokenRefs, type Files } from '../../tools/admin/refs';

const files: Files = Object.fromEntries(CONTENT_FILES.map((f) => [f.file, readContent(f.file)]));
const broken = brokenRefs(files);
for (const b of broken) console.log(`${b.file}: ${b.path} → ${b.value}`);
console.log(`ref check: ${broken.length} broken references in ${Object.keys(files).length} files`);
if (broken.length) process.exit(1);
