// Admin "Xưởng animation trận" (decision 042): plays one skill (or the plain attack) between two creatures on the game's own battle
// stage (scene/battle/BattleScene.ts), from the game's own content (content/adventure/battle_fx.json). The skill's own look can be
// edited as JSON, tried at once ("Áp dụng thử" changes only this page) and saved into battle_fx.json through the content API, which
// checks it with the same schema as the game. Nothing else is touched; no save is opened. Decision 044: up to three units a side
// (an area skill reaches all of them, staggered), the statuses the skill puts on, an elemental reaction, a boss changing phase and
// the victory can be played too.
import * as Phaser from 'phaser';
import battleFxRaw from '../../content/adventure/battle_fx.json';
import { battleFxFileSchema } from '../../content/schemas/adventure/battleFx';
import { BattleScene, type BattleStageState } from '../../src/areas/adventure/scene/battle/BattleScene';
import { BATTLE_FX, ENEMY_LIST, SKILL_LIST, SKILLS } from '../../src/areas/adventure/logic/config/content';
import { stepMotion } from '../../src/areas/adventure/ui/battleMotion';
import type { PlayingStep } from '../../src/areas/adventure/ui/battleFxView';
import { lookOf, mirrored } from '../../src/areas/adventure/ui/motionProfiles';
import type { BattleEvent, BattleState } from '../../src/systems/combat/types';
import { esc } from './labels';
import { json, post } from './store';

const FILE = 'adventure/battle_fx.json';
const ALLIES = ['lab:ally', 'lab:ally2', 'lab:ally3'];
const FOES = ['lab_enemy#1', 'lab_enemy#2', 'lab_enemy#3'];
const REACTIONS = ['reaction_shock', 'reaction_steam', 'reaction_wildfire', 'reaction_shatter', 'reaction_purify', 'reaction_eclipse'];
const battleOf = () => ({ combatants: [...ALLIES.slice(0, lab.allies).map((id) => ({ id, side: 'ally' })), ...FOES.slice(0, lab.foes).map((id) => ({ id, side: 'enemy' }))] }) as unknown as BattleState;

type Row = { id: string; asset?: string; frames?: { width: number; height: number; count: number; fps: number } };
const lab = {
  skill: '' as string,
  attacker: 'pig_knight',
  target: 'enemy_forest_wolf',
  fromEnemy: false,
  crit: false,
  ko: false,
  fast: false,
  reduce: false,
  /** Units a side (1–3), the elemental reaction to set off, a boss phase change, the battle won. */
  allies: 1,
  foes: 1,
  reaction: '',
  phase: false,
  win: false,
  raw: null as Record<string, unknown> | null,
  images: new Map<string, Row>(),
  step: null as PlayingStep | null,
  counter: 0,
  game: null as Phaser.Game | null,
  host: null as HTMLElement | null,
  message: '',
  /** The content API answered (without it the page can try looks but not save them). */
  online: false,
};

/** The events a skill would make on the lab's field (enough for the motion to cut its beat): every target of an area skill, the statuses it puts on, the chosen reaction, phase change and victory. */
function eventsOf(): BattleEvent[] {
  const s = lab.skill ? SKILLS[lab.skill] : undefined;
  const mine = (lab.fromEnemy ? FOES.slice(0, lab.foes) : ALLIES.slice(0, lab.allies));
  const theirs = (lab.fromEnemy ? ALLIES.slice(0, lab.allies) : FOES.slice(0, lab.foes));
  const actor = mine[0]!;
  const out: BattleEvent[] = [{ type: 'turn', actor }, { type: 'use', actor, skillId: s?.id ?? null, ultimate: !!s && s.type === 'ultimate' }];
  const target = s?.target ?? 'enemy';
  const friends = target === 'self' ? [actor] : target === 'ally' ? [mine[mine.length > 1 ? 1 : 0]!] : target === 'allAllies' ? mine : target === 'all' ? mine : [];
  const foes = target === 'allEnemies' || target === 'randomEnemies' || target === 'all' ? theirs : target === 'enemy' || !s ? [theirs[0]!] : [];
  const element = (s?.element === 'SELF' ? null : s?.element) ?? 'METAL';
  for (const f of friends) out.push({ type: 'heal', actor, target: f, amount: 40, skillId: s!.id } as BattleEvent);
  for (const f of foes) out.push({ type: 'damage', actor, target: f, amount: 60, crit: lab.crit, mult: 1, skillId: s?.id ?? null, absorbed: 0, element } as BattleEvent);
  for (const e of s?.effects ?? []) {
    if (e.kind !== 'status') continue;
    const on = e.to === 'self' ? [actor] : e.to === 'allies' ? mine : e.to === 'foes' ? theirs : friends.length > 0 ? friends : foes;
    for (const t of on) out.push({ type: 'status', actor, target: t, status: e.status, skillId: s!.id } as BattleEvent);
  }
  if (lab.reaction && foes[0]) out.push({ type: 'reaction', target: foes[0], reaction: lab.reaction } as BattleEvent);
  if (lab.ko) for (const f of foes) out.push({ type: 'defeat', target: f } as BattleEvent);
  if (lab.phase) out.push({ type: 'phase', target: FOES[0]!, phase: 2 } as BattleEvent);
  if (lab.win) out.push({ type: 'end', outcome: 'win' } as BattleEvent);
  return out;
}

