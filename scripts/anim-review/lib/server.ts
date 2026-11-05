// A private Vite server for one capture run (ANTI_CACHE A1/A2): its own port, its own cache folder, forced dependency
// optimisation, no hot reload. It never attaches to a server that is already running (that one may serve old code).
import { mkdirSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createServer, loadConfigFromFile, mergeConfig, type ViteDevServer } from 'vite';
import { ROOT } from './stamp';

// Silences Vite's long "import without a file extension" notice about the content schemas (harmless for this harness).
process.env.VITE_CONFIG_NATIVE_IGNORE_WARNING ??= 'true';

export const PORT =Number(process.env.ANIM_PORT ?? 5195);

export interface Served {
  base: string;
  cacheDir: string;
  close: () => Promise<void>;
}

export async function startServer(runId: string, port = PORT, configFile = 'vite.admin.config.ts', hmr = false): Promise<Served> {
  const cacheDir = join(tmpdir(), `sobi-anim-vite-${runId}`);
  rmSync(cacheDir, { recursive: true, force: true });
  mkdirSync(cacheDir, { recursive: true });
  const loaded = await loadConfigFromFile({ command: 'serve', mode: 'development' }, join(ROOT, configFile));
  if (!loaded) throw new Error(`${configFile} not found`);
  const config = mergeConfig(loaded.config, {
    configFile: false,
    root: ROOT,
    cacheDir,
    clearScreen: false,
    logLevel: 'warn',
    optimizeDeps: { force: true },
    server: { port, strictPort: true, open: false, hmr, watch: { ignored: ['**/docs/animation-review/**'] } },
  });
  let server: ViteDevServer;
  try {
    server = await createServer(config);
    await server.listen();
  } catch (e) {
    throw new Error(`Cannot start the private server on port ${port} (${(e as Error).message}). A server from an earlier session may still hold the port: stop it, or set ANIM_PORT. The harness never attaches to a running server.`, { cause: e });
  }
  return {
    base: `http://localhost:${port}`,
    cacheDir,
    close: async () => {
      await server.close();
      rmSync(cacheDir, { recursive: true, force: true });
    },
  };
}
