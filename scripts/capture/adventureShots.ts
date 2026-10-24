// `npx tsx scripts/capture/adventureShots.ts`: the reference screenshots of Sobi Adventure (camp, map, battle, Rift, dialogs) for the
// art and animation work of GĐ14. It starts Electron on the Vite dev server of a sandbox (default http://localhost:5190, the
// `sandbox-anim` launch config) with a throw-away copy of a prepared save (default %TEMP%/sobiworld-anim/fixture/save.json), drives the real UI and writes PNGs plus a manifest.
// It never opens the player's own save. Options: --save <save.json> --url <dev url> --out <folder> --tag <suffix for file names>.
import { _electron as electron, type ElectronApplication, type Page } from '@playwright/test';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, relative } from 'node:path';

const arg = (name: string, fallback: string) => {
  const i = process.argv.indexOf(`--${name}`);
  return i > 0 && process.argv[i + 1] ? process.argv[i + 1]! : fallback;
};
const root = process.cwd();
const SAVE = arg('save', join(tmpdir(), 'sobiworld-anim', 'fixture', 'save.json'));
const URL = arg('url', 'http://localhost:5190');
const OUT = arg('out', join(root, 'art_inbox', 'sobi_adventure_reference'));
const TAG = arg('tag', '');
const VIEW = { width: 1600, height: 900 };

interface Shot {
  id: string;
  screen: string;
  state: string;
  file: string;
  how: string;
  result: 'captured' | 'blocked';
  note: string;
}
const shots: Shot[] = [];
let n = 0;

async function shot(page: Page, folder: string, name: string, screen: string, state: string, how: string, note = '') {
  n += 1;
  const id = `ADV-${String(n).padStart(3, '0')}`;
  const dir = join(OUT, folder);
  mkdirSync(dir, { recursive: true });
  const file = join(dir, `${id.toLowerCase()}_${name}${TAG ? `_${TAG}` : ''}.png`);
  // A screenshot sometimes times out while Electron repaints: one more try before the part is written down as blocked.
  await page.screenshot({ path: file, timeout: 20_000 }).catch(() => page.screenshot({ path: file, timeout: 40_000 }));
  shots.push({ id, screen, state, file: relative(OUT, file).replaceAll('\\', '/'), how, result: 'captured', note });
  console.log(`  ✓ ${id} ${folder}/${name}`);
}

function blocked(screen: string, state: string, how: string, note: string) {
  n += 1;
  shots.push({ id: `ADV-${String(n).padStart(3, '0')}`, screen, state, file: '', how, result: 'blocked', note });
  console.log(`  ✗ ${screen} / ${state}: ${note}`);
}

/** Runs one part of the tour; a failure is written down as blocked and the tour goes on. */
async function step(label: string, fn: () => Promise<void>) {
  try {
    await fn();
  } catch (e) {
    blocked(label, '-', '-', (e instanceof Error ? e.message : String(e)).split('\n')[0]!.slice(0, 160));
  }
}

const pause = (page: Page, ms: number) => page.waitForTimeout(ms);
const button = (page: Page, name: string | RegExp) => page.getByRole('button', { name }).first();

/** Closes the welcome / away windows the shell may open on start (Escape alone would open the settings when nothing is open). */
async function closePopups(page: Page) {
  const open = page.locator('.app__popup .c-window, .app__dialogs .c-dialog');
  for (let i = 0; i < 5 && (await open.count()) > 0; i++) {
    const close = page.locator('.app__popup .c-window, .app__dialogs .c-dialog').first().getByRole('button', { name: /^(Đóng|Nhận|OK|Để sau)/ }).first();
    if (await close.isVisible().catch(() => false)) await close.click();
    else await page.keyboard.press('Escape');
    await pause(page, 500);
  }
}

async function toCamp(page: Page) {
  if (await page.locator('.adventure-ui__hub').isVisible()) return;
  const back = page.locator('.adventure-explore').getByRole('button', { name: 'Về Trại' }).first();
  if (await back.isVisible().catch(() => false)) await back.click();
  await pause(page, 500);
  const leave = button(page, 'Rời Vết Nứt');
  if (await leave.isVisible().catch(() => false)) await leave.click();
  const claim = page.locator('.adventure-ui__done button').first();
  if (await claim.isVisible().catch(() => false)) await claim.click();
  await page.locator('.adventure-ui__hub').waitFor({ timeout: 10_000 });
}

