// npm run rig:snap <rig> <clip> [frames] — the puppet's frames as data for scripts/rig/snap.py (decision 050): the same runtime as
// the game (Performer → solve → skin), sampled at even times through one play of the clip, written to art_inbox/.qa/rig_<rig>_<clip>.json.
// snap.py draws them (skin grid warped triangle by triangle, parts on top) into a strip PNG next to it, at full resolution.
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { buildSkin, deformSkin, Performer, RIGS } from '../../src/systems/animation';

const [rigId, clipName = 'idle', framesArg = '8'] = process.argv.slice(2);
const rig = rigId ? RIGS.get(rigId) : undefined;
if (!rig || !rig.clips[clipName]) {
  console.error(`usage: rig:snap <${[...RIGS.keys()].join('|')}> <clip> [frames]`);
  process.exit(1);
}
const frames = Number(framesArg);
const clip = rig.clips[clipName]!;
const len = clip.len / rig.feel.tempo;
const mesh = buildSkin(rig);
const out: unknown[] = [];
for (let k = 0; k < frames; k++) {
  // A fresh performer per frame, played from its start: idle first (so the crossfade starts from rest), then the clip.
  const p = new Performer(rig, 'snap');
  const at = (len * k) / Math.max(1, frames - 1);
  for (let t = 0; t <= 600; t += 1000 / 60) p.update(t, { action: 'idle' });
  let f = p.update(600, { action: clipName, key: 'snap' });
  for (let t = 600; t <= 600 + at; t += 1000 / 60) f = p.update(t, { action: clipName, key: 'snap' });
  const skin = mesh ? Array.from(deformSkin(mesh, f.worlds, f.chains, new Float32Array(mesh.rest.length)), (v) => Math.round(v * 100) / 100) : null;
  out.push({ t: Math.round(at), clip: f.clip, skin, drawn: f.drawn });
}
const dir = join(process.cwd(), 'art_inbox/.qa');
mkdirSync(dir, { recursive: true });
const file = join(dir, `rig_${rigId}_${clipName}.json`);
writeFileSync(file, JSON.stringify({ rig: rigId, clip: clipName, res: rig.res, parts: rig.parts, skin: rig.skin ?? null, grid: mesh ? [mesh.cols, mesh.rows] : null, frames: out }));
console.log(file);
