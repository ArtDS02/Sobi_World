// Generated art + sound for the v1 manifest (art standard §10 waves 1–2), drawn with one style kit
// (scripts/art/kit.ts) so every family matches the reference sheets. Writes raw files into
// art_inbox/ for `npm run art:process`, and the app icon into build/.
// Usage: npm run art:generate && npm run art:process
import { copyFileSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { ICON_FILES, appIconSvg } from './art/icons';
import { PIG_IDS, pigSvg } from './art/pigs';
import { renderSvg } from './art/render';
import { SFX_IDS, sfxMp3 } from './art/sfx';
import { WORLD } from './art/world';

const INBOX = 'art_inbox';
const AUDIO = join(INBOX, 'audio');
const MUSIC_SOURCE = 'asset/music/music-bg.mp3';
const CREDIT_SFX = 'Ủn Ỉn Homemade — synthesised in scripts/art/sfx.ts';
const LICENSE_SFX = 'Original work, project-owned';
const CREDIT_MUSIC = 'Ủn Ỉn Homemade — generated with Mureka AI';
const LICENSE_MUSIC = 'Project-owned (Mureka AI output, per the account plan terms)';

mkdirSync(AUDIO, { recursive: true });
let count = 0;
const png = (stem: string, svg: string) => {
  writeFileSync(join(INBOX, `${stem}.png`), renderSvg(svg));
  count++;
};

for (const id of PIG_IDS) {
  png(id, pigSvg(id, 'idle'));
  png(`${id}_sleep`, pigSvg(id, 'sleep'));
}
for (const [stem, draw] of Object.entries(WORLD)) png(stem, draw());
for (const [stem, draw] of Object.entries(ICON_FILES)) png(stem, draw());

const credits = ['# id | credit | license'];
for (const id of SFX_IDS) {
  writeFileSync(join(AUDIO, `${id}.mp3`), sfxMp3(id));
  credits.push(`${id} | ${CREDIT_SFX} | ${LICENSE_SFX}`);
}
if (existsSync(MUSIC_SOURCE)) {
  copyFileSync(MUSIC_SOURCE, join(AUDIO, 'music_farm.mp3'));
  credits.push(`music_farm | ${CREDIT_MUSIC} | ${LICENSE_MUSIC}`);
}
writeFileSync(join(AUDIO, 'credits.txt'), `${credits.join('\n')}\n`);

// App icon (environment catalogue §4.4): 1024 master + a 256 PNG-in-ICO for the installer.
writeFileSync('build/icon.png', renderSvg(appIconSvg(1024)));
const ico256 = renderSvg(appIconSvg(256));
const header = Buffer.alloc(22);
header.writeUInt16LE(0, 0);
header.writeUInt16LE(1, 2); // type: icon
header.writeUInt16LE(1, 4); // one image
header.writeUInt8(0, 6); // 0 = 256 px
header.writeUInt8(0, 7);
header.writeUInt16LE(1, 10); // planes
header.writeUInt16LE(32, 12); // bpp
header.writeUInt32LE(ico256.length, 14);
header.writeUInt32LE(22, 18);
writeFileSync('build/icon.ico', Buffer.concat([header, ico256]));

console.log(
  `art:generate — ${count} images, ${SFX_IDS.length} effects${existsSync(MUSIC_SOURCE) ? ' + music' : ''} in ${INBOX}/, icon in build/`,
);
