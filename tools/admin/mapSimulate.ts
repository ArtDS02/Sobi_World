// "Chạy thử" of the Map Builder (decision 047, GĐ7): walk an area in the dashboard with the keys, by the game's own rules — the same
// walkable ground and feet box (`walkableOf`, `stepCharacter`, the explore speed), element gates shut or open, an exit locked behind
// its guardian / a shortcut blocking like a wall unless "every lock open", stepping into an exit (the game's own distance) landing on
// its spawn in the area it leads to, the portal taking the party to another area's spawn. Nothing is saved anywhere: no save, no
// draft. Runs on the published world or on the drafts (with the editor's unsaved area when it starts from there).
import { spawnIn } from '../../content/schemas/adventure/maps';
import { AB, type AreaMap } from '../../src/areas/adventure/logic/config/content';
import { coverAt, distanceToThing, thingsOf, tileCenter, walkableOf } from '../../src/areas/adventure/logic/maps';
import { decorAlpha, decorOf } from '../../src/areas/adventure/logic/scenery';
import { stepCharacter, type CharacterState, type Walkable } from '../../src/systems/character';
import { esc } from './labels';
import { ImageCache, drawEditor, type Layers } from './mapEditCanvas';
import * as M from './mapModel';
import { openModal } from './modal';

type Source = 'draft' | 'published';

const LAYERS: Layers = { background: true, ground: true, environment: true, objects: true, creatures: true, foreground: true, collision: false, grid: false, elevation: false };
const KEYS: Record<string, [number, number]> = { arrowleft: [-1, 0], a: [-1, 0], arrowright: [1, 0], d: [1, 0], arrowup: [0, -1], w: [0, -1], arrowdown: [0, 1], s: [0, 1] };

/** The world walked: the published areas, or the drafts laid over them (and the editor's area as it stands). */
function worldOf(data: M.BuilderData, source: Source, override?: AreaMap): AreaMap[] {
  const maps = source === 'published' ? [...data.published] : M.workingMaps(data);
  return override ? maps.map((m) => (m.id === override.id ? override : m)).concat(maps.some((m) => m.id === override.id) ? [] : [override]) : maps;
}

