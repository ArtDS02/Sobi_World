// `node scripts/dev/mapPreview.mjs`: the browser dev server of the game for the Map Builder's preview (decision 047, GĐ7) — the game
// as it is, except that content/adventure/maps.json and zones.json come from the preview folder the dev API writes (the world as a
// publish would make it), on a throw-away data folder so no save of the player's is ever opened. Port 5191 (or PORT).
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { createServer } from 'vite';

const root = process.cwd();
const preview = join(root, 'tools', 'admin', 'data', 'adventure', 'preview', 'content');
const swap = new Map(['maps.json', 'zones.json'].map((f) => [resolve(root, 'content', 'adventure', f), join(preview, f)]));

process.env.UNIN_USER_DATA = process.env.SOBIWORLD_PREVIEW_DATA || join(tmpdir(), 'sobiworld-mappreview', 'data');
const port = Number(process.env.PORT ?? 5191);
const server = await createServer({
  server: { port, strictPort: true },
  plugins: [
    {
      name: 'map-builder-preview-content',
      enforce: 'pre',
      resolveId(source, importer) {
        if (!importer || !source.endsWith('.json')) return null;
        const abs = resolve(dirname(importer.split('?')[0]), source);
        return swap.get(abs) ?? null;
      },
    },
  ],
});
await server.listen();
server.printUrls();
