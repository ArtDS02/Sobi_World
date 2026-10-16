// The living world in the user editor (GĐ12): a calendar of the next days (weather, festival, merchant — what the game itself
// would show) and the test switches saved in `live.dev` of the save: force a weather, run a festival on every day (or none), have
// the merchant in the plaza every day (or never), and give Event Tokens. The switches are for testing; players never set them.
import { DAY_MS } from '../../src/core/clock';
import { FESTIVAL_RULES, MERCHANT_RULES } from '../../src/core/config/live';
import { WEATHER_RULES } from '../../src/core/config/weather';
import { festivalOfDay, NO_FESTIVAL } from '../../src/core/live/festival';
import { merchantVisits } from '../../src/core/live/visit';
import { vi } from '../../src/i18n/vi';
import { WEATHER_VALUES, weatherOfDay } from '../../src/systems/weather/weather';
import { WEATHER_GLYPH } from '../../src/ui/live/liveVm';
import type { WorldSave } from '../../src/core/save/world';
import { esc } from './labels';
import { edit } from './userDraft';
import { users } from './users';
import { setCurrency, setPart } from './worldEdits';

const today = () => Math.floor((Date.now() - new Date().getTimezoneOffset() * 60_000) / DAY_MS);
const option = (value: string, label: string, on: string) => `<option value="${value}"${value === on ? ' selected' : ''}>${esc(label)}</option>`;

export function liveSection(w: WorldSave): string {
  const dev = w.live.dev;
  const tokens = w.wallet.eventTokens;
  const start = today();
  const rows = Array.from({ length: 14 }, (_, i) => {
    const day = start + i;
    const fest = festivalOfDay(day, FESTIVAL_RULES);
    const w = weatherOfDay(day, WEATHER_RULES);
    return `<tr${i === 0 ? ' class="is-today"' : ''}><td>${new Date(day * DAY_MS + 12 * 3_600_000).toLocaleDateString('vi-VN', { weekday: 'short', day: '2-digit', month: '2-digit', timeZone: 'UTC' })}${i === 0 ? ' (hôm nay)' : ''}</td>
      <td>${WEATHER_GLYPH[w]} ${esc(vi.weather.names[w])}</td><td>${fest ? esc(fest.nameVi) : '—'}</td><td>${merchantVisits(day, MERCHANT_RULES) ? '🐪 ghé' : '—'}</td></tr>`;
  }).join('');
  return `<section class="panel"><h3>🌦️ Thế giới sống (bật thử)</h3>
    <p class="muted">Lịch dưới đây là đúng lịch của game (cố định theo ngày). Công tắc bên dưới ghi vào save để thử: nó thắng lịch trên mọi ngày, nhớ trả về “Theo lịch” khi thử xong. Bấm 💾 Lưu vào save để áp dụng; game đang mở sẽ tự tải lại.</p>
    <div class="form-grid">
      <label class="field"><span>Thời tiết mọi ngày</span><select data-live="weather">${option('', 'Theo lịch', dev.weather ?? '')}${WEATHER_VALUES.map((w) => option(w, `${WEATHER_GLYPH[w]} ${vi.weather.names[w]}`, dev.weather ?? '')).join('')}</select></label>
      <label class="field"><span>Lễ hội mọi ngày</span><select data-live="festival">${option('', 'Theo lịch', dev.festival ?? '')}${option(NO_FESTIVAL, 'Không có lễ hội', dev.festival ?? '')}${FESTIVAL_RULES.festivals.map((f) => option(f.id, f.nameVi, dev.festival ?? '')).join('')}</select></label>
      <label class="field"><span>Thương nhân</span><select data-live="merchant">${option('', 'Theo lịch', dev.merchant === null ? '' : dev.merchant ? 'on' : 'off')}${option('on', 'Có mặt mọi ngày', dev.merchant === null ? '' : dev.merchant ? 'on' : 'off')}${option('off', 'Không bao giờ ghé', dev.merchant === null ? '' : dev.merchant ? 'on' : 'off')}</select></label>
    </div>
    <p>Vé Lễ Hội trong save: <b>${tokens}</b> <button class="btn" data-live-tokens="50">+50 vé</button> <button class="btn" data-live-tokens="-${tokens}" ${tokens === 0 ? 'disabled' : ''}>Về 0</button></p>
    <table class="table"><thead><tr><th>Ngày</th><th>Thời tiết</th><th>Lễ hội</th><th>Thương nhân</th></tr></thead><tbody>${rows}</tbody></table></section>`;
}

export function bindLiveSection(root: HTMLElement, rerender: () => void) {
  root.querySelectorAll<HTMLSelectElement>('[data-live]').forEach((s) =>
    s.addEventListener('change', () => {
      const dev = { ...users.open!.draft.live.dev };
      if (s.dataset.live === 'weather') dev.weather = (s.value || null) as typeof dev.weather;
      else if (s.dataset.live === 'festival') dev.festival = s.value || null;
      else dev.merchant = s.value === '' ? null : s.value === 'on';
      edit(setPart(['live', 'dev'], dev), rerender);
    }),
  );
  root.querySelectorAll<HTMLElement>('[data-live-tokens]').forEach((b) =>
    b.addEventListener('click', () => {
      const w = users.open!.draft;
      edit(setCurrency('eventTokens', w.wallet.eventTokens + Number(b.dataset.liveTokens), Date.now(), { next: () => Math.random() }), rerender);
    }),
  );
}
