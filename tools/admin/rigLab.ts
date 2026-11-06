// Admin "Xưởng rig" (decision 050): plays a creature's puppet (content/anim/rigs/<rig>.json) clip by clip on the battle backdrop, slowed
// down if wanted, with its bones drawn over it and its old key-pose picture beside it (before / after). "Cả đội" plays the same action on
// every rig side by side, so species can be compared (a boar is quick, a turtle heavy, a fish flows, an octopus curls). Reads only.
import * as Phaser from 'phaser';
import { RIGS } from '../../src/systems/animation';
import { Puppet } from '../../src/ui/puppet/puppet';
import { esc } from './labels';
import { json } from './store';
import { vi } from '../../src/i18n/vi';
import enemiesJson from '../../content/adventure/enemies.json';
import './rigLab.css';

type Row = { id: string; asset?: string; nameVi?: string };
type Cat = 'all' | 'pig' | 'enemy' | 'aquatic';
const ACTIONS = ['idle', 'move', 'attack', 'cast', 'hurt', 'hurt_heavy', 'ko', 'victory', 'guard', 'stunned', 'buff', 'dodge'] as const;
/** The old key pose (cb_<art>_<pose>) closest to an action, for the before / after view. */
const OLD_POSE: Record<string, string> = { idle: 'idle', move: 'idle', attack: 'attack', cast: 'cast', hurt: 'hurt', hurt_heavy: 'hurt', ko: 'ko', victory: 'victory', guard: 'idle', stunned: 'hurt', buff: 'victory', dodge: 'idle' };

const lab = {
  rig: [...RIGS.keys()][0] ?? '',
  action: 'idle' as string,
  speed: 1,
  bones: false,
  old: true,
  all: false,
  /** Eight frames of the clip side by side (each its own puppet at a fixed time): the clip read like a storyboard. */
  strip: false,
  mirrored: false,
  /** Sidebar filters: category tab + free-text search. */
  cat: 'all' as Cat,
  q: '',
  /** Bumped to replay a one-shot clip. */
  take: 0,
  images: new Map<string, Row>(),
  game: null as Phaser.Game | null,
  root: null as HTMLElement | null,
};

class RigLabScene extends Phaser.Scene {
  private puppets = new Map<string, Puppet>();
  private olds = new Map<string, Phaser.GameObjects.Image>();
  private gfx!: Phaser.GameObjects.Graphics;
  private label!: Phaser.GameObjects.Text;
  private clock = 0;
  private last = 0;
  private startedAt = 0;
  private seenTake = -1;
  private asked = new Set<string>();

  constructor() {
    super('rig-lab');
  }

  preload() {
    const bg = lab.images.get('bg_adventure_forest');
    if (bg?.asset) this.load.image('bg', `/assets/${bg.asset}`);
  }

  create() {
    if (this.textures.exists('bg')) this.add.image(this.scale.width / 2, this.scale.height / 2, 'bg').setDisplaySize(this.scale.width, this.scale.height).setAlpha(0.85);
    this.gfx = this.add.graphics().setDepth(5000);
    this.label = this.add.text(12, 10, '', { fontFamily: 'monospace', fontSize: '13px', color: '#fff', backgroundColor: '#0008', padding: { x: 6, y: 4 } }).setDepth(5001);
  }

  private want = (id: string) => {
    if (this.asked.has(id) || this.textures.exists(id)) return;
    this.asked.add(id);
    const row = lab.images.get(id);
    if (!row?.asset) return;
    this.load.image(id, `/assets/${row.asset}`);
    if (!this.load.isLoading()) this.load.start();
  };

  private puppet(rigId: string): Puppet {
    let p = this.puppets.get(rigId);
    if (!p) {
      p = new Puppet(this, RIGS.get(rigId)!, `lab:${rigId}`, this.want);
      this.puppets.set(rigId, p);
    }
    return p;
  }

