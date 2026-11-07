// Locate Unity.exe and run the studio project in batch mode.
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
import { STUDIO, StudioError } from './recipes.ts';

export function projectVersion(): string {
  const txt = readFileSync(join(STUDIO, 'ProjectSettings', 'ProjectVersion.txt'), 'utf8');
  const m = /m_EditorVersion:\s*(\S+)/.exec(txt);
  if (!m) throw new StudioError('studio/ProjectSettings/ProjectVersion.txt has no editor version');
  return m[1]!;
}

/** studio/studio.local.json { "unity": "<path>" } > SOBI_UNITY > Unity Hub default folder. */
export function findUnity(): string {
  const local = join(STUDIO, 'studio.local.json');
  if (existsSync(local)) {
    const cfg = JSON.parse(readFileSync(local, 'utf8')) as { unity?: string };
    if (cfg.unity && existsSync(cfg.unity)) return cfg.unity;
  }
  const env = process.env.SOBI_UNITY;
  if (env && existsSync(env)) return env;
  const hub = 'C:\\Program Files\\Unity\\Hub\\Editor';
  const want = projectVersion();
  const exact = join(hub, want, 'Editor', 'Unity.exe');
  if (existsSync(exact)) return exact;
  if (existsSync(hub)) {
    const found = readdirSync(hub)
      .map((v) => join(hub, v, 'Editor', 'Unity.exe'))
      .filter((p) => existsSync(p));
    if (found.length) {
      console.warn(`[studio] Unity ${want} not found, using ${found[0]}`);
      return found[0]!;
    }
  }
  throw new StudioError(
    'Unity.exe not found: install Unity 6 LTS via Unity Hub (docs/UNITY_STUDIO_PLAN.md §5) or set studio/studio.local.json',
  );
}

export function runUnity(args: string[], logFile: string): void {
  const exe = findUnity();
  const res = spawnSync(
    exe,
    [
      '-batchmode',
      '-quit',
      '-projectPath',
      STUDIO,
      '-executeMethod',
      'Sobi.Studio.Cli.Run',
      '-logFile',
      logFile,
      '--',
      ...args,
    ],
    { stdio: 'inherit', windowsHide: true },
  );
  const log = existsSync(logFile) ? readFileSync(logFile, 'utf8') : '';
  const lines = log.split(/\r?\n/).filter((l) => l.includes('[studio]') || /error CS\d+/.test(l));
  for (const l of lines) console.log(l.trim());
  if (/another Unity instance is running|It looks like another Unity instance/i.test(log))
    throw new StudioError('the studio project is open in the Unity Editor: close it and run again');
  if (
    /No valid Unity Editor license|license is not valid|LicensingClient has failed.*entitlement/i.test(
      log,
    ) &&
    res.status !== 0
  )
    throw new StudioError(
      'Unity has no active license: activate Unity Personal in Unity Hub (plan §5)',
    );
  if (res.status !== 0 || !log.includes('[studio] done'))
    throw new StudioError(`Unity failed (exit ${res.status}); see ${logFile}`);
}