function play(enter = false) {
  const motion = stepMotion(battleOf(), eventsOf(), lab.fast);
  lab.counter += 1;
  lab.step = { key: `lab:${lab.counter}`, at: performance.now() + (enter ? 1100 : 150), fx: { floaters: [], banner: null, shake: false, shakeAt: 0 }, motion, enter, shown: 0 };
}

/** The statuses the played skill has put on a unit so far (their badges show by its head, decision 044). */
function statusesOn(id: string): string[] {
  const step = lab.step;
  if (!step) return [];
  const t = performance.now() - step.at;
  return [...new Set(step.motion.marks.filter((m) => m.kind === 'status' && m.unit === id && m.at <= t).map((m) => m.id))];
}

function stageState(): BattleStageState | null {
  const host = lab.host;
  if (!host || !lab.step) return null;
  const r = host.getBoundingClientRect();
  const size = r.height * (lab.allies + lab.foes > 2 ? 0.26 : 0.34);
  const unit = (id: string, side: 'ally' | 'enemy', art: string, x: number, y: number) => ({ id, side, art, mirrored: mirrored(art, side), feet: { x: r.left + r.width * x, y: r.top + r.height * y }, width: size, height: size, down: false, aimable: false, statuses: statusesOn(id) });
  const allyArt = lab.fromEnemy ? lab.target : lab.attacker;
  const foeArt = lab.fromEnemy ? lab.attacker : lab.target;
  // Three spots a side, staggered in depth like the game's field.
  const spots = [[0.3, 0.8], [0.18, 0.66], [0.16, 0.92]] as const;
  const units = [
    ...ALLIES.slice(0, lab.allies).map((id, i) => unit(id, 'ally', allyArt, spots[i]![0], spots[i]![1])),
    ...FOES.slice(0, lab.foes).map((id, i) => unit(id, 'enemy', foeArt, 1 - spots[i]![0], spots[i]![1])),
  ];
  return { active: true, units, step: lab.step, reduce: lab.reduce };
}

class Backdrop extends Phaser.Scene {
  constructor() {
    super('lab-backdrop');
  }
  preload() {
    const bg = lab.images.get('bg_adventure_forest');
    if (bg?.asset) this.load.image('bg', `/assets/${bg.asset}`);
  }
  create() {
    if (this.textures.exists('bg')) this.add.image(this.scale.width / 2, this.scale.height / 2, 'bg').setDisplaySize(this.scale.width, this.scale.height);
    this.scene.launch('adventure-battle');
  }
}

function mountGame(host: HTMLElement) {
  lab.game?.destroy(true);
  lab.host = host;
  const image = (id: string) => {
    const row = lab.images.get(id);
    return row?.asset ? { url: `/assets/${row.asset}`, frames: row.frames } : null;
  };
  lab.game = new Phaser.Game({ type: Phaser.AUTO, parent: host, width: host.clientWidth, height: host.clientHeight, transparent: true, banner: false, audio: { noAudio: true }, scene: [new Backdrop(), new BattleScene({ read: stageState, image })] });
  // For checking the stage from the browser console (Admin only).
  (window as unknown as { labGame?: Phaser.Game }).labGame = lab.game;
}

/** The skill's own look in the file (what "Áp dụng thử" and "Lưu" change). */
const ownRaw = () => ((lab.raw?.skills as Record<string, unknown> | undefined)?.[lab.skill] ?? {}) as Record<string, unknown>;