  override update() {
    const real = performance.now();
    const dt = this.last ? Math.min(50, real - this.last) : 16;
    this.last = real;
    this.clock += dt * lab.speed;
    if (this.seenTake !== lab.take) {
      this.seenTake = lab.take;
      this.startedAt = this.clock;
    }
    if (lab.strip) return this.drawStrip();
    for (const p of this.stripPuppets.values()) p.hide();
    const shown = lab.all ? [...RIGS.keys()] : [lab.rig];
    const W = this.scale.width;
    const H = this.scale.height;
    this.gfx.clear();
    for (const [id, p] of this.puppets) if (!shown.includes(id)) p.hide();
    for (const [id, img] of this.olds) img.setVisible(lab.old && !lab.all && id === lab.rig);
    const lines: string[] = [];
    shown.forEach((id, i) => {
      const p = this.puppet(id);
      const rig = p.rig;
      const slot = lab.all ? (i + 0.5) / shown.length : lab.old ? 0.68 : 0.5;
      const height = lab.all ? H * 0.3 : H * 0.55;
      const scale = height / rig.height;
      const x = W * slot;
      const y = H * 0.86;
      const clip = rig.clips[p.performer.clipName(lab.action)];
      // One-shots play again a little after they end, so they can be watched in a loop.
      const len = clip ? clip.len / rig.feel.tempo : 1000;
      const t = clip?.loop ? this.clock - this.startedAt : (this.clock - this.startedAt) % (len + 700);
      const action = clip?.loop || t <= len + 80 ? lab.action : 'idle';
      // A looping clip keeps one key for the whole take: a new key would restart it mid-cycle.
      const round = clip?.loop ? 0 : Math.floor((this.clock - this.startedAt) / (len + 700));
      const f = p.update(this.clock, { action, key: `${lab.take}:${round}` }, { x, y, scale, mirrored: lab.mirrored, depth: 100 + i });
      if (f) lines.push(`${id}: ${f.clip} ${Math.round(f.t)}ms`);
      if (f && lab.bones) this.drawBones(p, f.worlds);
      if (!lab.all) this.drawOld(id, W * 0.24, y, height);
    });
    this.label.setText([`×${lab.speed}`, ...lines].join('   '));
  }

  private stripPuppets = new Map<string, Puppet>();

  /** The clip as eight frames side by side, two rows, each at a fixed time of the clip (0 → its end). */
  private drawStrip() {
    const W = this.scale.width;
    const H = this.scale.height;
    this.gfx.clear();
    for (const p of this.puppets.values()) p.hide();
    for (const img of this.olds.values()) img.setVisible(false);
    for (const [k, p] of this.stripPuppets) if (!k.startsWith(`${lab.rig}#`)) p.hide();
    const rig = RIGS.get(lab.rig)!;
    const N = 8;
    const lines: string[] = [];
    for (let i = 0; i < N; i++) {
      const key = `${lab.rig}#${i}`;
      let p = this.stripPuppets.get(key);
      if (!p) {
        p = new Puppet(this, rig, `strip:${i}`, this.want);
        this.stripPuppets.set(key, p);
      }
      const name = p.performer.clipName(lab.action);
      const clip = rig.clips[name]!;
      const t = (clip.len * i) / (N - 1);
      const col = i % 4;
      const row = Math.floor(i / 4);
      const scale = (H * 0.3) / rig.height;
      const f = p.update(this.clock, { action: lab.action, key: `${lab.take}`, timing: { t: t / rig.feel.tempo } }, { x: W * (0.125 + col * 0.25), y: H * (0.46 + row * 0.48), scale, mirrored: lab.mirrored, depth: 100 + i });
      if (f) lines.push(`${Math.round(t)}`);
      if (f && lab.bones) this.drawBones(p, f.worlds);
    }
    this.label.setText(`${lab.rig} · ${lab.action} · ms: ${lines.join(' / ')}`);
  }

