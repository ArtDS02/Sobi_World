// One browser session on the private server: a fresh context (ANTI_CACHE A3), a controlled clock and a seeded random (A6), and a
// driver for the Battle Lab test hook (`window.__animLab`, tools/admin/battleLab.ts). Strings are evaluated in the page because
// the scripts' TypeScript has no DOM types.
import { chromium, type Browser, type BrowserContext, type Page } from '@playwright/test';

/** The fixed fake time the measured play starts at, so absolute-time animations (idle bobbing) begin in the same phase every run. */
const T0 = 600_000;
/** The frame step of the page's fake rAF (Playwright's fake clock fires animation frames every 16 ms). */
export const FRAME_MS = 16;

export interface LabCase {
  caseId: string;
  group: string;
  /** Fields for `__animLab.configure`. */
  config: Record<string, unknown>;
  enter?: boolean;
  /** `apply` (default): play the step; `loop`: a status that is on, left alone; `expire`: the status ends (an empty step). */
  mode?: 'apply' | 'loop' | 'expire';
}

export interface Beat {
  start: number;
  cast: number;
  release: number;
  impact: number;
  end: number;
  circle: boolean;
  skillId: string | null;
  actor: string | null;
}
export interface LabInfo {
  now: number;
  at: number;
  total: number;
  speed: number;
  beats: Beat[];
  marks: { unit: string; kind: string; id: string; at: number }[];
  reactions: { unit: string; kind: string; at: number }[];
  cues: ({ at: number; kind: string } & Record<string, unknown>)[];
}

const SEED_SCRIPT = `
  (() => {
    let s = 0x9e3779b9;
    const next = () => { s = (s + 0x6d2b79f5) | 0; let t = Math.imul(s ^ (s >>> 15), 1 | s); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
    Math.random = next;
    window.__reseed = (v) => { s = v >>> 0; };
  })();
`;

export async function openBrowser(): Promise<{ browser: Browser; gpu: string }> {
  const args = ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--disk-cache-size=1', '--media-cache-size=1', '--force-device-scale-factor=1'];
  const channel = process.env.ANIM_BROWSER ?? 'chrome';
  const choices = [channel, ...['chrome', 'msedge'].filter((c) => c !== channel)];
  let last: unknown;
  for (const c of choices) {
    try {
      return { browser: await chromium.launch({ channel: c, headless: true, args }), gpu: `swiftshader/${c}` };
    } catch (e) {
      last = e;
    }
  }
  throw new Error(`No Chrome or Edge available for Playwright: ${(last as Error).message}`);
}

export interface Lab {
  page: Page;
  context: BrowserContext;
  errors: string[];
  missing: string[];
  stage: () => Promise<Buffer>;
}

/** Opens the Battle Lab in a new context with the fake clock running naturally until `measure` pauses it. */
export async function openLab(browser: Browser, base: string, runId: string): Promise<Lab> {
  const context = await browser.newContext({ viewport: { width: 1600, height: 900 }, serviceWorkers: 'block', deviceScaleFactor: 1, reducedMotion: 'no-preference' });
  await context.clock.install({ time: 0 });
  await context.addInitScript(SEED_SCRIPT);
  const page = await context.newPage();
  const errors: string[] = [];
  const missing: string[] = [];
  page.on('pageerror', (e) => errors.push(`pageerror: ${e.message}`));
  page.on('console', (m) => {
    if (m.type() === 'error') errors.push(`console: ${m.text()}`);
  });
  page.on('response', (r) => {
    if (r.status() >= 400) missing.push(`${r.status()} ${r.url().replace(base, '')}`);
  });
  await page.goto(`${base}/admin.html?run=${encodeURIComponent(runId)}#/battle-lab`, { waitUntil: 'load' });
  await waitFor(page, 'window.__animLab && window.__animLab.ready()', 'the lab stage');
  const stageEl = page.locator('[data-stage]');
  return { page, context, errors, missing, stage: async () => stageEl.screenshot({ type: 'png', animations: 'allow', caret: 'initial' }) };
}

async function waitFor(page: Page, expr: string, what: string, timeout = 30_000) {
  try {
    await page.waitForFunction(expr, undefined, { timeout, polling: 100 });
  } catch {
    throw new Error(`Timed out waiting for ${what}`);
  }
}

export const evalIn = <T>(page: Page, expr: string): Promise<T> => page.evaluate(expr) as Promise<T>;

/**
 * Plays the case once to warm every lazily loaded picture (Phaser loads them at the cue that needs them), ends the step with an empty
 * one and waits (so nothing of the warm-up is left on the stage and every expire has played), then — with the clock frozen at a fixed
 * time and the random reseeded — runs the measured part and returns its timing. The caller advances the clock.
 * Modes: `apply` plays the step; `loop` leaves a status that is on alone; `expire` ends it.
 */
export async function prepare(lab: Lab, c: LabCase): Promise<LabInfo> {
  const { page } = lab;
  const mode = c.mode ?? 'apply';
  const play = async () => {
    await evalIn(page, `window.__animLab.play(${!!c.enter})`);
    const i = (await evalIn<LabInfo | null>(page, 'window.__animLab.info()'))!;
    await page.waitForTimeout(Math.min(9000, i.total + 900));
    return i;
  };
  const quiet = async () => {
    await evalIn(page, 'window.__animLab.idle()');
    await page.waitForTimeout(1500);
    await waitFor(page, 'window.__animLab.settled()', 'the loader to settle');
  };
  await evalIn(page, `window.__animLab.configure(${JSON.stringify(c.config)})`);
  await waitFor(page, 'window.__animLab.ready()', 'the lab stage after configure');
  // Warm-up on the natural clock: the step itself, then (for a status) its end, so every picture they ask for is in.
  await play();
  await waitFor(page, 'window.__animLab.settled()', 'the loader to settle');
  await quiet();
  if (mode !== 'apply') {
    await play();
    await quiet();
    await play();
  }
  // Measured part: frozen clock at T0, seeded random.
  await page.clock.pauseAt(T0);
  await evalIn(page, `window.__reseed(1234)`);
  await page.clock.runFor(500);
  await evalIn(page, `window.__reseed(1234)`);
  if (mode === 'apply') {
    await evalIn(page, `window.__animLab.play(${!!c.enter})`);
    return (await evalIn<LabInfo | null>(page, 'window.__animLab.info()'))!;
  }
  if (mode === 'expire') await evalIn(page, 'window.__animLab.idle()');
  const i = (await evalIn<LabInfo | null>(page, 'window.__animLab.info()'))!;
  // No step to time: the frames run from now for a fixed window (an expire is short, a loop shows a couple of its cycles).
  return { ...i, at: i.now, total: mode === 'expire' ? 900 : 2700, beats: [], marks: [], reactions: [], cues: [] };
}

/** Advances the fake clock so the step clock reads `t` ms, then returns the stage picture. */
export async function frameAt(lab: Lab, info: LabInfo, t: number, cursor: { t: number }): Promise<Buffer> {
  const want = info.at - info.now + t;
  const dt = want - cursor.t;
  if (dt > 0) await lab.page.clock.runFor(dt);
  cursor.t = Math.max(cursor.t, want);
  return lab.stage();
}