/** Picks the first `count` ready fighters on the camp board (after clearing the choice). */
async function pickTeam(page: Page, count: number) {
  const picked = page.locator('.adventure-ui__fighter.is-selected .adventure-ui__fighter-pick');
  while ((await picked.count()) > 0) await picked.first().click();
  const free = page.locator('.adventure-ui__fighter:not(.is-off):not(.is-selected) .adventure-ui__fighter-pick');
  for (let i = 0; i < count; i++) await free.first().click();
}

/**
 * Pictures of one battle step at fixed moments. The battle screen redraws about once a second and times its motion from
 * `performance.now()` (battleFxView.ts), so pausing the animations alone does not hold: the page's clock is held instead. `act` makes
 * the step happen while the clock stands still (the step starts at that frozen time); for each `t` the clock is set to start + t, the
 * screen is redrawn (the log button, twice) and every animation is paused where that redraw put it. The clock is given back after.
 */
async function frozen(page: Page, act: () => Promise<void>, folder: string, name: string, state: string, how: string, times: readonly number[]) {
  // Strings: this script has no DOM types, the page has.
  await page.evaluate('window.__realNow = performance.now.bind(performance); window.__fake0 = performance.now(); window.__fake = window.__fake0; performance.now = () => window.__fake;');
  try {
    await act();
    await page.locator('.adventure-ui__body[style*="animation"], .adventure-vfx').first().waitFor({ timeout: 5000 });
    const redraw = page.locator('.adventure-ui__bleft button').first();
    for (const t of times) {
      await page.evaluate(`window.__fake = window.__fake0 + ${t}; for (const a of document.getAnimations()) a.play();`);
      await redraw.click({ force: true });
      await redraw.click({ force: true });
      await page.evaluate('for (const a of document.getAnimations()) { a.pause(); a.currentTime = 0; }');
      await shot(page, folder, `${name}_${String(t).padStart(4, '0')}ms`, 'Trận (animation)', `${state} · t = ${t} ms`, how, 'đồng hồ trang giữ ở mốc này, animation dừng tại chỗ');
    }
  } finally {
    await page.evaluate('performance.now = window.__realNow; for (const a of document.getAnimations()) a.play();');
  }
}