  private drawBones(p: Puppet, worlds: ReadonlyMap<string, { x: number; y: number }>) {
    this.gfx.lineStyle(2, 0x33e0ff, 0.9);
    for (const b of p.rig.bones) {
      const a = p.point(b.id);
      if (!a) continue;
      const parent = b.parent ? p.point(b.parent) : null;
      if (parent) this.gfx.lineBetween(parent.x, parent.y, a.x, a.y);
      this.gfx.fillStyle(0xffe14a, 1).fillCircle(a.x, a.y, 3.5);
    }
    this.gfx.lineStyle(2, 0xff7ad0, 0.9);
    for (const c of p.rig.chains) {
      const a = p.point(c.id);
      const tip = worlds.has(`${c.id}:tip`) ? p.point(`${c.id}:tip`) : null;
      if (a && tip) this.gfx.lineBetween(a.x, a.y, tip.x, tip.y);
    }
  }

  /** The old picture of this action (key pose), standing at the left: the "before". */
  private drawOld(rigId: string, x: number, y: number, height: number) {
    if (!lab.old) return;
    const key = `cb_${rigId}_${OLD_POSE[lab.action] ?? (lab.action.startsWith('g_') || lab.action === 'ultimate' ? 'cast' : 'idle')}`;
    const fallback = lab.images.has(key) ? key : lab.images.has(rigId) ? rigId : null;
    if (!fallback) return;
    this.want(fallback);
    if (!this.textures.exists(fallback)) return;
    let img = this.olds.get(rigId);
    if (!img) {
      img = this.add.image(x, y, fallback).setOrigin(0.5, 1).setDepth(90);
      this.olds.set(rigId, img);
    }
    if (img.texture.key !== fallback) img.setTexture(fallback);
    const fit = (height * 1.25) / Math.max(img.width, img.height);
    img.setPosition(x, y).setScale(fit * (lab.mirrored ? -1 : 1), fit).setVisible(true);
  }
}

function mount(host: HTMLElement) {
  lab.game?.destroy(true);
  lab.game = new Phaser.Game({ type: Phaser.WEBGL, parent: host, width: host.clientWidth, height: host.clientHeight, transparent: true, banner: false, audio: { noAudio: true }, scene: [new RigLabScene()] });
  (window as unknown as { rigLab?: { game: Phaser.Game; lab: typeof lab } }).rigLab = { game: lab.game, lab };
}

const ACTION_LABEL: Record<string, string> = {
  idle: 'Đứng yên', move: 'Di chuyển', attack: 'Tấn công', cast: 'Niệm chiêu', hurt: 'Bị đau', hurt_heavy: 'Đau nặng', ko: 'Gục ngã', victory: 'Chiến thắng',
  guard: 'Thủ thế', stunned: 'Choáng', buff: 'Tăng cường', dodge: 'Né tránh',
  g_brace: 'Gồng mình', g_breath: 'Phun hơi', g_charge: 'Húc tới', g_lash: 'Quất', g_slam: 'Đập xuống', g_channel: 'Tụ lực', g_roar: 'Gầm thét', g_shoot: 'Bắn', g_summon_ground: 'Triệu hồi (đất)', g_summon_sky: 'Triệu hồi (trời)', ultimate: 'Tuyệt chiêu',
};
const ACTION_ICON: Record<string, string> = { idle: '🧍', move: '🏃', attack: '⚔️', cast: '✨', hurt: '💢', hurt_heavy: '💥', ko: '💫', victory: '🏆', guard: '🛡️', stunned: '😵', buff: '⬆️', dodge: '💨' };
const PLAN_LABEL: Record<string, string> = { quadruped: 'Bốn chân', heavy: 'Nặng nề', cephalopod: 'Xúc tu', aquatic: 'Thủy sinh' };
const CAT_LABEL: Record<Cat, string> = { all: 'Tất cả', pig: '🐷 Heo', enemy: '👾 Kẻ địch', aquatic: '🐟 Thủy sinh' };
const SPEEDS = [1, 0.5, 0.25];

const enemyNames = new Map<string, string>((enemiesJson as { enemies: { id: string; nameVi: string }[] }).enemies.map((e) => [e.id, e.nameVi]));
const viMap = vi as unknown as Record<string, string>;

