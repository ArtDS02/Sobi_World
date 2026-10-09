// Admin page "Số liệu": every number of the files that tune the world — time, health, valuation,
// quality, the farm's balance — as a labelled field. Only numbers can change; the server checks that
// and validates with the game's schema before writing. Times are shown as given (milliseconds or
// seconds, see the unit in the label).
import { esc } from './labels';
import { json, rememberMessage } from './store';

type Files = Record<string, unknown>;

const FILE_TITLE: Record<string, string> = {
  'shared/time.json': '🕒 Thời gian (buổi trong ngày, bước mô phỏng, trần offline)',
  'shared/health.json': '🩺 Sức khỏe (bệnh, nguy kịch, chết, ân hạn, bảo vệ người mới)',
  'shared/valuation.json': '💰 Giá trị (cân nặng, phạt bệnh, chợ theo ngày)',
  'shared/quality.json': '⭐ Chất lượng (ngưỡng tâm trạng, hệ số giá)',
  'shared/inventory.json': '🎒 Túi đồ chung',
  'farm/balance.json': '🐷 Cân bằng Nông trại',
};

/** Friendly names by the last part(s) of a path; the rest show their key. */
const LABEL: Record<string, string> = {
  stepMs: 'Bước mô phỏng (ms)',
  'stepMs.online': 'Khi đang chơi (ms)',
  'stepMs.offline': 'Khi bù offline (ms)',
  offlineMaxMs: 'Bù offline tối đa (ms)',
  rewindToleranceMs: 'Dung sai giờ máy lùi (ms)',
  fromHour: 'Bắt đầu lúc (giờ)',
  'perHour.starving': 'Nguy cơ bệnh mỗi giờ khi đói 0 (0–1)',
  'perHour.dirty': 'Nguy cơ bệnh mỗi giờ khi bẩn (0–1)',
  'perHour.lowMood': 'Nguy cơ bệnh mỗi giờ khi tâm trạng thấp (0–1)',
  dirtyBelow: 'Bẩn khi sạch sẽ dưới',
  lowMoodBelow: 'Tâm trạng thấp khi dưới',
  criticalAfterMs: 'Bệnh bao lâu thì nguy kịch (ms)',
  deathAfterMs: 'Bệnh bao lâu thì chết (ms)',
  deathGraceMs: 'Ân hạn sau khi bù offline (ms)',
  newPlayerProtectionMs: 'Bảo vệ người mới, không bệnh (ms)',
  weightCap: 'Hệ số cân nặng tối đa',
  'healthPenalty.perDay': 'Giảm giá mỗi ngày bệnh (0–1)',
  'healthPenalty.floor': 'Hệ số sức khỏe thấp nhất (0–1)',
  factor: 'Hệ số chợ',
  weight: 'Tỉ trọng (độ hay gặp)',
  HUNGER_PER_HOUR: 'Đói mất mỗi giờ',
  CLEAN_PER_HOUR: 'Sạch mất mỗi giờ',
  CLEAN_PER_PILE_PER_HOUR: 'Sạch mất thêm mỗi giờ cho mỗi đống phân',
  CLEAN_PILES_COUNTED: 'Số đống phân tối đa được tính',
  ENERGY_AWAKE_PER_HOUR: 'Năng lượng mất mỗi giờ khi thức',
  ENERGY_ASLEEP_PER_HOUR: 'Năng lượng hồi mỗi giờ khi ngủ',
  GROWTH_MIN_HUNGER: 'Chỉ lớn khi đói trên',
  POOP_INTERVAL_SEC: 'Bao lâu một đống phân (giây)',
  MANURE_MAX: 'Số đống phân tối đa trong chuồng',
  STAGE_YOUNG_AT: 'Heo choai từ (% lớn)',
  STAGE_ADULT_AT: 'Heo lớn (xuất chuồng được) từ (% lớn)',
  TROUGH_AUTO_FEED_AT: 'Máng tự cho ăn khi đói dưới',
  SICK_RECOVERY_SEC: 'Miễn bệnh sau khi uống thuốc (giây)',
  SICK_MAX_EPISODES_PER_DAY: 'Số lần bệnh tối đa mỗi ngày',
  capacity: 'Sức chứa',
  cost: 'Giá nâng cấp',
  slots: 'Số ô',
  stack: 'Số lượng mỗi ô',
};