/** The file with the skill's own look replaced by `own` (an empty object removes it), checked by the game's schema. */
function withOwn(own: Record<string, unknown>): { raw: Record<string, unknown>; error: string | null } {
  const skills = { ...((lab.raw?.skills as Record<string, unknown>) ?? {}) };
  if (Object.keys(own).length === 0) delete skills[lab.skill];
  else skills[lab.skill] = own;
  const raw = { ...lab.raw, skills };
  const r = battleFxFileSchema.safeParse(raw);
  return r.success ? (Object.assign(BATTLE_FX, r.data), { raw, error: null }) : { raw, error: r.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('\n') };
}

export function renderBattleLab(root: HTMLElement) {
  if (!lab.raw) {
    root.innerHTML = '<p class="muted">Đang tải battle_fx.json…</p>';
    const content = json<{ files: Record<string, unknown> }>('/__admin/content').catch(() => null);
    void Promise.all([content, json<Record<string, unknown>>('/assets/manifest/assets.json')])
      .then(([c, m]) => {
        lab.online = !!c;
        lab.raw = (c?.files[FILE] ?? structuredClone(battleFxRaw)) as Record<string, unknown>;
        if (!c) lab.message = 'API nội dung không chạy (cần npm run admin): thử được, chưa lưu được.';
        for (const rows of Object.values(m)) if (Array.isArray(rows)) for (const row of rows as Row[]) lab.images.set(row.id, row);
        renderBattleLab(root);
      })
      .catch((e: Error) => (root.innerHTML = `<p class="error">Không tải được: ${esc(e.message)} (cần chạy <code>npm run admin</code>).</p>`));
    return;
  }
  const opt = (id: string, label: string, cur: string) => `<option value="${esc(id)}"${id === cur ? ' selected' : ''}>${esc(label)}</option>`;
  const creatures = [...[...lab.images.values()].filter((r) => /^(pig_|fish_)/.test(r.id) && !/_(hurt|sleep|wake)$/.test(r.id)).map((r) => r.id), ...ENEMY_LIST.map((e) => e.art)];
  const element = SKILLS[lab.skill]?.element ?? null;
  const look = lookOf(element === 'SELF' ? null : element, lab.skill || null);
  root.innerHTML = `<h3>Xưởng animation trận</h3>
    <p class="muted">Chạy một kỹ năng giữa hai sinh vật bằng đúng sân trận Phaser của game, đọc từ <code>content/adventure/battle_fx.json</code>. Ô JSON là phần <b>riêng</b> của kỹ năng (để trống = dùng công thức của hệ). Cách viết: <code>docs/animation/COMBAT_ART_GUIDE.md</code> §4.</p>
    <div class="form-grid">
      <label class="field"><span>Kỹ năng</span><select data-skill>${opt('', 'Đánh thường', lab.skill)}${SKILL_LIST.map((s) => opt(s.id, `${s.nameVi} · ${s.element ?? '—'} · ${s.category}${BATTLE_FX.skills[s.id] ? ' ★' : ''}`, lab.skill)).join('')}</select></label>
      <label class="field"><span>Bên ra đòn</span><select data-attacker>${creatures.map((c) => opt(c, c, lab.attacker)).join('')}</select></label>
      <label class="field"><span>Bên nhận đòn</span><select data-target>${creatures.map((c) => opt(c, c, lab.target)).join('')}</select></label>
      <label class="field"><span>Quái ra đòn (từ bên phải)</span><input type="checkbox" data-flag="fromEnemy"${lab.fromEnemy ? ' checked' : ''} /></label>
      <label class="field"><span>Chí mạng</span><input type="checkbox" data-flag="crit"${lab.crit ? ' checked' : ''} /></label>
      <label class="field"><span>Kết liễu</span><input type="checkbox" data-flag="ko"${lab.ko ? ' checked' : ''} /></label>
      <label class="field"><span>Tốc độ x2</span><input type="checkbox" data-flag="fast"${lab.fast ? ' checked' : ''} /></label>
      <label class="field"><span>Giảm chuyển động</span><input type="checkbox" data-flag="reduce"${lab.reduce ? ' checked' : ''} /></label>
      <label class="field"><span>Số đồng đội</span><select data-count="allies">${[1, 2, 3].map((n) => opt(String(n), String(n), String(lab.allies))).join('')}</select></label>
      <label class="field"><span>Số quái</span><select data-count="foes">${[1, 2, 3].map((n) => opt(String(n), String(n), String(lab.foes))).join('')}</select></label>
      <label class="field"><span>Phản ứng nguyên tố</span><select data-reaction>${opt('', '—', lab.reaction)}${REACTIONS.map((x) => opt(x, x, lab.reaction)).join('')}</select></label>
      <label class="field"><span>Trùm đổi pha</span><input type="checkbox" data-flag="phase"${lab.phase ? ' checked' : ''} /></label>
      <label class="field"><span>Thắng trận</span><input type="checkbox" data-flag="win"${lab.win ? ' checked' : ''} /></label>
    </div>
    <p><button class="btn" data-play>▶ Chạy</button> <button class="btn ghost" data-enter>Vào trận</button></p>
    <div data-stage style="position:relative;width:min(100%,1120px);aspect-ratio:16/9;border-radius:12px;overflow:hidden;background:#cfe6c4"></div>
    <h4>Kỹ năng này trông thế nào (đã gộp hệ + phần riêng)</h4>
    <pre class="muted" style="max-height:12rem;overflow:auto">${esc(JSON.stringify({ ...look, color: `#${look.color.toString(16).padStart(6, '0')}`, glow: `#${look.glow.toString(16).padStart(6, '0')}` }, null, 1))}</pre>
    <h4>Phần riêng của kỹ năng (JSON)</h4>
    <textarea data-own rows="8" style="width:100%;font-family:monospace"${lab.skill ? '' : ' disabled'}>${esc(lab.skill ? JSON.stringify(ownRaw(), null, 2) : 'Chọn một kỹ năng để sửa phần riêng.')}</textarea>
    <p><button class="btn" data-try${lab.skill ? '' : ' disabled'}>Áp dụng thử</button> <button class="btn" data-save${lab.skill && lab.online ? '' : ' disabled'}>Lưu vào battle_fx.json</button></p>
    <pre data-msg class="${lab.message.startsWith('✓') ? 'ok' : 'error'}">${esc(lab.message)}</pre>`;
  const q = <T extends HTMLElement>(sel: string) => root.querySelector<T>(sel)!;
  mountGame(q('[data-stage]'));
  const redo = () => renderBattleLab(root);
  q<HTMLSelectElement>('[data-skill]').onchange = (e) => ((lab.skill = (e.target as HTMLSelectElement).value), (lab.message = ''), redo());
  q<HTMLSelectElement>('[data-attacker]').onchange = (e) => ((lab.attacker = (e.target as HTMLSelectElement).value), redo());
  q<HTMLSelectElement>('[data-target]').onchange = (e) => ((lab.target = (e.target as HTMLSelectElement).value), redo());
  for (const box of root.querySelectorAll<HTMLInputElement>('[data-flag]')) box.onchange = () => ((lab as unknown as Record<string, boolean>)[box.dataset.flag!] = box.checked);
  for (const sel of root.querySelectorAll<HTMLSelectElement>('[data-count]')) sel.onchange = () => ((lab as unknown as Record<string, number>)[sel.dataset.count!] = Number(sel.value));
  q<HTMLSelectElement>('[data-reaction]').onchange = (e) => (lab.reaction = (e.target as HTMLSelectElement).value);
  q('[data-play]').onclick = () => play();
  q('[data-enter]').onclick = () => play(true);
  const own = (): Record<string, unknown> | null => {
    try {
      return JSON.parse(q<HTMLTextAreaElement>('[data-own]').value || '{}') as Record<string, unknown>;
    } catch (e) {
      q('[data-msg]').textContent = `JSON sai: ${(e as Error).message}`;
      return null;
    }
  };
  q('[data-try]').onclick = () => {
    const o = own();
    if (!o) return;
    const r = withOwn(o);
    lab.message = r.error ? `Chưa hợp lệ:\n${r.error}` : '✓ Đã áp dụng thử (chưa lưu). Bấm ▶ Chạy để xem.';
    if (!r.error) lab.raw = r.raw;
    redo();
    if (!r.error) play();
  };
  q('[data-save]').onclick = async () => {
    const o = own();
    if (!o) return;
    const r = withOwn(o);
    if (r.error) return void (q('[data-msg]').textContent = `Chưa hợp lệ:\n${r.error}`);
    try {
      await post('/__admin/content', { file: FILE, value: r.raw, texts: {}, requestId: `lab-${Date.now().toString(36)}` });
      lab.raw = r.raw;
      lab.message = '✓ Đã lưu battle_fx.json. Game dùng ngay lần tải lại tới.';
    } catch (e) {
      lab.message = `Không lưu được:\n${(e as Error).message}`;
    }
    redo();
  };
}