const catOf = (id: string): Cat => (id.startsWith('pig_') ? 'pig' : id.startsWith('enemy_') ? 'enemy' : 'aquatic');
/** Vietnamese display name of a rig: manifest (pigs), enemies.json, or the fish item strings. */
function nameOf(id: string): string {
  const fromManifest = lab.images.get(id)?.nameVi;
  if (fromManifest) return fromManifest;
  return enemyNames.get(id) ?? viMap[`item_${id.startsWith('fish_') ? id : `fish_${id}`}`] ?? id;
}
/** Thumbnail url: the idle key pose, else the plain portrait. */
function thumbOf(id: string): string {
  const row = lab.images.get(`cb_${id}_idle`) ?? lab.images.get(id) ?? lab.images.get(`fish_${id}`);
  return row?.asset ? `/assets/${row.asset}` : '';
}
const matches = (id: string) => (lab.cat === 'all' || catOf(id) === lab.cat) && (!lab.q || `${nameOf(id)} ${id}`.toLowerCase().includes(lab.q.toLowerCase()));

function grid(): string {
  const cards = [...RIGS.values()]
    .filter((r) => matches(r.id))
    .map((r) => {
      const img = thumbOf(r.id);
      return `<button class="rl-card${!lab.all && r.id === lab.rig ? ' on' : ''}" data-rig="${r.id}" title="${esc(r.id)}">
      <span class="rl-thumb">${img ? `<img src="${esc(img)}" loading="lazy" alt="">` : '❔'}</span>
      <b>${esc(nameOf(r.id))}</b><small>${esc(PLAN_LABEL[r.plan] ?? r.plan)}</small></button>`;
    })
    .join('');
  return cards || '<p class="rl-empty">Không có sinh vật phù hợp.</p>';
}

function sidebar(): string {
  const all = [...RIGS.values()];
  const count = (c: Cat) => all.filter((r) => c === 'all' || catOf(r.id) === c).length;
  const tabs = (Object.keys(CAT_LABEL) as Cat[]).map((c) => `<button class="rl-tab${lab.cat === c ? ' on' : ''}" data-cat="${c}">${CAT_LABEL[c]} <i>${count(c)}</i></button>`).join('');
  return `<div class="rl-tabs">${tabs}</div>
    <input class="rl-search" type="search" placeholder="Tìm theo tên hoặc id…" value="${esc(lab.q)}" data-search>
    <button class="rl-all${lab.all ? ' on' : ''}" data-all>👥 Cả đội — so sánh tất cả</button>
    <div class="rl-grid">${grid()}</div>`;
}

function toolbar(): string {
  const chip = (on: boolean, attr: string, label: string) => `<button class="rl-chip${on ? ' on' : ''}" ${attr}>${esc(label)}</button>`;
  const shownRigs = lab.all ? [...RIGS.values()] : [RIGS.get(lab.rig)!];
  const skillClips = [...new Set(shownRigs.flatMap((r) => Object.keys(r.clips).filter((k) => k.startsWith('g_') || k === 'ultimate')))].sort();
  const acts = ACTIONS.map((a) => chip(a === lab.action, `data-act="${a}"`, `${ACTION_ICON[a] ?? ''} ${ACTION_LABEL[a] ?? a}`)).join('');
  const skills = skillClips.map((a) => chip(a === lab.action, `data-act="${a}"`, ACTION_LABEL[a] ?? a)).join('');
  const toggle = (on: boolean, attr: string, label: string) => `<label class="rl-sw"><input type="checkbox" ${attr} ${on ? 'checked' : ''}><span></span>${esc(label)}</label>`;
  return `
    <div class="rl-row"><span class="rl-lbl">Hành động</span><div class="rl-chips">${acts}</div></div>
    <div class="rl-row"><span class="rl-lbl">Cử chỉ skill</span><div class="rl-chips">${skills || '<small class="rl-empty">Không có</small>'}</div></div>
    <div class="rl-row rl-opts">
      <div class="rl-seg"><span>Tốc độ</span>${SPEEDS.map((x) => `<button class="${x === lab.speed ? 'on' : ''}" data-speed="${x}">×${x}</button>`).join('')}</div>
      <button class="rl-chip rl-replay" data-replay>↻ Phát lại</button>
      ${toggle(lab.old, 'data-old', 'So với ảnh cũ')}${toggle(lab.bones, 'data-bones', 'Hiện xương')}${toggle(lab.mirrored, 'data-mirror', 'Quay trái')}${toggle(lab.strip, 'data-strip', 'Dải 8 khung')}
    </div>`;
}

