// `npm run content:ids`: rewrites content/schemas/ids.generated.ts from the content files.
import { writeFileSync } from 'node:fs';
import { IDS_FILE, idsText } from './ids';

writeFileSync(IDS_FILE, idsText());
console.log(`${IDS_FILE} written`);
