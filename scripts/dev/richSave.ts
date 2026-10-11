// npm run dev:rich-save -- [folder] [days] [seed] (GĐ13): writes a late-game save (a bot has played `days` days, ending now)
// into <folder>/saves/save.json, so every Area is open for a hands-on look. The folder is the one `npm run dev:sandbox` uses
// (%TEMP%\sobiworld-sandbox) unless SOBIWORLD_SANDBOX or the first argument says otherwise.
import { mkdirSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { DAY_MS } from '../../src/core/clock';
import { simulateWeek } from '../economy/week';

const folder = process.argv[2] ?? process.env.SOBIWORLD_SANDBOX ?? join(tmpdir(), 'sobiworld-sandbox');
const days = Number(process.argv[3] ?? 45);
const seed = Number(process.argv[4] ?? 7);
const start = Math.floor((Date.now() - days * DAY_MS) / DAY_MS) * DAY_MS;
const report = simulateWeek(seed, start, days, { forceAdventure: true });
const world = { ...report.world, settings: { ...report.world.settings, tutorialDone: true } };
mkdirSync(join(folder, 'saves'), { recursive: true });
writeFileSync(join(folder, 'saves', 'save.json'), JSON.stringify(world));
console.log(`wrote ${join(folder, 'saves', 'save.json')}: ${days} days, level ${report.days.at(-1)?.level}, Areas ${Object.keys(world.areas).join(', ')}`);
