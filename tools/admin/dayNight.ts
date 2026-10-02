// Admin page "Ngày / Đêm" (DN): edit the DAY_NIGHT settings (enabled, phase start times, blend,
// transition) and preview any phase or time of day. Previews are pictures only — they never change
// the player's clock or save. "Lưu" writes src/core/config/dayNight.ts through the dev API.
import {
  DAY_NIGHT,
  DAY_PHASES,
  type DayNightSettings,
  type DayPhase,
} from '../../src/core/config/dayNight';
import { dayNightIssues, dayScene, formatHm, minuteOf } from '../../src/core/engine/dayNight';
import { paintPreview } from './dayNightPreview';
import { esc } from './labels';

const PHASE_LABEL: Record<DayPhase, string> = {
  dawn: '🌅 Bình minh',
  morning: '🌤 Buổi sáng',
  day: '☀ Ban ngày',
  afternoon: '☀ Buổi chiều',
  sunset: '🌇 Hoàng hôn',
  night: '🌙 Ban đêm',
};
const SAVED_KEY = 'unin-admin:daynight-saved';

type Preview =
  { kind: 'auto' } | { kind: 'phase'; phase: DayPhase } | { kind: 'time'; minute: number };

const page = {
  draft: clone(DAY_NIGHT),
  preview: { kind: 'auto' } as Preview,
  message: null as { kind: 'ok' | 'error'; text: string } | null,
  saving: false,
};

function clone(s: DayNightSettings): DayNightSettings {
  return { ...s, phases: { ...s.phases } };
}

const nowMinute = () => {
  const d = new Date();
  return minuteOf(d.getHours(), d.getMinutes());
};

export function renderDayNight(root: HTMLElement, apiOnline: boolean) {
  try {
    const text = sessionStorage.getItem(SAVED_KEY);
    sessionStorage.removeItem(SAVED_KEY);
    if (text) page.message = { kind: 'ok', text };
  } catch {
    /* storage blocked */
  }
  const d = page.draft;
  const times = DAY_PHASES.map(
    (p) => `<label class="field"><span>${PHASE_LABEL[p]}</span>
      <input type="time" data-phase="${p}" value="${esc(d.phases[p])}" /></label>`,
  ).join('');
  const buttons = [
    `<button class="btn btn-small" data-preview="auto">Auto</button>`,
    ...DAY_PHASES.map(
      (p) => `<button class="btn btn-small" data-preview="${p}">${PHASE_LABEL[p]}</button>`,
    ),
  ].join('');
  root.innerHTML = `
    <div class="dn">
      <section class="card dn__form">
        <h2>Cài đặt Ngày / Đêm</h2>
        <label class="check"><input type="checkbox" data-enabled ${d.enabled ? 'checked' : ''} /> Bật ngày/đêm theo giờ máy người chơi</label>
        <div class="form-grid">${times}</div>
        <div class="form-grid">
          <label class="field"><span>Chuyển pha (phút, quanh mốc giờ)</span>
            <input type="number" min="0" step="5" data-blend value="${d.blendMinutes}" /></label>
          <label class="field"><span>Hiệu ứng chuyển cảnh (ms)</span>
            <input type="number" min="0" step="500" data-transition value="${d.transitionMs}" /></label>
        </div>
        <ul class="dn__issues"></ul>
        <div class="dn__msg"></div>
        <div class="form-actions">
          <button class="btn" data-reset>Hoàn tác</button>
          <button class="btn btn-primary" data-dn-save ${apiOnline ? '' : 'disabled title="Chạy npm run admin để lưu"'}>💾 Lưu vào game</button>
        </div>
      </section>
      <section class="card dn__preview">
        <h2>Xem trước</h2>
        <div class="dn__buttons">${buttons}</div>
        <label class="field"><span>Xem thử theo giờ: <b data-time-label></b></span>
          <input type="range" min="0" max="1439" step="5" data-time /></label>
        <canvas width="800" height="450" class="dn__canvas"></canvas>
        <p class="dn__caption"><span data-caption></span> · <a data-open target="_blank" rel="noopener">Mở trong game (dev) ↗</a></p>
        <small>Chỉ là ảnh xem trước: không đổi giờ thật, không ghi save. Trong game dev (<code>?dev=1</code>) có ô chọn pha ở thanh công cụ.</small>
      </section>
    </div>`;
  wire(root);
  refresh(root);
}

