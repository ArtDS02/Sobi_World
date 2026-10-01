// `npm run dev:desktop`: Vite dev server + Electron pointed at it (spec §13.3). The only place a
// dev port exists; the shipped app loads app://game/index.html.
import { spawn } from 'node:child_process';
import electronPath from 'electron';
import { build, createServer } from 'vite';

await build({ configFile: 'vite.electron.config.ts', logLevel: 'warn' });
const server = await createServer({ server: { port: 5174, strictPort: true } });
await server.listen();
const url = server.resolvedUrls?.local[0];
if (!url) throw new Error('Vite dev server has no local URL');

// Extra CLI args go to Electron, e.g. `npm run dev:desktop -- --remote-debugging-port=9333`.
const child = spawn(String(electronPath), ['.', ...process.argv.slice(2)], {
  stdio: 'inherit',
  env: { ...process.env, UNIN_DEV_URL: url },
});
child.on('exit', async (code) => {
  await server.close();
  process.exit(code ?? 0);
});
