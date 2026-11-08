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
import { BATTLE_FX, CLASS_LIST, ELEMENT_NAMES, ENEMY_LIST, REACTIONS as REACTION_ROWS, SKILL_LIST, SKILLS, TREES } from '../../src/areas/adventure/logic/config/content';
import { reactionArt } from '../../src/areas/adventure/ui/vmKit';
import { stepMotion } from '../../src/areas/adventure/ui/battleMotion';
import type { PlayingStep } from '../../src/areas/adventure/ui/battleFxView';
import { stepPlan } from '../../src/areas/adventure/ui/battlePlan';
import { lookOf, mirrored } from '../../src/areas/adventure/ui/motionProfiles';
import type { BattleEvent, BattleState } from '../../src/systems/combat/types';
import { esc } from './labels';
import { openModal } from './modal';
import { optionHtml, type Visual } from './richSelect';
import { json, post, state } from './store';

const FILE = 'adventure/battle_fx.json';
type Side = 'ally' | 'enemy';
const ALLIES = ['lab:ally', 'lab:ally2', 'lab:ally3'];
const FOES = ['lab_enemy#1', 'lab_enemy#2', 'lab_enemy#3'];
const REACTIONS = ['reaction_shock', 'reaction_steam', 'reaction_wildfire', 'reaction_shatter', 'reaction_purify', 'reaction_eclipse'];
const battleOf = () => ({ combatants: [...ALLIES.slice(0, lab.allies).map((id) => ({ id, side: 'ally' })), ...FOES.slice(0, lab.foes).map((id) => ({ id, side: 'enemy' }))] }) as unknown as BattleState;

type Row = { id: string; asset?: string; frames?: { width: number; height: number; count: number; fps: number } };
const lab = {
  skill: '' as string,
  /** Filter of the skill dropdown by skill type ('' = every type). */
  skillType: '' as string,
  attacker: 'pig_knight',
  target: 'enemy_forest_wolf',
  fromEnemy: false,
  /** What the side that is not striking remembers of its skill choice (the two config blocks each keep their own). */
  mem: { ally: { skillType: '', skill: '' }, enemy: { skillType: '', skill: '' } } as Record<'ally' | 'enemy', { skillType: string; skill: string }>,
  crit: false,
  ko: false,
  fast: false,
  reduce: false,
  /** Units a side (1–3), the elemental reaction to set off, a boss phase change, the battle won. */
  allies: 1,
  foes: 1,
  /** The foes' corruption 0–5 (decision 045): their veins and spikes. */
  corruption: 0,
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
  /** The stage is paused since this performance.now (0: running); the last play entered a battle. */
  pausedAt: 0,
  lastEnter: false,
  /** Test hook only: a status put on a unit by the played step (alone, with the plain attack), on a foe or on the striker. */
  status: '',
  statusTo: 'foe' as 'foe' | 'self',
  timer: 0,
  /** Which two creatures the live Phaser game was built for: the same pair keeps the one game across redraws (step 6.3). */
  mountKey: '',
  /** Keyboard shortcuts are listening (one listener for the life of the page). */
  keys: false,
  /** The page the lab is drawn in (the test hook below re-renders it). */
  root: null as HTMLElement | null,
};