export function openSimulation(data: M.BuilderData, startId: string, override?: AreaMap) {
  let source: Source = override || !M.isPublished(data, startId) ? 'draft' : 'published';
  let world = worldOf(data, source, override);
  let map = world.find((m) => m.id === startId)!;
  let state: CharacterState = { ...tileCenter(map, map.spawn.x, map.spawn.y), facing: 'down', moving: false };
  let gatesOpen = false;
  let unlockAll = true;
  let walk: Walkable | null = null;
  let inExit: string | null = null;
  const log: string[] = [`Bắt đầu ở ${map.nameVi} (điểm mặc định ${map.spawn.x},${map.spawn.y}).`];
  const held = new Set<string>();
  let frame = 0;

  const ground = () => (walk ??= walkableOf(map, new Set(gatesOpen ? map.gates.map((g) => g.id) : []), unlockAll ? [] : map.exits.filter((e) => e.lock)));
  const enter = (dest: AreaMap, tile: { x: number; y: number }, facing: CharacterState['facing'], why: string) => {
    map = dest;
    walk = null;
    state = { ...tileCenter(dest, tile.x, tile.y), facing, moving: false };
    log.unshift(why);
  };

  openModal({
    title: 'Chạy thử map',
    submit: 'Đóng',
    wide: true,
    body: `<div class="msim"><canvas data-sim></canvas><aside class="msim__side" data-side></aside></div>`,
    onOpen: (form) => {
      const canvas = form.querySelector<HTMLCanvasElement>('[data-sim]')!;
      const side = form.querySelector<HTMLElement>('[data-side]')!;
      const images = new ImageCache(() => undefined);
      canvas.width = 960;
      canvas.height = 600;
      const panel = () => {
        const tile = { x: Math.floor(state.x / map.tile), y: Math.floor(state.y / map.tile) };
        const nearPortal = distanceToThing(map, state, thingsOf(map).find((t) => t.kind === 'portal')!) <= AB.explore.reach;
        side.innerHTML = `<label class="field"><span>Bản đi thử</span><select data-source><option value="draft"${source === 'draft' ? ' selected' : ''}>Bản nháp (gồm thay đổi chưa publish)</option><option value="published"${source === 'published' ? ' selected' : ''}>Bản đã publish (đang chơi)</option></select></label>
          <p><b>${esc(map.nameVi)}</b> <span class="mono muted">${map.id}</span><br>Ô ${tile.x},${tile.y}${coverAt(map, state) ? ' · dưới lớp che' : ''}</p>
          <label class="field"><span>Đứng ở</span><select data-at>${M.spawnsOf(map).map((s) => `<option value="${s.id}">${esc(s.nameVi)} (${s.x},${s.y})</option>`).join('')}</select></label>
          <label class="check"><input type="checkbox" data-gates${gatesOpen ? ' checked' : ''}/> Mở mọi cổng nguyên tố</label>
          <label class="check"><input type="checkbox" data-locks${unlockAll ? ' checked' : ''}/> Coi như mọi lối ra đã mở khoá</label>
          ${nearPortal ? `<label class="field"><span>Cổng dịch chuyển: tới</span><select data-warp>${world.filter((m) => m.id !== map.id).map((m) => `<option value="${m.id}">${esc(m.nameVi)}</option>`).join('')}</select></label><button type="button" class="btn btn-small" data-go>Dịch chuyển</button>` : '<p class="muted">Đứng cạnh cổng dịch chuyển (P) để dịch chuyển.</p>'}
          <p class="muted">Phím mũi tên / WASD để đi. Đi vào lối ra (&gt;) để sang map khác. Không lưu gì.</p>
          <ol class="msim__log">${log.slice(0, 12).map((l) => `<li>${esc(l)}</li>`).join('')}</ol>`;
        side.querySelector<HTMLSelectElement>('[data-source]')!.addEventListener('change', (e) => {
          source = (e.target as HTMLSelectElement).value as Source;
          world = worldOf(data, source, source === 'draft' ? override : undefined);
          const again = world.find((m) => m.id === map.id) ?? world.find((m) => m.id === startId) ?? world[0]!;
          enter(again, again.spawn, 'down', `Đổi sang ${source === 'draft' ? 'bản nháp' : 'bản đã publish'}: ${again.nameVi}.`);
          panel();
        });
        side.querySelector<HTMLSelectElement>('[data-at]')!.addEventListener('change', (e) => {
          const sp = M.spawnsOf(map).find((s) => s.id === (e.target as HTMLSelectElement).value)!;
          enter(map, sp, sp.facing ?? 'down', `Đứng ở ${sp.nameVi}.`);
          panel();
        });
        side.querySelector<HTMLInputElement>('[data-gates]')!.addEventListener('change', (e) => ((gatesOpen = (e.target as HTMLInputElement).checked), (walk = null)));
        side.querySelector<HTMLInputElement>('[data-locks]')!.addEventListener('change', (e) => ((unlockAll = (e.target as HTMLInputElement).checked), (walk = null)));
        side.querySelector('[data-go]')?.addEventListener('click', () => {
          const dest = world.find((m) => m.id === side.querySelector<HTMLSelectElement>('[data-warp]')!.value)!;
          enter(dest, dest.spawn, 'down', `Dịch chuyển tới ${dest.nameVi} (điểm mặc định).`);
          panel();
        });
      };

      const step = (dt: number) => {
        const dir = { x: 0, y: 0 };
        for (const k of held) {
          const v = KEYS[k];
          if (v) {
            dir.x += v[0];
            dir.y += v[1];
          }
        }
        const before = { x: Math.floor(state.x / map.tile), y: Math.floor(state.y / map.tile) };
        state = stepCharacter(state, dir, dt, AB.explore.speed, ground());
        // Into an exit, as the game decides it; a locked one only when every lock counts as open.
        const exit = map.exits.find((e) => distanceToThing(map, state, e) < map.tile * 0.3 && (unlockAll || !e.lock));
        if (!exit) inExit = null;
        else if (inExit !== exit.id) {
          inExit = exit.id;
          const dest = world.find((m) => m.id === exit.to);
          if (!dest) log.unshift(`⛔ ${exit.id} dẫn tới ${exit.to} — map này không có trong bản đang thử.`);
          else {
            const sp = exit.arrive ? spawnIn(dest, exit.arrive) : undefined;
            const at = sp ?? { x: exit.arriveX, y: exit.arriveY };
            const facing = sp?.facing ?? exit.facing ?? (exit.x <= 1 ? 'left' : 'right');
            enter(dest, at, facing, `${exit.id} → ${dest.nameVi}, ${exit.arrive ? M.spawnsOf(dest).find((s) => s.id === exit.arrive)?.nameVi ?? `⛔ thiếu điểm ${exit.arrive}` : 'điểm tới không tên'} (${at.x},${at.y}).`);
            inExit = null;
          }
          panel();
        }
        const after = { x: Math.floor(state.x / map.tile), y: Math.floor(state.y / map.tile) };
        if (before.x !== after.x || before.y !== after.y) panel();
      };

      const draw = () => {
        const scale = 22;
        const view = { scale, ox: state.x / map.tile - canvas.width / scale / 2, oy: state.y / map.tile - canvas.height / scale / 2 };
        drawEditor(canvas, map, view, LAYERS, images, new Set(), null);
        const g = canvas.getContext('2d')!;
        const px = (state.x / map.tile - view.ox) * scale;
        const py = (state.y / map.tile - view.oy) * scale;
        const w = ground();
        // Covers and decorations over the party fade as in the game: a dark veil marks what is see-through now.
        const p = { x: state.x / map.tile, y: state.y / map.tile };
        const hidden = decorOf(map).filter((d) => decorAlpha(d, p) < 1).length + (coverAt(map, state) ? 1 : 0);
        g.strokeStyle = '#ffffff';
        g.lineWidth = 2;
        g.strokeRect(px - (w.halfW / map.tile) * scale, py - (w.halfH / map.tile) * scale, ((w.halfW * 2) / map.tile) * scale, ((w.halfH * 2) / map.tile) * scale);
        g.fillStyle = '#ff2fd0';
        g.beginPath();
        g.arc(px, py - scale * 0.6, scale * 0.45, 0, Math.PI * 2);
        g.fill();
        if (hidden) {
          g.fillStyle = '#000a';
          g.fillRect(8, 8, 230, 26);
          g.fillStyle = '#fff';
          g.font = '13px system-ui';
          g.fillText(`Lớp che / asset đang mờ: ${hidden}`, 16, 26);
        }
      };

      // A timer, not animation frames: it keeps walking while the window is in the background (a hidden tab pauses frames).
      let last = performance.now();
      const loop = () => {
        if (!form.isConnected) return clearInterval(frame);
        const now = performance.now();
        step(Math.min(50, now - last));
        last = now;
        draw();
      };
      const down = (e: KeyboardEvent) => {
        const k = e.key.toLowerCase();
        if (!KEYS[k] || (e.target instanceof Element && e.target.closest('input, select, textarea'))) return;
        held.add(k);
        e.preventDefault();
      };
      const up = (e: KeyboardEvent) => held.delete(e.key.toLowerCase());
      document.addEventListener('keydown', down);
      document.addEventListener('keyup', up);
      const stop = new MutationObserver(() => {
        if (form.isConnected) return;
        clearInterval(frame);
        document.removeEventListener('keydown', down);
        document.removeEventListener('keyup', up);
        stop.disconnect();
      });
      stop.observe(document.body, { childList: true });
      panel();
      frame = window.setInterval(loop, 16);
    },
    onSubmit: () => undefined,
  });
}