function wire(root: HTMLElement) {
  const d = page.draft;
  root.querySelector<HTMLInputElement>('[data-enabled]')!.addEventListener('change', (e) => {
    d.enabled = (e.target as HTMLInputElement).checked;
    refresh(root);
  });
  root.querySelectorAll<HTMLInputElement>('[data-phase]').forEach((input) =>
    input.addEventListener('input', () => {
      d.phases[input.dataset.phase as DayPhase] = input.value;
      refresh(root);
    }),
  );
  root.querySelector<HTMLInputElement>('[data-blend]')!.addEventListener('input', (e) => {
    d.blendMinutes = Number((e.target as HTMLInputElement).value);
    refresh(root);
  });
  root.querySelector<HTMLInputElement>('[data-transition]')!.addEventListener('input', (e) => {
    d.transitionMs = Number((e.target as HTMLInputElement).value);
    refresh(root);
  });
  root.querySelectorAll<HTMLButtonElement>('[data-preview]').forEach((b) =>
    b.addEventListener('click', () => {
      const v = b.dataset.preview!;
      page.preview = v === 'auto' ? { kind: 'auto' } : { kind: 'phase', phase: v as DayPhase };
      refresh(root);
    }),
  );
  root.querySelector<HTMLInputElement>('[data-time]')!.addEventListener('input', (e) => {
    page.preview = { kind: 'time', minute: Number((e.target as HTMLInputElement).value) };
    refresh(root);
  });
  root.querySelector('[data-reset]')!.addEventListener('click', () => {
    page.draft = clone(DAY_NIGHT);
    page.message = null;
    renderDayNight(root, !root.querySelector('[data-dn-save]')?.hasAttribute('disabled'));
  });
  root.querySelector('[data-dn-save]')!.addEventListener('click', () => void save(root));
}

/** Validation, preview picture and captions for the current draft (inputs stay as typed). */
function refresh(root: HTMLElement) {
  const issues = dayNightIssues(page.draft);
  root.querySelector('.dn__issues')!.innerHTML = issues
    .map((i) => `<li class="status-error">⚠ ${esc(i)}</li>`)
    .join('');
  const save = root.querySelector<HTMLButtonElement>('[data-dn-save]')!;
  if (!save.title) save.disabled = issues.length > 0 || page.saving;
  const msg = page.message;
  root.querySelector('.dn__msg')!.innerHTML = msg
    ? `<div class="toast ${msg.kind}"><pre>${esc(msg.text)}</pre></div>`
    : '';

  const p = page.preview;
  const minute = p.kind === 'time' ? p.minute : nowMinute();
  const valid = issues.length === 0;
  const scene = valid
    ? dayScene(minute, page.draft, p.kind === 'phase' ? p.phase : null)
    : dayScene(minute, DAY_NIGHT, p.kind === 'phase' ? p.phase : null);
  root.querySelectorAll<HTMLButtonElement>('[data-preview]').forEach((b) => {
    const on =
      p.kind === 'phase'
        ? b.dataset.preview === p.phase
        : b.dataset.preview === 'auto' && p.kind === 'auto';
    b.classList.toggle('btn-primary', on);
  });
  const slider = root.querySelector<HTMLInputElement>('[data-time]')!;
  if (p.kind !== 'time') slider.value = String(minute);
  root.querySelector('[data-time-label]')!.textContent =
    p.kind === 'phase' ? '—' : formatHm(minute);
  const where =
    p.kind === 'phase'
      ? 'xem trước pha'
      : p.kind === 'time'
        ? `lúc ${formatHm(minute)}`
        : `giờ máy ${formatHm(minute)}`;
  const blend =
    scene.blend.from === scene.blend.to
      ? ''
      : ` (đang chuyển ${scene.blend.from} → ${scene.blend.to})`;
  root.querySelector('[data-caption]')!.textContent =
    `${PHASE_LABEL[scene.phase]} — ${where}${blend}${page.draft.enabled || p.kind === 'phase' ? '' : ' · đang TẮT: game luôn ban ngày'}`;
  const link = root.querySelector<HTMLAnchorElement>('[data-open]')!;
  link.href = `/?dev=1${p.kind === 'phase' ? `&phase=${p.phase}` : ''}`;
  void paintPreview(root.querySelector<HTMLCanvasElement>('.dn__canvas')!, scene.look);
}

async function save(root: HTMLElement) {
  const issues = dayNightIssues(page.draft);
  if (issues.length > 0) return;
  page.saving = true;
  refresh(root);
  try {
    const res = await fetch('/__admin/day-night', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ settings: page.draft }),
    });
    const body = (await res.json()) as { error?: string };
    if (!res.ok) throw new Error(body.error ?? res.statusText);
    const text = `Đã lưu ngày/đêm: ${DAY_PHASES.map((p) => `${p} ${page.draft.phases[p]}`).join(', ')}.`;
    page.message = { kind: 'ok', text };
    // The written config reloads the page (Vite); keep the confirmation across it.
    try {
      sessionStorage.setItem(SAVED_KEY, text);
    } catch {
      /* storage blocked */
    }
  } catch (e) {
    page.message = { kind: 'error', text: (e as Error).message };
  } finally {
    page.saving = false;
    refresh(root);
  }
}