// Test hook for scripts/anim-review (Admin only, never in the shipped game): sets the lab's fields and plays without the UI, and reports
// the step's timing so the capture can name its beats. Read-only with respect to the content: it never saves.
const hook = {
  /** The stage is up: content loaded, the battle scene running and its pictures in. */
  ready: () => !!lab.raw && !!lab.game && lab.game.scene.isActive('adventure-battle') && lab.game.textures.exists('bg'),
  configure: (o: Partial<Pick<typeof lab, 'skill' | 'attacker' | 'target' | 'fromEnemy' | 'crit' | 'ko' | 'fast' | 'reduce' | 'allies' | 'foes' | 'corruption' | 'reaction' | 'phase' | 'win' | 'status' | 'statusTo'>>) => {
    Object.assign(lab, o);
    if (lab.root) renderBattleLab(lab.root);
  },
  play: (enter = false) => play(enter),
  /** A step with nothing in it: the statuses of the last step end (their expire plays) and the stage is quiet. */
  idle: () => {
    lab.counter += 1;
    lab.step = { key: `lab:idle:${lab.counter}`, at: performance.now(), fx: { floaters: [], banner: null, shake: false, shakeAt: 0 }, motion: stepMotion(battleOf(), [], false), enter: false, shown: 0 };
  },
  info: () => {
    const step = lab.step;
    if (!step) return null;
    const sides = new Map<string, 'ally' | 'enemy'>([...ALLIES.map((id) => [id, 'ally'] as const), ...FOES.map((id) => [id, 'enemy'] as const)]);
    return { now: performance.now(), at: step.at, total: step.motion.total, speed: step.motion.speed, beats: step.motion.beats, marks: step.motion.marks, reactions: step.motion.reactions, cues: stepPlan(step, sides, lab.reduce) };
  },
  /** Nothing is being loaded (pictures are asked for lazily, at the cue that needs them). */
  settled: () => {
    const scene = lab.game?.scene.getScene('adventure-battle');
    return !!scene && !scene.load.isLoading() && scene.load.list.size === 0;
  },
  skills: () => SKILL_LIST.map((s) => ({ id: s.id, type: s.type, element: s.element ?? null, target: s.target ?? null, statuses: (s.effects ?? []).filter((e) => e.kind === 'status').map((e) => (e as { status: string }).status), hasLook: !!BATTLE_FX.skills[s.id] })),
  reactions: () => REACTIONS,
  statuses: () => Object.entries((BATTLE_FX as unknown as { statuses?: Record<string, { apply?: unknown; loop?: unknown; layers?: unknown; expire?: unknown }> }).statuses ?? {}).map(([id, v]) => ({ id, hasApply: !!v.apply, hasLoop: !!v.loop, hasLayers: !!v.layers, hasExpire: !!v.expire, applySig: JSON.stringify(((v.apply ?? []) as { do: string; ref?: string; img?: string }[]).filter((a) => a.do !== 'sound').map((a) => [a.do, a.ref ?? a.img ?? ''])) })),
};
(window as unknown as { __animLab?: typeof hook }).__animLab = hook;

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
  if (lab.status) out.push({ type: 'status', actor, target: lab.statusTo === 'self' ? actor : theirs[0]!, status: lab.status, skillId: null } as unknown as BattleEvent);
  if (lab.reaction && foes[0]) out.push({ type: 'reaction', target: foes[0], reaction: lab.reaction } as BattleEvent);
  if (lab.ko) for (const f of foes) out.push({ type: 'defeat', target: f } as BattleEvent);
  if (lab.phase) out.push({ type: 'phase', target: FOES[0]!, phase: 2 } as BattleEvent);
  if (lab.win) out.push({ type: 'end', outcome: 'win' } as BattleEvent);
  return out;
}

function play(enter = false) {
  if (lab.pausedAt) lab.game?.resume();
  lab.pausedAt = 0;
  lab.lastEnter = enter;
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
  const unit = (id: string, side: 'ally' | 'enemy', art: string, x: number, y: number) => ({ id, side, art, mirrored: mirrored(art, side), feet: { x: r.left + r.width * x, y: r.top + r.height * y }, width: size, height: size, down: false, aimable: false, statuses: statusesOn(id), corruption: side === 'enemy' ? lab.corruption : 0 });
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
    // The stage can change size (full screen): the backdrop follows.
    this.scale.on('resize', (size: Phaser.Structs.Size) => this.children.list.filter((c): c is Phaser.GameObjects.Image => c instanceof Phaser.GameObjects.Image).forEach((i) => i.setPosition(size.width / 2, size.height / 2).setDisplaySize(size.width, size.height)));
  }
}

