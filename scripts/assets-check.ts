// npm run assets:check — part of npm run check (art standard §7.4, spec §14.9).
// npm run assets:release — also fails while any manifest row is still `placeholder` (spec §15
// Phase 4: every v1-scope row production or final; the manifest holds only v1 scope, waves 0–2).
import { readFileSync } from 'node:fs';
import { checkAssets } from './assets/check';

const errors = checkAssets('public/assets');
if (errors.length > 0) {
  for (const e of errors) console.error(`  ${e}`);
  console.error(`\nassets:check failed — ${errors.length} problem(s)`);
  process.exit(1);
}

if (process.argv.includes('--release')) {
  const manifest = JSON.parse(readFileSync('public/assets/manifest/assets.json', 'utf8')) as Record<
    string,
    unknown
  >;
  const rows = Object.values(manifest).flatMap((v) =>
    Array.isArray(v) ? (v as { id: string; status: string; kind?: string; credit?: string }[]) : [],
  );
  const placeholders = rows.filter((r) => r.status === 'placeholder').map((r) => r.id);
  const uncredited = rows.filter((r) => r.kind && !r.credit).map((r) => r.id); // audio rows
  if (placeholders.length > 0 || uncredited.length > 0) {
    if (placeholders.length > 0) {
      console.error(`placeholder (${placeholders.length}): ${placeholders.join(', ')}`);
    }
    if (uncredited.length > 0) {
      console.error(`audio without credit (${uncredited.length}): ${uncredited.join(', ')}`);
    }
    console.error('\nassets:release failed — run the ART tasks first');
    process.exit(1);
  }
  console.log('assets:release OK — every row is production or final, audio credited');
} else {
  console.log('assets:check OK');
}
