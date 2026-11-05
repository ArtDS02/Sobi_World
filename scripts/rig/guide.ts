// npm run rig:guide [rig…] — the layout guide of a puppet's layers for the artist (decision 050): the rig-proof parts in their canvas
// (face slots at rest; chain strips where they are drawn), every joint as a dot with its bone name, the ground line and the frame of
// the 512 canvas. Written to art_inbox/rig_<rig>_guide.png, next to the request art_inbox/rig_<rig>.md.
import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { Resvg } from '@resvg/resvg-js';

const root = process.cwd();
const ORIGIN = { x: 256, y: 470 };

interface RigFile {
  bones: { id: string; at: [number, number]; slot?: { rest: string; pictures: Record<string, string> } }[];
  chains: { id: string; at: [number, number]; part: string }[];
}

function guide(rig: string) {
  const svg = readFileSync(join(root, 'asset/rigs', rig, `${rig}.svg`), 'utf8');
  const data = JSON.parse(readFileSync(join(root, 'content/anim/rigs', `${rig}.json`), 'utf8')) as RigFile;
  // Only the rest picture of each face slot is shown (the others sit on top of it in the canvas).
  const hidden = new Set(data.bones.flatMap((b) => (b.slot ? Object.entries(b.slot.pictures).filter(([k]) => k !== b.slot!.rest).map(([, v]) => v) : [])));
  let body = svg;
  for (const name of hidden) body = body.replace(new RegExp(`<g id="part-${name}">[\\s\\S]*?</g>\\n`), '');
  const dot = (x: number, y: number, label: string, color: string) =>
    `<circle cx="${x}" cy="${y}" r="4" fill="${color}" stroke="#fff" stroke-width="1.5"/><text x="${x + 6}" y="${y - 5}" font-family="Arial" font-size="10" fill="${color}" stroke="#fff" stroke-width="2.5" paint-order="stroke">${label}</text>`;
  const marks = [
    `<rect x="0.5" y="0.5" width="511" height="511" fill="none" stroke="#999" stroke-dasharray="6 4"/>`,
    `<line x1="0" y1="${ORIGIN.y}" x2="512" y2="${ORIGIN.y}" stroke="#2a8a3a" stroke-width="1.5" stroke-dasharray="8 4"/>`,
    `<text x="6" y="${ORIGIN.y + 14}" font-family="Arial" font-size="11" fill="#2a8a3a">mặt đất y=470 · chân ở tâm x=256</text>`,
    ...data.bones.map((b) => dot(b.at[0] + ORIGIN.x, b.at[1] + ORIGIN.y, b.id, '#d0204a')),
    ...data.chains.map((c) => dot(c.at[0] + ORIGIN.x, c.at[1] + ORIGIN.y, `${c.id} (gốc dải ${c.part})`, '#2050d0')),
  ].join('\n');
  const doc = body.replace(/<\/svg>\s*$/, `<rect x="-2000" y="-2000" width="1" height="1" fill="none"/>\n${marks}\n</svg>`);
  const page = new Resvg(doc, { fitTo: { mode: 'zoom', value: 2 }, background: '#f4f1e8', font: { loadSystemFonts: true } }).render();
  writeFileSync(join(root, 'art_inbox', `rig_${rig}_guide.png`), page.asPng());
  console.log(`art_inbox/rig_${rig}_guide.png`);
}

const wanted = process.argv.slice(2);
const all = readdirSync(join(root, 'asset/rigs'), { withFileTypes: true }).filter((d) => d.isDirectory()).map((d) => d.name);
for (const rig of wanted.length > 0 ? wanted : all) guide(rig);
