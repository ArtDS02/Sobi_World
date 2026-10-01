// npm run assets:check — part of npm run check (art standard §7.4, spec §14.9).
import { checkAssets } from './assets/check';

const errors = checkAssets('public/assets');
if (errors.length > 0) {
  for (const e of errors) console.error(`  ${e}`);
  console.error(`\nassets:check failed — ${errors.length} problem(s)`);
  process.exit(1);
}
console.log('assets:check OK');
