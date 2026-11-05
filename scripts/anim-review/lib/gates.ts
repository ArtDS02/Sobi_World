// The two gates every run passes before anything is handed to the Technical Director (ANTI_CACHE A7, A8).
import { createHash } from 'node:crypto';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import type { Browser } from '@playwright/test';
import { gateCase } from './cases';
import { decode, diff } from './png';
import { frameAt, openLab, prepare, type LabCase } from './session';
import { ROOT, sha1, type SourceRow } from './stamp';

export interface CanaryResult {
  result: 'pass' | 'fail';
  checked: { file: string; disk: string; served: string }[];
}
export interface DeterminismResult {
  result: 'pass' | 'fail';
  case: string;
  frames: number;
  maxPixelDiff: number;
}

/** The files the canary compares: the lab's content, the stage code, whatever changed since the last run, and a few pictures. */
function canaryFiles(sources: readonly SourceRow[]): string[] {
  const always = ['content/adventure/battle_fx.json', 'src/areas/adventure/scene/battle/BattleScene.ts', 'tools/admin/battleLab.ts'];
  const changed = sources.filter((s) => s.changedSincePrevRun && /^(src|content)\//.test(s.file)).map((s) => s.file);
  return [...new Set([...always, ...changed])].slice(0, 16);
}

/** Served == disk (what the page really receives, with the browser cache bypassed). */
export async function canary(browser: Browser, base: string, runId: string, sources: readonly SourceRow[]): Promise<CanaryResult> {
  const lab = await openLab(browser, base, runId);
  try {
    const checked: CanaryResult['checked'] = [];
    for (const file of canaryFiles(sources)) {
      const disk = sha1(readFileSync(join(ROOT, file)));
      const text = (await lab.page.evaluate(`fetch(${JSON.stringify(`/${file}?raw&t=${Date.now()}`)}, { cache: 'no-store' }).then((r) => r.text())`)) as string;
      const m = /^export default ([\s\S]*?);?\s*$/.exec(text);
      // Vite answers `?raw` with a JS module for code files but with the bare file for JSON.
      let served = text.startsWith('export default ') ? 'unparsed' : sha1(text);
      if (m && served === 'unparsed') {
        try {
          served = sha1(JSON.parse(m[1]!) as string);
        } catch {
          served = 'unparsed';
        }
      }
      checked.push({ file, disk, served });
    }
    // A few pictures the stage draws (public/assets is served as /assets).
    for (const file of ['public/assets/props/chr_so_down_idle.png']) {
      if (!existsSync(join(ROOT, file))) continue;
      const disk = sha1(readFileSync(join(ROOT, file)));
      const served = (await lab.page.evaluate(
        `fetch(${JSON.stringify(`/${file.replace('public/', '')}?t=${Date.now()}`)}, { cache: 'no-store' }).then((r) => r.arrayBuffer()).then((b) => crypto.subtle.digest('SHA-1', b)).then((d) => [...new Uint8Array(d)].map((x) => x.toString(16).padStart(2, '0')).join(''))`,
      )) as string;
      checked.push({ file, disk, served });
    }
    return { result: checked.every((c) => c.disk === c.served) ? 'pass' : 'fail', checked };
  } finally {
    await lab.context.close();
  }
}

/** The same case in two fresh contexts must give the same pixels at the same moments. */
export async function determinism(browser: Browser, base: string, runId: string, probe?: LabCase): Promise<DeterminismResult> {
  const sets: Buffer[][] = [];
  let name = '';
  for (let run = 0; run < 2; run++) {
    const lab = await openLab(browser, base, runId);
    try {
      const c = probe ?? (await gateCase(lab.page));
      name = c.caseId;
      const info = await prepare(lab, c);
      const b = info.beats[0]!;
      const cur = { t: 0 };
      const frames: Buffer[] = [];
      for (const t of [b.start + 100, b.cast + 60, b.release, b.impact, b.impact + 120, b.impact + 400]) frames.push(await frameAt(lab, info, Math.max(0, t), cur));
      sets.push(frames);
    } finally {
      await lab.context.close();
    }
  }
  let worst = 0;
  sets[0]!.forEach((buf, i) => {
    const d = diff(decode(buf), decode(sets[1]![i]!), 0);
    worst = Math.max(worst, d.changed);
  });
  return { result: worst === 0 ? 'pass' : 'fail', case: name, frames: sets[0]!.length, maxPixelDiff: worst };
}

export const digest = (s: string) => createHash('sha1').update(s).digest('hex');