async function tour(app: ElectronApplication) {
  const page = await app.firstWindow();
  await page.setViewportSize(VIEW);
  await page.locator('.plazabar__dock').waitFor({ timeout: 40_000 });
  await pause(page, 1500);
  await closePopups(page);
  await page.locator('.plazabar__area--adventure').click();
  await page.locator('.app.is-adventure').waitFor({ timeout: 20_000 });
  await pause(page, 1500);
  await toCamp(page);

  await step('Trại', async () => {
    await shot(page, '01_lobby', 'camp_default', 'Trại Phiêu Lưu', 'mặc định', 'Sảnh → cửa Adventure');
    await button(page, 'Chín First Guardians').click();
    await pause(page, 400);
    await shot(page, '01_lobby', 'camp_legend', 'Trại Phiêu Lưu', 'bật tranh Chín First Guardians', 'Trại → nút "Chín First Guardians"');
    await button(page, 'Chín First Guardians').click();
    await page.locator('.adventure-ui__filters button').nth(3).click();
    await pause(page, 300);
    await shot(page, '01_lobby', 'camp_filter_element', 'Trại Phiêu Lưu', 'lọc theo hệ', 'Trại → chip hệ thứ 3');
    await page.locator('.adventure-ui__filters button').first().click();
    await page.locator('.adventure-ui__search input, input.adventure-ui__search').first().fill('zzzz');
    await pause(page, 300);
    await shot(page, '01_lobby', 'camp_search_empty', 'Trại Phiêu Lưu', 'tìm không thấy (empty state)', 'Trại → ô tìm gõ "zzzz"');
    await page.locator('.adventure-ui__search input, input.adventure-ui__search').first().fill('');
    await pickTeam(page, 3);
    await pause(page, 300);
    await shot(page, '01_lobby', 'camp_team_selected', 'Trại Phiêu Lưu', 'đã chọn 3 bạn (thanh đội, cộng hưởng)', 'Trại → bấm chọn 3 thẻ chiến binh');
    await page.locator('.adventure-ui__fighter').first().hover();
    await pause(page, 300);
    await shot(page, '01_lobby', 'camp_fighter_hover', 'Trại Phiêu Lưu', 'hover thẻ chiến binh', 'Trại → rê chuột lên thẻ đầu');
  });

  await step('Hồ sơ chiến binh', async () => {
    await page.locator('.adventure-ui__sheet-btn').first().click();
    const dialog = page.locator('.app__dialogs [role="dialog"], .app__dialogs .c-dialog, .app__dialogs .c-window').first();
    await dialog.waitFor({ timeout: 5000 });
    await pause(page, 400);
    await shot(page, '05_animal_details_and_skills', 'sheet_tab_1', 'Hồ sơ chiến binh', 'tab đầu', 'Trại → nút "Hồ sơ" của thẻ đầu');
    const tabs = page.locator('.app__dialogs [role="tab"]');
    const count = await tabs.count();
    for (let i = 1; i < count; i++) {
      await tabs.nth(i).click();
      await pause(page, 300);
      const label = ((await tabs.nth(i).textContent()) ?? `tab ${i + 1}`).trim();
      await shot(page, '05_animal_details_and_skills', `sheet_tab_${i + 1}`, 'Hồ sơ chiến binh', `tab "${label}"`, `Hồ sơ → tab "${label}"`);
    }
    await page.keyboard.press('Escape');
    await pause(page, 400);
  });

  await step('Chọn vùng', async () => {
    const zones = page.locator('.adventure-ui__zone');
    const count = await zones.count();
    for (let i = 0; i < count; i++) {
      await zones.nth(i).click();
      await pause(page, 300);
      const name = ((await zones.nth(i).locator('b, strong, h3').first().textContent().catch(() => null)) ?? `vùng ${i + 1}`).trim();
      await shot(page, '01_lobby', `camp_zone_${i + 1}`, 'Trại Phiêu Lưu', `chọn thẻ "${name}"`, `Trại → thẻ vùng thứ ${i + 1}`);
    }
    await zones.first().click();
  });

  await step('Bản đồ khám phá', async () => {
    await pickTeam(page, 3);
    await button(page, /^Lên đường/).click();
    await page.locator('.adventure-explore').waitFor({ timeout: 15_000 });
    await pause(page, 2500);
    await shot(page, '02_adventure_maps/map_overview', 'forest_edge_spawn', 'Bản đồ khám phá', 'vừa vào khu đầu Rừng', 'Trại → chọn đội → "Lên đường"');
    const tip = page.locator('.adventure-ui__tip button, .adventure-explore button', { hasText: /Đã hiểu|OK|Hiểu rồi/ }).first();
    if (await tip.isVisible().catch(() => false)) {
      await tip.click();
      await pause(page, 400);
      await shot(page, '02_adventure_maps/map_overview', 'forest_edge_no_tip', 'Bản đồ khám phá', 'đóng thẻ mẹo', 'Bản đồ → đóng mẹo');
    }
    await page.locator('canvas').first().click({ position: { x: 800, y: 450 } }).catch(() => {});
    await page.keyboard.press('KeyM');
    await pause(page, 600);
    await shot(page, '02_adventure_maps/map_nodes_and_routes', 'forest_edge_minimap', 'Bản đồ khám phá', 'bản đồ nhỏ (phím M)', 'Bản đồ → phím M');
    await page.keyboard.press('KeyM');
    // The path of map_forest_edge from the entrance towards the frogs by the river (they wander: it may miss).
    for (const [key, ms, name] of [
      ['KeyD', 1600, 'walk_east'],
      ['KeyS', 900, 'walk_south'],
      ['KeyD', 1600, 'walk_east_2'],
      ['KeyA', 1700, 'walk_back_west'],
      ['KeyW', 500, 'walk_north'],
      ['KeyA', 700, 'walk_west'],
      ['KeyW', 600, 'walk_north_2'],
      ['KeyD', 700, 'walk_east_3'],
    ] as const) {
      await page.keyboard.down(key);
      await pause(page, ms);
      await page.keyboard.up(key);
      await pause(page, 700);
      if (await page.locator('.adventure-ui__battle').isVisible()) break;
      await shot(page, '02_adventure_maps/encounters', `forest_edge_${name}`, 'Bản đồ khám phá', `đi bộ (${key})`, `Bản đồ → giữ ${key}`);
    }
    if (!(await page.locator('.adventure-ui__battle').isVisible()))
      blocked('Bản đồ khám phá', 'chạm nhóm quái trên bản đồ', 'đi bộ tới nhóm quái', 'quái đi tuần nên đường đi cố định của script không chắc chạm; đội cấp cao còn bị "Thắng nhanh" xử lý ngay (không có màn trận). Đi tay: tắt Thắng nhanh rồi chạm nhóm.');
  });

  await step('Trận trên bản đồ', async () => {
    if (!(await page.locator('.adventure-ui__battle').isVisible())) return;
    await pause(page, 900);
    await shot(page, '03_combat/initial_state', 'map_battle_start', 'Trận', 'bắt đầu trận chạm trên bản đồ', 'Bản đồ → đi chạm nhóm quái');
    const flee = button(page, 'Bỏ chạy');
    if (await flee.isEnabled().catch(() => false)) await flee.click();
    await pause(page, 1200);
  });

  await step('Về Trại từ bản đồ', async () => {
    if (await page.locator('.adventure-ui__hub').isVisible()) return;
    const back = page.locator('.adventure-explore').getByRole('button', { name: 'Về Trại' }).first();
    if (await back.isVisible().catch(() => false)) {
      await back.click();
      await pause(page, 700);
      await shot(page, '06_rewards_and_progression', 'trip_summary', 'Tổng kết chuyến đi', 'sau khi về Trại', 'Bản đồ → "Về Trại"');
    }
    await toCamp(page);
  });

  await step('Vết Nứt', async () => {
    await toCamp(page);
    await page.locator('.adventure-ui__zone').last().click();
    await pause(page, 300);
    await pickTeam(page, 3);
    await shot(page, '01_lobby', 'camp_rift_selected', 'Trại Phiêu Lưu', 'chọn thẻ Vết Nứt Umbraflux + đội', 'Trại → thẻ cuối (Vết Nứt) → chọn 3 bạn');
    await button(page, 'Vào Vết Nứt').click();
    await pause(page, 1200);
    if (!(await page.locator('.adventure-ui__battle').isVisible())) {
      await shot(page, '07_other_screens', 'rift_entry', 'Vết Nứt', 'màn vào Vết Nứt', 'Trại → "Vào Vết Nứt"');
      const next = button(page, /^Lên tầng/);
      if (await next.isVisible().catch(() => false)) await next.click();
    }
    await page.locator('.adventure-ui__battle').waitFor({ timeout: 10_000 });
    await pause(page, 1200);
  });

  await step('Trận Vết Nứt', async () => {
    const battle = page.locator('.adventure-ui__battle');
    if (!(await battle.isVisible())) return;
    await shot(page, '03_combat/initial_state', 'rift_battle_start', 'Trận', 'đầu trận, lượt ta (thẻ kỹ năng)', 'Vết Nứt → tầng 1');
    await page.locator('.adventure-ui__unit--enemy').first().hover();
    await pause(page, 300);
    await shot(page, '03_combat/player_turn', 'hover_enemy', 'Trận', 'rê chuột lên kẻ địch (tooltip ý định)', 'Trận → hover kẻ địch đầu');
    const card = page.locator('.adventure-ui__card:not(.is-off)').first();
    if (await card.isVisible().catch(() => false)) {
      await card.hover();
      await pause(page, 250);
      await shot(page, '03_combat/skills_and_targeting', 'card_hover', 'Trận', 'hover thẻ kỹ năng', 'Trận → hover thẻ kỹ năng đầu');
    }
    const off = page.locator('.adventure-ui__card.is-off').first();
    if (await off.isVisible().catch(() => false)) await shot(page, '03_combat/skills_and_targeting', 'card_disabled', 'Trận', 'có thẻ kỹ năng bị tắt (thiếu MP / hồi chiêu / Nộ)', 'Trận → nhìn hàng thẻ');
    // The vertical slice (docs/animation/): Cu Ủn's "Gai Độc" — wind-up, the thorn in flight, the impact, the poison, recovery.
    const thorn = page.locator('.adventure-ui__card:not(.is-off)', { hasText: 'Gai Độc' }).first();
    if (await thorn.isVisible().catch(() => false)) {
      await thorn.click();
      await pause(page, 200);
      const target = page.locator('.adventure-ui__unit.is-aimable').first();
      await frozen(
        page,
        async () => {
          if (await target.isVisible().catch(() => false)) await target.click();
        },
        '09_motion_slice',
        'poison_thorn',
        'Cu Ủn dùng Gai Độc',
        'Trận → lượt Cu Ủn → thẻ "Gai Độc" → chọn kẻ địch',
        [80, 220, 380, 520, 600, 760, 1100, 1500],
      );
      await pause(page, 3400);
    } else blocked('Trận (animation)', 'Gai Độc của Cu Ủn', 'lượt Cu Ủn', 'không phải lượt Cu Ủn hoặc thẻ đang tắt');
    await button(page, /^Đánh thường/).click();
    await pause(page, 300);
    const aiming = await page.locator('.adventure-ui__aim').isVisible();
    if (aiming) await shot(page, '03_combat/skills_and_targeting', 'aim_attack', 'Trận', 'chọn mục tiêu (nhãn Hiệu quả / Kém)', 'Trận → "Đánh thường"');
    await frozen(
      page,
      async () => {
        if (aiming) await page.locator('.adventure-ui__unit.is-aimable').first().click();
      },
      '09_motion_slice',
      'basic_attack',
      'Đánh thường rồi lượt địch (lao tới, chém, bị đánh)',
      'Trận → "Đánh thường" → chọn kẻ địch',
      [120, 330, 420, 900, 1300],
    );
    await pause(page, 160);
    await shot(page, '03_combat/enemy_turn', 'step_fx_early', 'Trận', 'ngay sau khi ra đòn (số bay bắt đầu)', 'Trận → chọn mục tiêu, chụp sau 0,16 giây');
    await pause(page, 500);
    await shot(page, '03_combat/enemy_turn', 'step_fx_mid', 'Trận', 'giữa hiệu ứng bước (số bay, rung)', 'Trận → chụp sau 0,66 giây');
    await pause(page, 1200);
    await shot(page, '03_combat/player_turn', 'next_turn', 'Trận', 'lượt kế tiếp', 'Trận → chờ hiệu ứng hết');
    await page.locator('.adventure-ui__hud').getByRole('button', { name: 'Vật phẩm' }).click();
    await pause(page, 600);
    await shot(page, '07_other_screens', 'bag_over_battle', 'Kho đồ', 'mở từ HUD giữa trận (tab Phiêu lưu)', 'Trận → nút "Vật phẩm" trên HUD');
    await page.keyboard.press('Escape');
    await pause(page, 500);
    const items = page.locator('.adventure-ui__deck-head').getByRole('button', { name: 'Vật phẩm' });
    if (await items.isVisible().catch(() => false)) {
      await items.click();
      await pause(page, 300);
      await shot(page, '03_combat/player_turn', 'items_menu', 'Trận', 'mở hàng vật phẩm của trận', 'Trận → "Vật phẩm" trong hàng thẻ');
      await items.click();
    }
    await page.locator('.adventure-ui__bleft button').first().click({ force: true });
    await pause(page, 300);
    await shot(page, '03_combat/player_turn', 'log_open', 'Trận', 'mở nhật ký trận', 'Trận → nút nhật ký (góc trái)');
    await page.locator('.adventure-ui__bleft button').first().click({ force: true });
    const guard = button(page, /^Phòng thủ/);
    if (await guard.isEnabled().catch(() => false)) {
      await guard.click();
      await pause(page, 900);
      await shot(page, '03_combat/buffs_debuffs', 'after_guard', 'Trận', 'sau khi Phòng thủ (biểu tượng khiên, bảng hiệu ứng)', 'Trận → "Phòng thủ"');
    }
    await button(page, 'Tự động').click({ force: true });
    await button(page, 'Tốc độ x2').click({ force: true });
    let ult = false;
    let status = false;
    for (let i = 0; i < 80; i++) {
      await pause(page, 250);
      if (!(await battle.isVisible())) break;
      if (!ult && (await page.locator('.adventure-ui__fxbanner.is-ultimate').isVisible())) {
        ult = true;
        await shot(page, '03_combat/rage_and_ultimate', 'ultimate_cutin', 'Trận', 'cut-in Tuyệt kỹ', 'Trận → Tự động, chờ một bạn đầy Nộ');
      }
      if (!status && (await page.locator('.adventure-ui__effects li').count()) > 0) {
        status = true;
        await shot(page, '03_combat/buffs_debuffs', 'status_panel', 'Trận', 'bảng hiệu ứng có trạng thái', 'Trận → Tự động tới khi có trạng thái');
      }
    }
    if (!ult) blocked('Trận', 'cut-in Tuyệt kỹ', 'Tự động tới khi đầy Nộ', 'trận kết thúc trước khi ai đầy Nộ');
    await pause(page, 800);
    await shot(page, '03_combat/victory', 'rift_floor_cleared', 'Vết Nứt', 'giữa hai tầng (thắng tầng)', 'Trận Vết Nứt thắng → màn giữa tầng');
  });

  await step('Rời Vết Nứt', async () => {
    const leave = button(page, 'Rời Vết Nứt');
    if (!(await leave.isVisible().catch(() => false))) return;
    await leave.click();
    await pause(page, 700);
    await shot(page, '06_rewards_and_progression', 'rift_result', 'Tổng kết Vết Nứt', 'sau khi rời', 'Màn giữa tầng → "Rời Vết Nứt"');
    await toCamp(page);
  });
}