function mountGame(host: HTMLElement) {
  const key = `${lab.attacker}|${lab.target}`;
  if (lab.game && lab.mountKey === key && lab.game.canvas) {
    // Same creatures: the stage reads its state every frame, so the running game just moves into the new frame.
    host.appendChild(lab.game.canvas);
    lab.host = host;
    lab.game.scale.resize(host.clientWidth, host.clientHeight);
    return;
  }
  lab.game?.destroy(true);
  lab.mountKey = key;
  lab.host = host;
  const image = (id: string) => {
    const row = lab.images.get(id);
    return row?.asset ? { url: `/assets/${row.asset}`, frames: row.frames } : null;
  };
  lab.game = new Phaser.Game({ type: Phaser.AUTO, parent: host, width: host.clientWidth, height: host.clientHeight, transparent: true, banner: false, audio: { noAudio: true }, scene: [new Backdrop(), new BattleScene({ read: stageState, image })] });
  // For checking the stage from the browser console (Admin only).
  (window as unknown as { labGame?: Phaser.Game; battleLabState?: typeof lab }).labGame = lab.game;
  (window as unknown as { battleLabState?: typeof lab }).battleLabState = lab;
}

/** Holds the stage still, or lets it go on from the same moment (the step's clock waits too). */
function togglePause(): boolean {
  if (!lab.game || !lab.step) return false;
  if (lab.pausedAt) {
    lab.game.resume();
    lab.step.at += performance.now() - lab.pausedAt;
    lab.pausedAt = 0;
  } else {
    lab.game.pause();
    lab.pausedAt = performance.now();
  }
  return lab.pausedAt > 0;
}

/** mm:ss.t */
const clock = (ms: number) => `${String(Math.floor(ms / 60000)).padStart(2, '0')}:${((ms % 60000) / 1000).toFixed(1).padStart(4, '0')}`;

/** The skill's own look in the file (what "Áp dụng thử" and "Lưu" change). */
const ownRaw = () => ((lab.raw?.skills as Record<string, unknown> | undefined)?.[lab.skill] ?? {}) as Record<string, unknown>;

/** The file with the skill's own look replaced by `own` (an empty object removes it), checked by the game's schema. */
function withOwn(own: Record<string, unknown>, apply = true): { raw: Record<string, unknown>; error: string | null } {
  const skills = { ...((lab.raw?.skills as Record<string, unknown>) ?? {}) };
  if (Object.keys(own).length === 0) delete skills[lab.skill];
  else skills[lab.skill] = own;
  const raw = { ...lab.raw, skills };
  const r = battleFxFileSchema.safeParse(raw);
  return r.success ? (apply && Object.assign(BATTLE_FX, r.data), { raw, error: null }) : { raw, error: r.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('\n') };
}

/** The skill trees of the four classes in a dialog; a click on a skill picks it in the lab. */
function openTreeDialog(pic: (id: string) => string | null, skillPic: (id: string, element: string | null) => string | null, pick: (skillId: string) => void) {
  const tree = (classId: (typeof CLASS_LIST)[number]['id']) => {
    const nodes = TREES[classId];
    const tiers = [...new Set(nodes.map((n) => n.tier))].sort((a, b) => a - b);
    return `<section class="btree__class"><h3>${esc(CLASS_LIST.find((c) => c.id === classId)!.nameVi)}</h3>${tiers
      .map((t) => `<div class="btree__tier"><span class="btree__label">Bậc ${t}</span>${nodes
        .filter((n) => n.tier === t)
        .map((n) => {
          const sk = SKILLS[n.skill];
          const img = skillPic(n.skill, sk?.element ?? null) ?? pic('ui_icon_adv_skill');
          return `<button type="button" class="btree__node" data-pick="${n.skill}" title="${esc(sk?.descVi ?? '')}">${img ? `<img src="${img}" alt="" />` : ''}<b>${esc(sk?.nameVi ?? n.skill)}</b><small>${esc(n.branch)}${BATTLE_FX.skills[n.skill] ? ' · ★' : ''}</small></button>`;
        })
        .join('')}</div>`)
      .join('')}</section>`;
  };
  const close = openModal({
    title: 'Cây kỹ năng',
    body: `<div class="btree">${CLASS_LIST.map((c) => tree(c.id)).join('')}</div>`,
    submit: 'Đóng',
    wide: true,
    onSubmit: () => undefined,
    onOpen: (form) => {
      for (const b of form.querySelectorAll<HTMLButtonElement>('[data-pick]')) {
        b.onclick = () => {
          close();
          pick(b.dataset.pick!);
        };
      }
    },
  });
}

