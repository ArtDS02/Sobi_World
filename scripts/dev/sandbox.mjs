// `npm run dev:sandbox`: the browser dev server on a throw-away data folder, so a test run never touches the
// dev farm in %APPDATA%\SobiWorld Dev. The folder is %TEMP%\sobiworld-sandbox (or SOBIWORLD_SANDBOX); put a
// save.json in its saves\ folder first to start from a prepared world.
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createServer } from 'vite';

process.env.UNIN_USER_DATA = process.env.SOBIWORLD_SANDBOX || join(tmpdir(), 'sobiworld-sandbox');
const port = Number(process.env.PORT ?? 5181);
const server = await createServer({ server: { port, strictPort: true } });
await server.listen();
server.printUrls();
