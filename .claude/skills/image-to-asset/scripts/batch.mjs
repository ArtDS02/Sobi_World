#!/usr/bin/env node
// Backend G driver (workflows/batch.md): one batch = asset/batches/<id>.json, a few sheets the owner
// generates in Gemini from a prepared prompt + attachments.
// Usage: node .claude/skills/image-to-asset/scripts/batch.mjs <command> [id] [...]
//   list                      every batch with its progress (sheets saved, candidates, production rows)
//   prep <id>                 writes asset/batches/<id>.md (tracked prompt sheet) and the work folder
//                             art_inbox/.batch/<id>/ (attachments 1_style.png, 2_*.png + PROMPT.md)
//   cut <id>                  cuts every saved sheet (<sheet>.png, <sheet>-2.png … = variants a, b …) into
//                             art_inbox/.candidates/<stem>_<v>.png and writes one review board per sheet
//                             art_inbox/.qa/<id>_<sheet>.png (variants side by side at game size)
//   deliver <id> <v|stem=v ...>  copies chosen candidates to art_inbox/<stem>.png for npm run art:process
import { execFileSync } from 'node:child_process';
import { copyFileSync, existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import pngjs from 'pngjs';

const { PNG } = pngjs;
const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..', '..', '..');
const SKILL = join(ROOT, '.claude/skills/image-to-asset');
const BATCHES = join(ROOT, 'asset/batches');
const WORK = join(ROOT, 'art_inbox/.batch');
const CAND = join(ROOT, 'art_inbox/.candidates');
const QA = join(ROOT, 'art_inbox/.qa');
const MANIFEST = join(ROOT, 'public/assets/manifest/assets.json');
const boards = JSON.parse(readFileSync(join(SKILL, 'references/style-boards.json'), 'utf8'));
const BG = boards.background;
const VARIANTS = 'abcdefgh';

const [cmd, id, ...rest] = process.argv.slice(2);
const rel = (p) => p.slice(ROOT.length + 1).replace(/\\/g, '/');
const load = (p) => {
  const png = PNG.sync.read(readFileSync(p));
  return { w: png.width, h: png.height, d: png.data };
};
const save = (p, im) => {
  const o = new PNG({ width: im.w, height: im.h });
  im.d.copy(o.data);
  mkdirSync(dirname(p), { recursive: true });
  writeFileSync(p, PNG.sync.write(o));
};
const canvas = (w, h, rgb) => {
  const d = Buffer.alloc(w * h * 4);
  for (let i = 0; i < w * h; i++) d.set([...rgb, 255], i * 4);
  return { w, h, d };
};
/** Alpha-composites src scaled by nearest-area sampling into box (x, y, bw, bh) of dst, fit + centred. */
function blit(dst, src, x, y, bw, bh, bottom = false) {
  const s = Math.min(bw / src.w, bh / src.h);
  const w = Math.max(1, Math.round(src.w * s)), h = Math.max(1, Math.round(src.h * s));
  const ox = x + ((bw - w) >> 1), oy = bottom ? y + bh - h : y + ((bh - h) >> 1);
  for (let yy = 0; yy < h; yy++)
    for (let xx = 0; xx < w; xx++) {
      let r = 0, g = 0, b = 0, a = 0, n = 0;
      for (let v = Math.floor(yy / s); v < Math.max(Math.floor(yy / s) + 1, Math.floor((yy + 1) / s)); v++)
        for (let u = Math.floor(xx / s); u < Math.max(Math.floor(xx / s) + 1, Math.floor((xx + 1) / s)); u++) {
          if (u >= src.w || v >= src.h) continue;
          const i = (v * src.w + u) * 4, al = src.d[i + 3] / 255;
          (r += src.d[i] * al), (g += src.d[i + 1] * al), (b += src.d[i + 2] * al), (a += al), n++;
        }
      if (!a) continue;
      const al = a / n, o = ((oy + yy) * dst.w + ox + xx) * 4;
      for (const [k, c] of [r, g, b].entries()) dst.d[o + k] = Math.round((c / a) * al + dst.d[o + k] * (1 - al));
    }
}
function crop(src, [x, y, w, h]) {
  const d = Buffer.alloc(w * h * 4);
  for (let r = 0; r < h; r++) src.d.copy(d, r * w * 4, ((y + r) * src.w + x) * 4, ((y + r) * src.w + x + w) * 4);
  return { w, h, d };
}

function readBatch(bid) {
  const f = join(BATCHES, `${bid}.json`);
  if (!existsSync(f)) throw new Error(`no batch ${rel(f)}`);
  return JSON.parse(readFileSync(f, 'utf8'));
}
const allBatches = () =>
  existsSync(BATCHES) ? readdirSync(BATCHES).filter((f) => f.endsWith('.json')).map((f) => readBatch(f.slice(0, -5))) : [];
const stemsOf = (sheet) => sheet.cells.map((c) => c.stem);
const gridOf = (sheet) => sheet.grid ?? [1, 1];

/** The prompt text for one sheet (English: image models follow it best). */
function promptOf(sheet) {
  const B = boards.blocks;
  const [R, C] = gridOf(sheet);
  const n = sheet.cells.length;
  const lines = [B.style];
  (sheet.hints ?? []).forEach((h, k) => lines.push(B.hint.replace('{K}', String(k + 2)).replace('{WHAT}', h.what)));
  lines.push('');
  if (n > 1) {
    lines.push(B.sheet.replace('{N}', n).replace('{R}', R).replace('{C}', C));
    for (let r = 0; r < R; r++) {
      const row = sheet.cells.slice(r * C, r * C + C);
      lines.push(`Row ${r + 1}: ${row.map((c, k) => `(${k + 1}) ${c.desc}`).join('; ')}.`);
    }
  } else {
    lines.push(B.single, `The object: ${sheet.cells[0].desc}.`);
  }
  if (sheet.notes) lines.push(sheet.notes);
  for (const v of sheet.views ?? []) lines.push(boards.views[v]);
  lines.push('');
  if (n > 1) lines.push(B.layout);
  if (sheet.fit !== 'backdrop') lines.push(B.background);
  lines.push(B.negative);
  return lines.join('\n');
}

const attachName = (sheet, k) => `${sheet.name}_${k + 2}_hint.png`;

function prep(b) {
  const dir = join(WORK, b.id);
  mkdirSync(dir, { recursive: true });
  const boardsUsed = new Set(b.sheets.map((s) => s.board));
  for (const name of boardsUsed) {
    const files = boards.boards[name];
    if (!files) throw new Error(`unknown board ${name}`);
    const cell = 384, cols = 2, rows = Math.ceil(files.length / cols);
    const im = canvas(cols * cell, rows * cell, BG);
    files.forEach((f, k) => blit(im, load(join(ROOT, f)), (k % cols) * cell + 24, Math.floor(k / cols) * cell + 24, cell - 48, cell - 48, true));
    save(join(dir, `1_style_${name}.png`), im);
  }
  for (const s of b.sheets)
    (s.hints ?? []).forEach((h, k) => save(join(dir, attachName(s, k)), crop(load(join(ROOT, h.from)), h.box)));

  const md = [
    `# Batch ${b.id} — ${b.title}`,
    '',
    `<!-- Generated by .claude/skills/image-to-asset/scripts/batch.mjs prep ${b.id} from asset/batches/${b.id}.json. Do not edit by hand. -->`,
    '',
    `Thư mục làm việc: \`art_inbox/.batch/${b.id}/\` (file đính kèm nằm sẵn ở đó).`,
    '',
    'Cách làm cho mỗi sheet: mở Gemini (gemini.google.com hoặc aistudio.google.com, chọn model tạo ảnh) → **cuộc trò chuyện mới** → đính kèm đúng các file theo thứ tự → dán prompt → tải ảnh về, lưu PNG đúng tên vào thư mục làm việc. Muốn thử thêm phiên bản: tạo lại và lưu `<tên>-2.png`, `<tên>-3.png`.',
    '',
  ];
  for (const s of b.sheets) {
    const [R, C] = gridOf(s);
    md.push(`## Sheet ${s.name} — ${s.title}`, '');
    md.push(`- Lưu thành: \`art_inbox/.batch/${b.id}/${s.name}.png\``);
    md.push(`- Đính kèm (theo thứ tự): \`1_style_${s.board}.png\`${(s.hints ?? []).map((_, k) => `, \`${attachName(s, k)}\``).join('')}`);
    md.push(`- Kết quả: ${s.cells.length > 1 ? `lưới ${R}×${C}: ` : ''}${stemsOf(s).join(', ')}`, '');
    md.push('```text', promptOf(s), '```', '');
  }
  const text = md.join('\n');
  writeFileSync(join(BATCHES, `${b.id}.md`), text);
  writeFileSync(join(dir, 'PROMPT.md'), text);
  console.log(`prepared ${rel(dir)} (${readdirSync(dir).length} files) and asset/batches/${b.id}.md`);
}

/** Saved sheet files for a sheet: name.png = a, name-2.png = b … (.jpg/.jpeg converted to PNG first). */
function sheetFiles(b, s) {
  const dir = join(WORK, b.id), out = [];
  for (let k = 0; k < VARIANTS.length; k++) {
    const base = k === 0 ? s.name : `${s.name}-${k + 1}`;
    const png = join(dir, `${base}.png`);
    for (const ext of ['jpg', 'jpeg', 'JPG', 'JPEG']) {
      const jpg = join(dir, `${base}.${ext}`);
      if (!existsSync(png) && existsSync(jpg)) {
        const ps = `Add-Type -AssemblyName System.Drawing; $i=[System.Drawing.Image]::FromFile('${jpg}'); $i.Save('${png}',[System.Drawing.Imaging.ImageFormat]::Png); $i.Dispose()`;
        execFileSync('powershell', ['-NoProfile', '-NonInteractive', '-Command', ps]);
      }
    }
    if (existsSync(png)) out.push({ v: VARIANTS[k], file: png });
  }
  return out;
}

function cut(b) {
  let failed = 0;
  for (const s of b.sheets) {
    const files = sheetFiles(b, s);
    if (!files.length) {
      console.log(`--   sheet ${s.name}: chưa có ảnh (${s.name}.png)`);
      continue;
    }
    const [R, C] = gridOf(s);
    for (const { v, file } of files) {
      console.log(`== sheet ${s.name} variant ${v}: ${rel(file)}`);
      if (s.fit === 'backdrop') {
        mkdirSync(CAND, { recursive: true });
        copyFileSync(file, join(CAND, `${s.cells[0].stem}_${v}.png`));
        console.log(`OK   art_inbox/.candidates/${s.cells[0].stem}_${v}.png (backdrop, art:process cover-fits it)`);
        continue;
      }
      const a = [join(SKILL, 'scripts/cut-sheet.mjs'), file, '--grid', `${R}x${C}`, '--stems', stemsOf(s).join(','), '--suffix', `_${v}`];
      if (s.fit === 'shared') a.push('--fit', 'shared', '--size', s.size.join('x'));
      try {
        process.stdout.write(execFileSync(process.execPath, a, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }));
      } catch (e) {
        failed++;
        process.stdout.write(String(e.stdout ?? '') + String(e.stderr ?? ''));
      }
    }
    review(b, s, files.map((f) => f.v));
  }
  process.exit(failed ? 1 : 0);
}

/** One board per sheet: a row per variant, each candidate at game size on the style board's grey. */
function review(b, s, variants) {
  const stems = stemsOf(s).filter((x) => x !== '-');
  const cell = Math.max(160, ...(s.size ?? [0]));
  const im = canvas(cell * (stems.length + 1), cell * variants.length, BG);
  const anchor = load(join(ROOT, boards.boards[s.board][0]));
  variants.forEach((v, r) => {
    blit(im, anchor, 8, r * cell + 8, cell - 16, cell - 16, true);
    stems.forEach((st, k) => {
      const f = join(CAND, `${st}_${v}.png`);
      if (!existsSync(f)) return;
      const c = load(f);
      const w = s.size ? Math.min(c.w, s.size[0]) : Math.min(cell - 16, 128), h = s.size ? Math.min(c.h, s.size[1]) : Math.min(cell - 16, 128);
      blit(im, c, (k + 1) * cell + ((cell - w) >> 1), r * cell + ((cell - h) >> 1), w, h, true);
    });
  });
  const out = join(QA, `${b.id}_${s.name}.png`);
  save(out, im);
  console.log(`REVIEW ${rel(out)} (rows = variants ${variants.join(', ')}; column 1 = style anchor)`);
}

function deliver(b, picks) {
  const all = b.sheets.flatMap(stemsOf).filter((x) => x !== '-');
  const choice = new Map();
  for (const p of picks) {
    if (/^[a-h]$/.test(p)) all.forEach((st) => choice.has(st) || choice.set(st, p));
    else {
      const [st, v] = p.split('=');
      choice.set(st, v);
    }
  }
  for (const [st, v] of choice) {
    const f = join(CAND, `${st}_${v}.png`);
    if (!existsSync(f)) {
      console.log(`MISS ${rel(f)}`);
      continue;
    }
    copyFileSync(f, join(ROOT, 'art_inbox', `${st}.png`));
    console.log(`OK   art_inbox/${st}.png ← ${st}_${v}`);
  }
  console.log('next: npm run art:process && npm run assets:check');
}

function list() {
  const m = JSON.parse(readFileSync(MANIFEST, 'utf8'));
  const status = new Map();
  for (const sec of Object.keys(m)) if (Array.isArray(m[sec])) for (const r of m[sec]) status.set(r.id, r.status);
  for (const b of allBatches()) {
    const stems = b.sheets.flatMap(stemsOf).filter((x) => x !== '-');
    const prod = stems.filter((st) => status.get(st) === 'production').length;
    const saved = b.sheets.filter((s) => sheetFiles(b, s).length).length;
    const cands = stems.filter((st) => VARIANTS.split('').some((v) => existsSync(join(CAND, `${st}_${v}.png`)))).length;
    console.log(`${b.id.padEnd(22)} ${b.area.padEnd(10)} sheets ${saved}/${b.sheets.length}  candidates ${cands}/${stems.length}  production ${prod}/${stems.length}  ${b.title}`);
  }
}

try {
  if (cmd === 'list') list();
  else if (cmd === 'prep') prep(readBatch(id));
  else if (cmd === 'cut') cut(readBatch(id));
  else if (cmd === 'deliver') deliver(readBatch(id), rest);
  else {
    console.error('usage: batch.mjs list | prep <id> | cut <id> | deliver <id> <v|stem=v ...>');
    process.exit(2);
  }
} catch (e) {
  console.error(`FAIL ${e.message}`);
  process.exit(1);
}