export function renderBattleLab(root: HTMLElement) {
  lab.root = root;
  if (!lab.raw) {
    root.innerHTML = '<p class="muted">Đang tải <code>battle_fx.json</code>…</p>';
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
  const opt = (id: string, label: string, cur: string, v: Visual = {}) => optionHtml(id, label, id === cur, v);
  const pic = (id: string) => {
    const row = lab.images.get(id);
    return row?.asset ? `/assets/${row.asset}` : null;
  };
  const creatureName = (id: string) => ENEMY_LIST.find((e) => e.art === id)?.nameVi ?? state.pigs.find((p) => p.id === id)?.nameVi ?? (id.startsWith('fish_') ? 'Cá' : '');
  const skillPic = (id: string, element: string | null) => pic(`ui_${id}`) ?? (element && element !== 'SELF' ? pic(`ui_icon_elem_${element.toLowerCase()}`) : null) ?? pic('ui_icon_adv_skill');
  // Combat animals (pigs, fish) and monsters are listed apart: the side that strikes and the side that is struck each get their own kind.
  const animals = [...lab.images.values()].filter((r) => /^(pig_|fish_)/.test(r.id) && !/_(hurt|sleep|wake)$/.test(r.id)).map((r) => r.id);
  const monsters = ENEMY_LIST.map((e) => e.art);
  const cur: Side = lab.fromEnemy ? 'enemy' : 'ally';
  const SKILL_TYPES: Record<Side, readonly (readonly [string, string, string])[]> = {
    ally: [['', 'Mọi loại', '🗂️'], ['class', 'Chức nghiệp', '🎓'], ['unique', 'Độc nhất', '⭐'], ['ultimate', 'Tuyệt kỹ', '💥']],
    enemy: [['', 'Mọi loại', '🗂️'], ['enemy', 'Kỹ năng quái', '👹']],
  };
  /** The skill choice shown in a block: the striking side's is live, the other side's is remembered. */
  const choice = (side: Side) => (side === cur ? { type: lab.skillType, skill: lab.skill } : { type: lab.mem[side].skillType, skill: lab.mem[side].skill });
  const element = SKILLS[lab.skill]?.element ?? null;
  const look = lookOf(element === 'SELF' ? null : element, lab.skill || null);
  const allyArt = lab.fromEnemy ? lab.target : lab.attacker;
  const def = lab.skill ? SKILLS[lab.skill] : undefined;
  const flags = [['crit', 'Chí mạng'], ['ko', 'Kết liễu'], ['reduce', 'Giảm chuyển động'], ['phase', 'Trùm đổi pha'], ['win', 'Thắng trận']] as const;
  const foeArt = lab.fromEnemy ? lab.attacker : lab.target;
  const lines = (text: string) => Array.from({ length: text.split('\n').length }, (_, n) => n + 1).join('\n');
  const ownText = lab.skill ? JSON.stringify(ownRaw(), null, 2) : '';
  const bad = !!lab.message && !lab.message.startsWith('✓');
  const picks = (list: readonly string[], chosen: string) => list.map((c) => opt(c, creatureName(c) || c, chosen, { img: pic(c), sub: c })).join('');
  const sideBlock = (side: Side) => {
    const ally = side === 'ally';
    const c = choice(side);
    const list = SKILL_LIST.filter((x) => ((x.type === 'enemy') === !ally && (!c.type || x.type === c.type)) || x.id === c.skill);
    const mine = ally ? allyArt : foeArt;
    const other = ally ? foeArt : allyArt;
    const chips = ally ? lab.allies : lab.foes;
    return `<div class="bside bside--${side}${side === cur ? ' is-acting' : ''}" data-side="${side}">
      <div class="bside__head"><span class="bside__badge">${ally ? '🛡️' : '👹'}</span><b>${ally ? 'Đồng minh (Phe ta)' : 'Quái vật (Phe địch)'}</b>
        <button type="button" class="bside__act" data-act="${side}" aria-pressed="${side === cur}">${side === cur ? '● Đang ra đòn' : '○ Cho bên này ra đòn'}</button></div>
      <div class="blab__grid">
        <label class="field"><span>Loại kỹ năng</span><select data-skilltype="${side}" data-rich>${SKILL_TYPES[side].map(([v, l, i]) => opt(v, l, c.type, { icon: i })).join('')}</select></label>
        <div class="field blab__wide"><span>Kỹ năng</span><div class="blab__row"><select data-skill="${side}" data-rich>${opt('', 'Đánh thường', c.skill, { img: pic('ui_icon_adv_attack'), sub: 'Đòn thường, không kỹ năng' })}${list.map((x) => opt(x.id, x.nameVi, c.skill, { img: skillPic(x.id, x.element ?? null), sub: `${x.element ? (ELEMENT_NAMES[x.element as keyof typeof ELEMENT_NAMES]?.nameVi ?? x.element) : 'Không hệ'} · ${x.category}${BATTLE_FX.skills[x.id] ? ' · ★ có animation riêng' : ''}` })).join('')}</select>${ally ? '<button type="button" class="btn blab__tree" data-tree>🌳 Cây kỹ năng</button>' : ''}</div></div>
        <label class="field"><span>${ally ? 'Bên ra đòn' : 'Quái ra đòn'}</span><select data-art="${side}" data-rich>${picks(ally ? animals : monsters, mine)}</select></label>
        <div class="field"><span>${ally ? 'Đội hình (phe ta)' : 'Đội hình (phe địch)'}</span><div class="blab__team">${[0, 1, 2].map((n) => `<button type="button" class="blab__chip${n < chips ? ' is-on' : ''}" data-team="${side}:${n}" title="${n + 1} ${ally ? 'đồng đội' : 'quái'}">${pic(mine) ? `<img src="${pic(mine)}" alt="" />` : '🐷'}</button>`).join('')}</div></div>
        <label class="field"><span>${ally ? 'Quái nhận đòn' : 'Bên nhận đòn'}</span><select data-art="${ally ? 'enemy' : 'ally'}" data-rich>${picks(ally ? monsters : animals, other)}</select></label>
        <label class="field"><span>Số quái</span><select data-count="foes" data-rich>${[1, 2, 3].map((n) => opt(String(n), `${n} quái`, String(lab.foes), { icon: '👾' })).join('')}</select></label>
        <label class="field"><span>Tha hóa của quái</span><select data-count="corruption" data-rich>${[0, 1, 2, 3, 4, 5].map((n) => opt(String(n), n ? `Cấp ${n}` : 'Không tha hóa', String(lab.corruption), { swatch: ['#9fd36b', '#c9b7e8', '#a98bd8', '#8460c4', '#6a3fae', '#4a1f86'][n]!, sub: n >= 3 ? 'Có hào quang tối' : '' })).join('')}</select></label>
      </div>
      ${ally ? '' : `<details class="blab__react"><summary>Phản ứng nguyên tố</summary><div class="blab__reactbody"><label class="field"><span>Phản ứng</span><select data-reaction data-rich>${opt('', 'Không có', lab.reaction, { icon: '—' })}${REACTIONS.map((x) => opt(x, REACTION_ROWS[x]?.nameVi ?? x, lab.reaction, { img: pic(reactionArt(x)), sub: x })).join('')}</select></label></div></details>`}
      ${ally ? '' : `<div class="blab__flags">${flags.map(([k, label]) => `<label class="check"><input type="checkbox" data-flag="${k}"${(lab as unknown as Record<string, boolean>)[k] ? ' checked' : ''} /> ${label}</label>`).join('')}</div>`}
    </div>`;
  };
  root.innerHTML = `<div class="blab">
    <p class="muted">Thiết kế và kiểm thử animation các kỹ năng trong trận đấu, trên đúng sân trận Phaser của game. Cách viết: <code>docs/animation/COMBAT_ART_GUIDE.md</code> §4.</p>
    <div class="blab__stagegrid">
      <section class="blab__card blab__col blab__col--ally">
        <div class="blab__cardbody">${sideBlock('ally')}</div>
      </section>
      <section class="blab__card blab__col blab__col--stage">
        <div class="blab__cardhead"><h3>▶ Xem trước animation</h3></div>
        <div class="blab__bar">
          <button class="btn btn-primary btn-small" data-play>▶ Chạy</button>
          <button class="btn btn-small" data-enter>Vào trận</button>
          <button class="btn btn-small" data-pause>⏸ Tạm dừng</button>
          <button class="btn btn-small" data-replay>⟲ Phát lại</button>
          <label class="blab__speed">Tốc độ <select data-speed><option value="1"${lab.fast ? '' : ' selected'}>100%</option><option value="2"${lab.fast ? ' selected' : ''}>×2 (nhanh)</option></select></label>
          <span class="blab__spacer"></span>
          <button class="btn btn-small" data-full title="Toàn màn hình">⛶</button>
          <button class="btn btn-small" data-shot title="Chụp ảnh sân khấu">📷</button>
        </div>
        <div class="blab__stage" data-stage></div>
        <div class="blab__time"><div class="blab__track"><i data-fill></i></div><span data-time>00:00.0 / 00:00.0</span></div>
      </section>
      <section class="blab__card blab__col blab__col--enemy">
        <div class="blab__cardbody">${sideBlock('enemy')}</div>
      </section>
    </div>
    <div class="blab__cols">
      <section class="blab__card">
        <div class="blab__cardhead"><h3>✨ Kỹ năng đang chọn</h3></div>
        <div class="blab__skill">
          <img src="${skillPic(lab.skill, def?.element ?? null) ?? pic('ui_icon_adv_attack') ?? ''}" alt="" />
          <div><b>${esc(def?.nameVi ?? 'Đánh thường')}</b>${lab.skill && BATTLE_FX.skills[lab.skill] ? ' <span class="blab__tag">★ có animation riêng</span>' : ''}<p class="muted">${esc(def?.descVi ?? 'Tấn công cơ bản, gây sát thương cho mục tiêu.')}</p></div>
          <span class="blab__valid" data-valid></span>
        </div>
        <div class="blab__editor">
          <pre class="blab__lines" data-lines>${lab.skill ? lines(ownText) : ''}</pre>
          <textarea data-own rows="14" wrap="off" spellcheck="false"${lab.skill ? '' : ' disabled'}>${esc(lab.skill ? ownText : 'Chọn một kỹ năng để sửa phần riêng.')}</textarea>
        </div>
        <pre data-msg class="${bad ? 'error' : 'ok'}">${bad ? esc(lab.message) : ''}</pre>
        <div class="blab__actions">
          <button class="btn btn-small" data-undo${lab.skill ? '' : ' disabled'} title="Hoàn tác">↶</button>
          <button class="btn btn-small" data-redo${lab.skill ? '' : ' disabled'} title="Làm lại">↷</button>
          <button class="btn btn-small" data-revert${lab.skill ? '' : ' disabled'} title="Về bản đang lưu trong game (so sánh trước / sau)">⟲ Về bản lưu</button>
          <button class="btn btn-small" data-format${lab.skill ? '' : ' disabled'}>⟳ Định dạng lại</button>
          <button class="btn btn-small" data-try${lab.skill ? '' : ' disabled'}>▶ Áp dụng thử</button>
          <button class="btn btn-primary btn-small" data-save${lab.skill && lab.online ? '' : ' disabled'}>💾 Lưu hiệu ứng trận</button>
        </div>
        <details class="blab__merged"><summary>Công thức đã gộp (hệ + phần riêng)</summary><pre class="muted">${esc(JSON.stringify({ ...look, color: `#${look.color.toString(16).padStart(6, '0')}`, glow: `#${look.glow.toString(16).padStart(6, '0')}` }, null, 1))}</pre></details>
      </section>
    </div>
    <footer class="blab__status${bad ? ' is-bad' : ''}"><span>${bad ? '⚠️' : '✅'} ${esc((lab.message || 'Sẵn sàng. Chọn kỹ năng rồi nhấn Chạy để xem thử animation!').split('\n')[0]!)}</span><span class="muted">Mẹo: ⛶ xem toàn màn hình, 📷 lưu ảnh sân khấu.</span></footer>
  </div>`;
  const q = <T extends HTMLElement>(sel: string) => root.querySelector<T>(sel)!;
  mountGame(q('[data-stage]'));
  // The redraw guard (tools/admin/redraw.ts) keeps the scroll, the focus and the page height of this rebuild.
  const redo = () => renderBattleLab(root);
  // Choosing a skill (or its type) in a block makes that side the one that strikes: the sides swap their remembered choices and arts.
  const strike = (side: Side) => {
    if (side === cur) return;
    lab.mem[cur] = { skillType: lab.skillType, skill: lab.skill };
    lab.skillType = lab.mem[side].skillType;
    lab.skill = lab.mem[side].skill;
    lab.fromEnemy = side === 'enemy';
    [lab.attacker, lab.target] = [lab.target, lab.attacker];
  };
  for (const b of root.querySelectorAll<HTMLButtonElement>('[data-act]')) b.onclick = () => (strike(b.dataset.act as Side), (lab.message = ''), redo());
  for (const sel of root.querySelectorAll<HTMLSelectElement>('select[data-skill]')) {
    sel.onchange = () => {
      strike(sel.dataset.skill as Side);
      lab.skill = sel.value;
      lab.message = '';
      redo();
    };
  }
  for (const sel of root.querySelectorAll<HTMLSelectElement>('select[data-skilltype]')) {
    sel.onchange = () => {
      strike(sel.dataset.skilltype as Side);
      lab.skillType = sel.value;
      if (lab.skill && lab.skillType && SKILLS[lab.skill]?.type !== lab.skillType) lab.skill = '';
      redo();
    };
  }
  // A creature picker sets the art of the ally or of the foe, whichever side strikes.
  for (const sel of root.querySelectorAll<HTMLSelectElement>('select[data-art]')) {
    sel.onchange = () => {
      const isAlly = sel.dataset.art === 'ally';
      if (isAlly === !lab.fromEnemy) lab.attacker = sel.value;
      else lab.target = sel.value;
      redo();
    };
  }
  q('[data-tree]').onclick = () => openTreeDialog(pic, skillPic, (id) => (strike('ally'), (lab.skill = id), (lab.skillType = ''), (lab.message = ''), redo()));
  for (const chip of root.querySelectorAll<HTMLButtonElement>('[data-team]')) {
    chip.onclick = () => {
      const [side, i] = chip.dataset.team!.split(':');
      const n = Number(i) + 1;
      if (side === 'ally') lab.allies = n === lab.allies ? Math.max(1, n - 1) : n;
      else lab.foes = n === lab.foes ? Math.max(1, n - 1) : n;
      redo();
    };
  }
  for (const flag of root.querySelectorAll<HTMLInputElement>('[data-flag]')) flag.onchange = () => ((lab as unknown as Record<string, boolean>)[flag.dataset.flag!] = flag.checked);
  for (const sel of root.querySelectorAll<HTMLSelectElement>('[data-count]')) {
    sel.onchange = () => {
      (lab as unknown as Record<string, number>)[sel.dataset.count!] = Number(sel.value);
      redo();
    };
  }
  q<HTMLSelectElement>('[data-reaction]').onchange = (e) => (lab.reaction = (e.target as HTMLSelectElement).value);
  // Space pauses, R plays again, outside text fields only; one listener for the life of the page.
  if (!lab.keys) {
    lab.keys = true;
    document.addEventListener('keydown', (e) => {
      const t = e.target as HTMLElement | null;
      if (!lab.root?.isConnected || e.ctrlKey || e.metaKey || e.altKey || (t && (t.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT', 'BUTTON'].includes(t.tagName)))) return;
      if (e.code === 'Space') {
        e.preventDefault();
        lab.root.querySelector<HTMLElement>('[data-pause]')?.click();
      }
      else if (e.code === 'KeyR') lab.root.querySelector<HTMLElement>('[data-replay]')?.click();
    });
  }
  q('[data-play]').onclick = () => play();
  q('[data-enter]').onclick = () => play(true);
  q('[data-replay]').onclick = () => play(lab.lastEnter);
  q('[data-pause]').onclick = () => (q('[data-pause]').textContent = togglePause() ? '▶ Tiếp tục' : '⏸ Tạm dừng');
  q<HTMLSelectElement>('[data-speed]').onchange = (e) => (lab.fast = (e.target as HTMLSelectElement).value === '2');
  const stage = q('[data-stage]');
  q('[data-full]').onclick = () => void (document.fullscreenElement ? document.exitFullscreen() : stage.requestFullscreen());
  stage.onfullscreenchange = () => lab.game?.scale.resize(stage.clientWidth, stage.clientHeight);
  q('[data-shot]').onclick = () =>
    lab.game?.renderer.snapshot((img) => {
      const a = document.createElement('a');
      a.href = (img as HTMLImageElement).src;
      a.download = `animation-${lab.skill || 'attack'}.png`;
      a.click();
    });
  // The clock under the stage: how far the step has played.
  window.clearInterval(lab.timer);
  const fill = q('[data-fill]');
  const time = q('[data-time]');
  lab.timer = window.setInterval(() => {
    if (!fill.isConnected) {
      window.clearInterval(lab.timer);
      // The page was left (not just redrawn: a redraw clears this timer first): nothing keeps running behind it.
      lab.game?.destroy(true);
      lab.game = null;
      lab.mountKey = '';
      return;
    }
    const total = lab.step ? Math.max(0, lab.step.motion.total) : 0;
    const t = lab.step ? Math.min(total, Math.max(0, (lab.pausedAt || performance.now()) - lab.step.at)) : 0;
    fill.style.width = total ? `${(t / total) * 100}%` : '0%';
    time.textContent = `${clock(t)} / ${clock(total)}`;
  }, 80);
  // The editor: line numbers, and whether what is written would be accepted.
  const box = q<HTMLTextAreaElement>('[data-own]');
  const gutter = q('[data-lines]');
  const valid = q('[data-valid]');
  const judge = () => {
    gutter.textContent = lab.skill ? lines(box.value) : '';
    if (!lab.skill) return void (valid.textContent = '');
    try {
      const r = withOwn(JSON.parse(box.value || '{}') as Record<string, unknown>, false);
      valid.textContent = r.error ? '✗ Chưa hợp lệ' : '✓ Hợp lệ';
      valid.title = r.error ?? ''; // the reason, field by field, on hover
      valid.className = `blab__valid ${r.error ? 'is-bad' : 'is-ok'}`;
    } catch {
      valid.textContent = '✗ JSON sai';
      valid.className = 'blab__valid is-bad';
    }
  };
  // Undo / redo of the editor's own history (programmatic changes such as "format" keep native undo out of play).
  const hist = { stack: [box.value], at: 0 };
  const record = () => {
    if (hist.stack[hist.at] === box.value) return;
    hist.stack = [...hist.stack.slice(0, hist.at + 1), box.value].slice(-100);
    hist.at = hist.stack.length - 1;
  };
  const jump = (to: number) => {
    hist.at = Math.max(0, Math.min(hist.stack.length - 1, to));
    box.value = hist.stack[hist.at]!;
    judge();
  };
  q('[data-undo]').onclick = () => jump(hist.at - 1);
  q('[data-redo]').onclick = () => jump(hist.at + 1);
  q('[data-revert]').onclick = () => {
    box.value = ownText;
    record();
    judge();
  };
  box.oninput = () => (record(), judge());
  box.onscroll = () => (gutter.scrollTop = box.scrollTop);
  judge();
  q('[data-format]').onclick = () => {
    try {
      box.value = JSON.stringify(JSON.parse(box.value || '{}'), null, 2);
      record();
      judge();
    } catch (e) {
      q('[data-msg]').textContent = `JSON sai: ${(e as Error).message}`;
    }
  };
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
