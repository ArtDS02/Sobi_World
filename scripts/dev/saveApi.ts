// `npm run dev` (browser) plays the same save file as `npm run dev:desktop` (DECISIONS AM-1): a
// dev-only Vite plugin (`apply: 'serve'`) that serves %APPDATA%\Un In Homemade Dev\saves through the
// very module Electron uses (electron/saveFiles.ts). Never part of a build: the shipped game has no
// server and reads its save through Electron IPC only.
import type { IncomingMessage, ServerResponse } from 'node:http';
import { homedir } from 'node:os';
import { join } from 'node:path';
import type { Plugin } from 'vite';
import { devUserDataDir } from '../../electron/dataDir';
import { createSaveFiles, SAVE_CHANGED_EXTERNALLY } from '../../electron/saveFiles';
import type { SaveCandidateSource } from '../../src/platform/desktop/bridge';
import { DEV_SAVE_EVENT, DEV_SAVE_META, DEV_SAVE_ROUTE } from '../../src/platform/web/devSaveApi';

/** saves/ of the dev farm (UNIN_USER_DATA overrides, like the Electron main process). */
export const devSavesDir = () =>
  join(
    devUserDataDir(process.env.APPDATA ?? join(homedir(), 'AppData', 'Roaming'), process.env.UNIN_USER_DATA),
    'saves',
  );

function readBody(req: IncomingMessage): Promise<Record<string, unknown>> {
  return new Promise((resolve, reject) => {
    let text = '';
    req.setEncoding('utf8');
    req.on('data', (c: string) => (text += c));
    req.on('end', () => {
      try {
        resolve(text ? (JSON.parse(text) as Record<string, unknown>) : {});
      } catch (e) {
        reject(e as Error);
      }
    });
    req.on('error', reject);
  });
}

function send(res: ServerResponse, status: number, payload: unknown) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.end(JSON.stringify(payload ?? null));
}

export function devSaveApi(dir = devSavesDir()): Plugin {
  const saves = createSaveFiles({ dir, now: Date.now });
  const routes: Record<string, (b: Record<string, unknown>) => Promise<unknown>> = {
    'GET load': () => saves.readCandidates(),
    'POST write': (b) => saves.write(String(b.json)),
    'POST markCorrupt': (b) => saves.markCorrupt(b.source as SaveCandidateSource),
    'GET backups': () => saves.listBackups(),
    'POST restore': (b) => saves.restoreBackup(String(b.name)),
    'POST backupBeforeReset': () => saves.backupBeforeReset(),
  };
  return {
    name: 'unin-dev-saves',
    apply: (_config, env) => env.command === 'serve' && !process.env.VITEST, // not in tests
    transformIndexHtml: () => [{ tag: 'meta', attrs: { name: DEV_SAVE_META, content: dir }, injectTo: 'head' }],
    async configureServer(server) {
      const stop = await saves.watch(() => server.ws.send({ type: 'custom', event: DEV_SAVE_EVENT }));
      server.httpServer?.once('close', stop);
      server.middlewares.use(DEV_SAVE_ROUTE, (req, res) => {
        const route = routes[`${req.method} ${(req.url ?? '').replace(/^\//, '').split('?')[0]}`];
        if (!route) return send(res, 404, { error: 'not found' });
        void (req.method === 'POST' ? readBody(req) : Promise.resolve({}))
          .then(route)
          .then(
            (r) => send(res, 200, r),
            (e: Error) => send(res, e.message.includes(SAVE_CHANGED_EXTERNALLY) ? 409 : 500, { error: e.message }),
          );
      });
    },
  };
}
