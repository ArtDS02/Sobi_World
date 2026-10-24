// Writes only the Adventure's synthesised sounds (scripts/art/sfx.ts) into public/assets/audio/, without regenerating every other
// asset (`npm run art:generate` writes them all into art_inbox/). Usage: npx tsx scripts/art/adventureSfx.ts
import { writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { ADVENTURE_SFX_IDS, sfxMp3 } from './sfx';

const OUT = join('public', 'assets', 'audio');
for (const id of ADVENTURE_SFX_IDS) writeFileSync(join(OUT, `${id}.mp3`), sfxMp3(id));
console.log(`adventureSfx — ${ADVENTURE_SFX_IDS.length} sounds in ${OUT}/`);
