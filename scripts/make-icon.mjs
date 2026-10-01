// Placeholder app icon (spec §13.3): build/icon.png (1024) and build/icon.ico (256, PNG-in-ICO).
// Pure Node (zlib only). Draws a pink pig face; replace with the real art later (art standard §7.3).
import { mkdirSync, writeFileSync } from 'node:fs';
import { deflateSync } from 'node:zlib';

const CRC_TABLE = Array.from({ length: 256 }, (_, n) => {
  let c = n;
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  return c >>> 0;
});
const crc32 = (buf) => {
  let c = 0xffffffff;
  for (const b of buf) c = CRC_TABLE[(c ^ b) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
};

function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const body = Buffer.concat([Buffer.from(type, 'ascii'), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body));
  return Buffer.concat([len, body, crc]);
}

const PINK = [255, 170, 190];
const PINK_DARK = [232, 120, 150];
const SNOUT = [255, 140, 165];
const EYE = [60, 40, 50];

/** Colour at unit coordinates (u, v) in [0, 1]; null = transparent. */
function shade(u, v) {
  const inEllipse = (cx, cy, rx, ry) => ((u - cx) / rx) ** 2 + ((v - cy) / ry) ** 2 <= 1;
  if (inEllipse(0.44, 0.66, 0.035, 0.055) || inEllipse(0.56, 0.66, 0.035, 0.055)) return PINK_DARK;
  if (inEllipse(0.5, 0.66, 0.17, 0.12)) return SNOUT;
  if (inEllipse(0.36, 0.45, 0.035, 0.045) || inEllipse(0.64, 0.45, 0.035, 0.045)) return EYE;
  if (inEllipse(0.5, 0.55, 0.4, 0.37)) return PINK;
  // Ears
  if (inEllipse(0.22, 0.22, 0.12, 0.14) || inEllipse(0.78, 0.22, 0.12, 0.14)) return PINK_DARK;
  return null;
}

function png(size) {
  const SS = 4; // supersampling for smooth edges
  const raw = Buffer.alloc(size * (size * 4 + 1));
  for (let y = 0; y < size; y++) {
    const row = y * (size * 4 + 1);
    raw[row] = 0; // filter: none
    for (let x = 0; x < size; x++) {
      let r = 0;
      let g = 0;
      let b = 0;
      let a = 0;
      for (let sy = 0; sy < SS; sy++) {
        for (let sx = 0; sx < SS; sx++) {
          const c = shade((x + (sx + 0.5) / SS) / size, (y + (sy + 0.5) / SS) / size);
          if (!c) continue;
          r += c[0];
          g += c[1];
          b += c[2];
          a += 1;
        }
      }
      const i = row + 1 + x * 4;
      if (a > 0) {
        raw[i] = Math.round(r / a);
        raw[i + 1] = Math.round(g / a);
        raw[i + 2] = Math.round(b / a);
      }
      raw[i + 3] = Math.round((255 * a) / (SS * SS));
    }
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // RGBA
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

/** ICO with PNG-compressed entries (Vista+). Size 256 is stored as 0. */
function ico(images) {
  const header = Buffer.alloc(6);
  header.writeUInt16LE(1, 2);
  header.writeUInt16LE(images.length, 4);
  let offset = 6 + 16 * images.length;
  const entries = images.map(({ size, data }) => {
    const e = Buffer.alloc(16);
    e[0] = size >= 256 ? 0 : size;
    e[1] = size >= 256 ? 0 : size;
    e.writeUInt16LE(1, 4); // planes
    e.writeUInt16LE(32, 6); // bpp
    e.writeUInt32LE(data.length, 8);
    e.writeUInt32LE(offset, 12);
    offset += data.length;
    return e;
  });
  return Buffer.concat([header, ...entries, ...images.map((i) => i.data)]);
}

mkdirSync('build', { recursive: true });
writeFileSync('build/icon.png', png(1024));
writeFileSync(
  'build/icon.ico',
  ico([256, 64, 48, 32, 16].map((size) => ({ size, data: png(size) }))),
);
console.log('build/icon.png, build/icon.ico written');