interface Leaf {
  path: string;
  value: number;
}

function leaves(value: unknown, path = ''): Leaf[] {
  if (typeof value === 'number') return [{ path, value }];
  if (Array.isArray(value)) return value.flatMap((v, i) => leaves(v, `${path}[${i}]`));
  if (value && typeof value === 'object') {
    return Object.entries(value).flatMap(([k, v]) => leaves(v, path ? `${path}.${k}` : k));
  }
  return [];
}

function labelOf(path: string): string {
  const index = (path.match(/\[\d+\]/g) ?? []).join('');
  const parts = path.replace(/\[\d+\]/g, '').split('.');
  for (let n = Math.min(2, parts.length); n >= 1; n--) {
    const hit = LABEL[parts.slice(-n).join('.')];
    if (hit) return index ? `${hit} ${index}` : hit;
  }
  return path;
}

/** `value` with the number at `path` replaced (a deep copy). */
function setAt(value: unknown, path: string, n: number): unknown {
  const copy = structuredClone(value) as Record<string, unknown>;
  const keys = path.split(/\.|\[|\]/).filter(Boolean);
  let at: Record<string, unknown> = copy;
  for (const k of keys.slice(0, -1)) at = at[k] as Record<string, unknown>;
  at[keys[keys.length - 1]!] = n;
  return copy;
}

const page = { files: null as Files | null, message: null as { kind: 'ok' | 'error'; text: string } | null };

export function renderNumbers(root: HTMLElement, apiOnline: boolean, rerender: () => void) {
  if (!page.files) {
    root.innerHTML = '<p class="loading">Đang tải số liệu…</p>';
    json<{ files: Files }>('/__admin/numbers').then(
      (r) => {
        page.files = r.files;
        rerender();
      },
      (e: unknown) => (root.innerHTML = `<p class="empty">Không tải được: ${esc((e as Error).message)}</p>`),
    );
    return;
  }
  const files = page.files;
  const msg = page.message ? `<div class="toast ${page.message.kind}"><pre>${esc(page.message.text)}</pre></div>` : '';
  root.innerHTML = `${msg}<p class="muted">Chỉ sửa được con số; server kiểm tra bằng đúng schema của game trước khi ghi vào <code>content/</code>. Game đọc ngay lần chạy sau.</p>
    ${Object.entries(files)
      .map(
        ([file, value]) => `<form class="panel tab-form" data-file="${esc(file)}"><h3>${esc(FILE_TITLE[file] ?? file)}</h3>
        <div class="form-grid">${leaves(value)
          .map(
            (l) => `<label class="field"><span>${esc(labelOf(l.path))}</span>
              <input type="number" step="any" name="${esc(l.path)}" value="${l.value}" /><small class="muted">${esc(l.path)}</small></label>`,
          )
          .join('')}</div>
        <div class="form-actions"><button class="btn btn-primary" ${apiOnline ? '' : 'disabled title="Chạy npm run admin để lưu"'}>💾 Lưu ${esc(file)}</button></div></form>`,
      )
      .join('')}`;
  root.querySelectorAll<HTMLFormElement>('form[data-file]').forEach((f) =>
    f.addEventListener('submit', (e) => {
      e.preventDefault();
      const file = f.dataset.file!;
      let value: unknown = files[file];
      for (const input of f.querySelectorAll<HTMLInputElement>('input[name]')) value = setAt(value, input.name, Number(input.value));
      json('/__admin/numbers', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ file, value }) }).then(
        () => {
          files[file] = value;
          page.message = { kind: 'ok', text: `Đã lưu ${file}` };
          rememberMessage(`Đã lưu ${file}`);
          rerender();
        },
        (err: unknown) => {
          page.message = { kind: 'error', text: (err as Error).message };
          rerender();
        },
      );
    }),
  );
}