async function main() {
  if (!existsSync(SAVE)) throw new Error(`No save at ${SAVE} (pass --save)`);
  const data = mkdtempSync(join(tmpdir(), 'sobi-capture-'));
  mkdirSync(join(data, 'saves'), { recursive: true });
  // The copy only: the backup reminder would cover the top of every picture.
  const save = JSON.parse(readFileSync(SAVE, 'utf8')) as { settings?: { lastExportAt?: number | null } };
  if (save.settings) save.settings.lastExportAt = Date.now();
  writeFileSync(join(data, 'saves', 'save.json'), JSON.stringify(save));
  console.log(`Capture → ${OUT}\n  save copy: ${data}\n  dev url: ${URL}`);
  const app = await electron.launch({ args: [root], cwd: root, env: { ...(process.env as Record<string, string>), UNIN_DEV_URL: URL, UNIN_USER_DATA: data } });
  try {
    await tour(app);
  } finally {
    await app.close().catch(() => {});
    try {
      rmSync(data, { recursive: true, force: true, maxRetries: 5, retryDelay: 300 });
    } catch {
      /* left in %TEMP% */
    }
  }
  const index = join(OUT, '00_index');
  mkdirSync(index, { recursive: true });
  const csv = (s: string) => `"${s.replaceAll('"', '""')}"`;
  const rows = shots.map((s) => {
    const size = s.file && existsSync(join(OUT, s.file)) ? `${VIEW.width}x${VIEW.height} (${Math.round(statSync(join(OUT, s.file)).size / 1024)} KB)` : '';
    return [s.id, s.screen, s.state, s.file, size, s.how, s.result, s.note].map(csv).join(',');
  });
  const name = `screenshot_manifest${TAG ? `_${TAG}` : ''}.csv`;
  writeFileSync(join(index, name), `${String.fromCharCode(0xfeff)}id,screen,state,path,viewport,how_to_open,result,note\n${rows.join('\n')}\n`);
  console.log(`\n${shots.filter((s) => s.result === 'captured').length} captured, ${shots.filter((s) => s.result === 'blocked').length} blocked → 00_index/${name}`);
}

await main();