function header(): string {
  if (lab.all) return `<h3>Cả đội <small>${RIGS.size} sinh vật cùng làm một hành động để so sánh</small></h3><span class="rl-now">${esc(ACTION_LABEL[lab.action] ?? lab.action)}</span>`;
  const r = RIGS.get(lab.rig);
  if (!r) return '';
  const img = thumbOf(r.id);
  return `${img ? `<img class="rl-head-img" src="${esc(img)}" alt="">` : ''}<h3>${esc(nameOf(r.id))} <small>${esc(r.id)} · ${esc(PLAN_LABEL[r.plan] ?? r.plan)} · ${Object.keys(r.clips).length} clip</small></h3>
    <span class="rl-now">${esc(ACTION_LABEL[lab.action] ?? lab.action)}</span>`;
}

export function renderRigLab(root: HTMLElement) {
  lab.root = root;
  if (lab.images.size === 0) {
    root.innerHTML = '<p class="muted">Đang tải manifest…</p>';
    void json<Record<string, unknown>>('/assets/manifest/assets.json').then((m) => {
      for (const rows of Object.values(m)) if (Array.isArray(rows)) for (const row of rows as Row[]) lab.images.set(row.id, row);
      renderRigLab(root);
    });
    return;
  }
  root.innerHTML = `
    <section class="rl">
      <aside class="rl-side"></aside>
      <div class="rl-main">
        <div class="rl-head"></div>
        <div class="rl-stage"></div>
        <div class="rl-toolbar"></div>
        <p class="rl-note">Rig cắt mảnh (decision 050): mỗi bộ phận một ảnh trên xương, clip theo khung khoá, lò xo cho tai / bờm / vỏ, chuỗi uốn cho đuôi / vây / xúc tu. Ảnh bộ phận hiện là bản <b>rig-proof</b> (chờ art vẽ tay theo <code>art_inbox/rig_*.md</code>).</p>
      </div>
    </section>`;
  const q = <T extends HTMLElement>(sel: string) => root.querySelector<T>(sel)!;
  const refresh = (searchOnly = false) => {
    if (searchOnly) q('.rl-grid').innerHTML = grid();
    else q('.rl-side').innerHTML = sidebar();
    q('.rl-head').innerHTML = header();
    q('.rl-toolbar').innerHTML = toolbar();
  };
  refresh();
  const section = q('.rl');
  section.addEventListener('click', (e) => {
    const t = (e.target as HTMLElement).closest('button');
    if (!t) return;
    if (t.dataset.cat) lab.cat = t.dataset.cat as Cat;
    if (t.dataset.rig) [lab.rig, lab.all] = [t.dataset.rig, false];
    if (t.dataset.act) lab.action = t.dataset.act;
    if (t.dataset.speed) lab.speed = Number(t.dataset.speed);
    if (t.hasAttribute('data-all')) lab.all = !lab.all;
    if (!t.dataset.cat) lab.take++;
    refresh();
  });
  section.addEventListener('input', (e) => {
    const t = e.target as HTMLInputElement;
    if (t.hasAttribute('data-search')) {
      lab.q = t.value;
      refresh(true);
    }
  });
  section.addEventListener('change', (e) => {
    const t = e.target as HTMLInputElement;
    if (t.hasAttribute('data-bones')) lab.bones = t.checked;
    if (t.hasAttribute('data-old')) lab.old = t.checked;
    if (t.hasAttribute('data-mirror')) lab.mirrored = t.checked;
    if (t.hasAttribute('data-strip')) lab.strip = t.checked;
  });
  mount(q('.rl-stage'));
}
