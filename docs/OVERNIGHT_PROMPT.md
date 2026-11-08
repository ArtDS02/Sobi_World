# OVERNIGHT PROMPT — Sobi World (copy toàn bộ phần trong khung vào session mới)

Prompt tiếp tục (dán vào session mới nếu phiên cũ chết hẳn sau khi hết limit):
`Đọc docs/OVERNIGHT_PROMPT.md và docs/OVERNIGHT_LOG.md, làm tiếp từ dòng NEXT theo đúng quy tắc trong file. Không hỏi lại.`

Điều kiện chạy: đặt chế độ quyền của session sang chế độ tự động / bỏ qua hỏi quyền TRƯỚC khi đi ngủ
(agent không tự đổi được cấu hình quyền). Máy không sleep (bật keep-awake). Nhánh hiện tại sạch hoặc commit được.

```
Bạn là agent làm việc một mình qua đêm trên Sobi World (E:\AI_Project\Sobi_World\Sobi_World). Chủ dự án đã duyệt
TOÀN BỘ việc dưới đây và cho phép bạn TỰ QUYẾT MỌI THỨ, không hỏi, không chờ xác nhận, không dùng AskUserQuestion.
Gặp chỗ mơ hồ: chọn phương án an toàn nhất, ghi lý do vào docs/OVERNIGHT_LOG.md, đi tiếp. Trả lời tiếng Việt.

## 0. Khởi động
1. Đọc docs/AGENT_RULES.md, docs/PROGRESS.md, CLAUDE.md. Rồi docs/ADMIN_UPGRADE_PLAN.md và docs/ADMIN_UPGRADE_LOG.md (nếu có).
2. Tạo nhánh `overnight-hardening` từ nhánh hiện tại (commit gói sửa layout admin còn dở trước, một commit riêng). Việc admin
   dùng nhánh `admin-upgrade` tách từ đó (xem phần C).
3. Ghi baseline: chạy `npx vitest run --testTimeout=120000 --hookTimeout=120000`, lưu danh sách test fail sẵn vào
   docs/OVERNIGHT_LOG.md (đã biết: simulation "catch-up 30 ngày" ~3,1 s > 3 s; assetsCheck "shipped assets pass" quá 45 s;
   cùng nhóm timeout cũ của phase11/breeding). Không đổ lỗi mới cho test cũ, không nới ngưỡng test để xanh.
4. Tạo docs/OVERNIGHT_LOG.md: checklist mọi việc dưới đây, tick từng việc, ghi quyết định tự đưa ra, việc bị kẹt.
   Nếu ngữ cảnh bị tóm tắt: đọc lại file này, OVERNIGHT_LOG.md, ADMIN_UPGRADE_PLAN.md rồi làm tiếp từ mục chưa tick.

## Quy tắc cứng (giữ cả đêm)
- CLAUDE.md: src/core thuần (không DOM/Node/Date.now/Math.random, now/rng inject); tiền chỉ qua helper ghi Transaction;
  chuỗi hiển thị ở src/i18n, asset qua id → manifest; mọi action thành công phát GameEvent; không mạng/HTTP trong bản ship;
  lỗi ghi save không được nuốt; không làm mất save người chơi. File LF. Comment code tiếng Anh. Không asset có bản quyền.
- Không đụng save thật trong %APPDATA%\SobiWorld*; test dùng thư mục tạm / SOBIWORLD_APPDATA / UNIN_USER_DATA.
- Mỗi việc: viết test trước hoặc cùng lúc (test lỗi phải đỏ trước khi sửa nếu làm được), `npm run typecheck && npm run lint &&
  npm run guard` xanh, chạy test liên quan, rồi commit riêng (tiếng Anh, 1 việc / commit, kèm dòng Co-Authored-By theo hướng dẫn
  hệ thống). Chạy `npm run check` đầy đủ sau mỗi nhóm lớn (A, B, C, D), ghi kết quả; lỗi mới do bạn gây ra phải sửa tại chỗ.
- Cập nhật docs/PROGRESS.md (mẫu AGENT_RULES §7) sau mỗi nhóm. Ghi decision mới vào docs/decisions/ khi đổi hành vi
  đáng kể (số tiếp theo sau 051).
- Việc nào kẹt quá ~3 lần thử: ghi nguyên nhân + việc đã thử vào log, bỏ qua, làm việc kế. Không treo cả đêm.
- CẤM: git push, tạo PR, merge vào main, reset --hard / checkout -- làm mất thay đổi, xoá file ngoài dự án, nới test/timeout
  cho xanh, sửa cấu hình quyền / settings của Claude Code, tắt guard/lint, thêm phụ thuộc mạng. Không sửa art đã duyệt,
  không chạy Unity Studio thêm (đang chờ chủ dự án). Tắt âm mặc định (nếu làm) chỉ áp cho save MỚI, không đổi save cũ.

## Chạm giới hạn sử dụng (limit) — phải tự làm tiếp sau khi reset
- Trạng thái nằm trong file, không nằm trong trí nhớ: sau MỖI commit, cập nhật docs/OVERNIGHT_LOG.md với dòng
  `NEXT: <việc tiếp theo cụ thể>` ở đầu file, và để cây làm việc sạch (commit hoặc `git stash` có tên) trước khi bắt đầu
  việc lớn kế tiếp. Không để công việc dở chỉ tồn tại trong ngữ cảnh.
- Khi gặp lỗi giới hạn / rate limit / quota / 429 / "usage limit reached" (từ tool hoặc từ chính phiên):
  1. Lưu ngay: cập nhật `NEXT:` + ghi giờ gặp limit vào log, commit nếu build còn xanh, nếu không thì `git stash push -m overnight-wip`.
  2. Nếu có công cụ lên lịch (ScheduleWakeup / CronCreate / scheduled task): đặt lần thức dậy kế tiếp sau 60 phút
     (tối đa mức công cụ cho phép), với prompt = "Đọc docs/OVERNIGHT_PROMPT.md và docs/OVERNIGHT_LOG.md rồi làm tiếp từ dòng
     NEXT". Mỗi lần thức dậy: thử làm 1 việc nhỏ; nếu vẫn bị limit thì đặt lại lịch và kết thúc lượt. Lặp cho tới khi chạy được.
     Không dùng vòng sleep/poll trong shell, không tạo vòng lặp dày hơn 1 lần / 30 phút.
  3. Nếu không có công cụ lên lịch: dừng gọn, `NEXT:` đã đủ để phiên sau tiếp tục. Không sinh việc giả để tốn quota.
- Khi (được) tiếp tục sau limit hoặc sau khi ngữ cảnh bị tóm tắt: đọc OVERNIGHT_LOG.md; `git status` + `git stash list`; nếu có
  stash `overnight-wip` thì `git stash pop` và chạy typecheck trước khi làm tiếp; KHÔNG làm lại việc đã tick; KHÔNG bắt đầu
  lại từ đầu.
- Tiết kiệm quota: đọc đúng file cần, không đọc docs/archive/ hay asset/; chạy test theo file liên quan, chỉ chạy
  `npm run check` đầy đủ ở cuối mỗi nhóm; không spawn thêm subagent trừ khi thật cần.

## A. Sửa bug nguy hiểm (làm trước, thứ tự này)
A1. NaN/Infinity ở tiền: `postTransaction` (src/core/economy/ledger.ts) từ chối amount/balance không hữu hạn (trả lỗi
    INVALID_REQUEST hoặc mã phù hợp trong config/errors), `valueOf`/`weightFactor` (src/systems/valuation/value.ts) trả
    số hữu hạn (clamp về 0 khi không hữu hạn). Test: NaN, Infinity, -0, số rất lớn. Quét thêm mọi chỗ khác cộng/trừ tiền,
    XP, kho không qua helper này và vá.
A2. Xử lý lỗi toàn cục:
    - `tick()` trong src/core/world/gameStore.ts: bọc try/catch, lỗi không làm vòng lặp chết im lặng; báo cho người chơi
      (toast/trạng thái qua kênh đã có, chuỗi ở src/i18n vi + en), giới hạn tần suất báo, ghi log, KHÔNG ghi đè save khi
      state có thể hỏng.
    - Renderer: `window.onerror` + `unhandledrejection` → màn lỗi "game gặp lỗi" (DOM thuần, nút tải lại) + ghi log.
    - Electron main: `render-process-gone`, `unresponsive`/`responsive`, `did-fail-load` → tự reload cửa sổ có giới hạn số
      lần, và ghi log; flush save an toàn trước khi reload nếu renderer còn sống.
    - Log lỗi local: file `logs/error.log` trong userData (xoay vòng, giới hạn dung lượng), chỉ Node ở electron/, qua port.
    Test đơn vị cho phần thuần; test Node cho ghi log (thư mục tạm).
A3. Save an toàn hơn (src/core/save/migrate.ts, src/platform/desktop/fileSaveStorage.ts):
    - Phân biệt lỗi DỮ LIỆU (ZodError / SAVE_CORRUPT thật) với lỗi CODE (exception lạ khi migrate). Lỗi code: KHÔNG đổi tên
      file save thành corrupt; trả trạng thái riêng để màn recovery báo "lỗi của game", giữ nguyên file.
    - Slice Area lỗi schema: thử khôi phục từng slice (dùng `init()` của Area để tạo slice mới) thay vì bỏ cả save; giữ bản
      gốc nguyên vẹn dưới saves/ (ví dụ before-slice-repair-*.json, ngoài vòng xoay) và phát cảnh báo cho người chơi.
      Chỉ áp cho slice Area, không áp cho phần world (wallet, inventory…).
    - Test: save có 1 slice hỏng → các Area còn lại + ví giữ nguyên; exception giả trong migrate không làm mất file.

## B. Sửa bug bình thường / ít nguy hiểm
B1. Phản hồi không chờ đĩa + gộp ghi: trong gameStore, `dispatch` phát event ngay sau khi state đã set, ghi đĩa chạy nền;
    gộp (coalesce) các lần persist chờ trong hàng đợi thành 1 lần ghi state mới nhất; khi lỗi ghi vẫn hiển thị saveError và
    retry như cũ (không nuốt lỗi). Test: nhiều dispatch liên tiếp → ≤ 2 lần ghi, ghi lỗi không chặn phản hồi.
    Cẩn thận thứ tự flush khi thoát: `persistNow`/`flush` vẫn đợi ghi xong.
B2. catch-up 30 ngày > 3 s: đo bằng profiler đơn giản, tối ưu chỗ nóng (không đổi kết quả mô phỏng: test tất định hiện có
    vẫn xanh, thêm test so sánh trước/sau). Không nới ngưỡng 3 s. Nếu không đạt, ghi số đo + nguyên nhân vào log.
B3. settings.json: ghi tuần tự (hàng đợi) + retry EPERM/EBUSY như saveFiles; tmp name duy nhất. Test.
B4. `fs.watch` ở electron/saveFiles.ts: thêm handler 'error' (đóng watcher, ghi log, thử mở lại có giới hạn). Test.
B5. Nhận biết "sửa ngoài" bằng mtime+size: thêm so sánh hash nội dung khi stamp khác trước khi coi là sửa ngoài
    (tránh phản ứng với antivirus/sync chạm mtime). Test.
B6. Import save: kiểm tra JSON hợp lệ (parse thử, kích thước tối đa hợp lý) TRƯỚC khi `backupNow`, để import hỏng không đẩy
    backup tốt khỏi vòng xoay. Export ghi atomic (tmp + rename). Test.
B7. Protocol `app://`: try/catch quanh `decodeURIComponent` → 404. Test nếu tách được hàm thuần.
B8. Hộp thoại câu cá (src/areas/aquarium/ui/fishingDialog.ts): chỉ chặn Space/Enter khi dialog đang ở pha cần phím và
    focus không nằm trên nút; gỡ listener khi dialog đóng (không đợi phím kế); rng của minigame đi qua một nguồn inject
    được (seed theo `now` của store) thay vì Math.random trực tiếp, để test tái lập. Không đổi cân bằng.
B9. cleanManure: khi túi đầy, phần phân bị vứt phải có thông báo rõ (event/toast) và XP chỉ tính cho phần giữ lại?
    — chọn phương án an toàn: GIỮ XP như cũ nếu spec/GAME_BALANCE nói vậy (đọc trước), chỉ thêm thông báo. Ghi quyết định.

## C. Admin (làm theo prompt riêng bên dưới, nhánh `admin-upgrade`)
Việc cần làm: thực hiện đủ 9 bước trong docs/ADMIN_UPGRADE_PLAN.md, theo thứ tự đã duyệt.
- Bắt đầu: tạo nhánh admin-upgrade (từ overnight-hardening sau khi xong A+B và đã `npm run check`), commit gói sửa layout
  hiện còn dở, ghi lại các test đang fail sẵn để không đổ nhầm cho việc mới.
- Tự quyết: không hỏi; mơ hồ thì chọn phương án an toàn và ghi vào docs/ADMIN_UPGRADE_LOG.md. Bước nào kẹt thì ghi lại rồi
  làm bước kế.
- Tiến độ: mỗi bước chạy npm run check rồi commit riêng, tick checklist trong plan, cập nhật PROGRESS.md. Nếu ngữ cảnh bị
  tóm tắt, đọc lại plan và log để làm tiếp.
- Kiểm chứng: mở admin trong trình duyệt (preview_start) để thử thật và đo lỗi giật bằng script, không đoán.
- Giữ quy tắc dự án: src/core thuần, không đụng save thật, không mạng, bản quyền, comment tiếng Anh, npm run guard xanh.
- Tắt âm mặc định chỉ áp cho save mới.
Khi xong C, merge `admin-upgrade` vào `overnight-hardening` bằng merge cục bộ (không vào main, không push).

## D. Tính năng đề xuất (chỉ làm khi A, B, C xong và `npm run check` xanh ngoài danh sách baseline)
Mỗi tính năng: nhánh con `feat/<tên>` từ overnight-hardening, theo đúng kiến trúc (logic thuần ở core/areas/*/logic, UI qua
store, chuỗi i18n vi + en, GameEvent + FeedbackDirector, đổi save thì tăng version + migration + test + before-migration
backup đã có), art chỉ placeholder + ghi docs/ASSET_TODO.md (decision 017). Cân bằng theo docs/GAME_BALANCE.md; số mới ghi
vào content/ + schema. Làm theo thứ tự ưu tiên; mỗi cái xong thì merge cục bộ vào overnight-hardening. Nếu tốn quá nhiều,
dừng ở cái đang làm dở, ghi trạng thái vào log, KHÔNG để nhánh dang dở bị merge.
D1. Sức khoẻ save: nút "Kiểm tra save" trong cài đặt (chạy parse + báo từng slice), cảnh báo khi backup mới nhất quá cũ,
    màn recovery chọn backup (đã có hạ tầng listBackups/restore).
D2. Nhiệm vụ tuần liên Area (dựa Order Board / goals): vài mục tiêu theo tuần chạm nhiều Area, thưởng coins/gems/token.
D3. Hội thi heo (Farm): thi theo mùa dựa phẩm chất, tính trạng, huyết thống, thưởng event token; dùng rng inject.
D4. Rift Adventure theo ngày: seed theo ngày của đồng hồ game, bảng điểm local theo từng lần chơi, offline.
D5. Cây phả hệ heo (UI đọc dữ liệu heredity sẵn có) + gợi ý cặp lai.
D6. Trợ năng: cỡ chữ, chế độ mù màu, hỗ trợ tay cầm cơ bản (Gamepad API, chỉ trong renderer); lưu ở settings.json, không ở save.
D7. Thao tác hàng loạt: thu hoạch / cho ăn / dọn nhanh theo Area, mỗi lần là 1 action có Transaction đúng.
D8. Mini-game nhỏ cho Garden/Cloud theo mẫu câu cá (logic thuần + UI), mặc định có thể bỏ qua (nút "làm nhanh").
D9. Nhà/Plaza tuỳ biến đồ trang trí; Album ảnh (chụp canvas → PNG qua dialog lưu, không mạng).
(D8, D9 chỉ làm nếu còn thời gian; ghi rõ trạng thái trong log.)

## E. Kết thúc
1. Chạy kiểm tra lần cuối: typecheck, lint, guard, assets:check, `npx vitest run --testTimeout=120000 --hookTimeout=120000`.
   So với baseline; liệt kê test fail còn lại và vì sao (do máy chậm hay do việc mới).
2. `git status` sạch, danh sách nhánh + commit, KHÔNG push.
3. Báo cáo tiếng Việt theo mẫu AGENT_RULES §7:
   ✅ Đã làm: / 📁 File thay đổi chính: / 🧪 Đã kiểm tra: / ⚠️ Vấn đề / quyết định đã tự đưa ra: /
   👉 Chủ dự án cần kiểm tra: / ➡️ Bước tiếp theo:
   Ghi kèm bảng việc: xong / dở / bỏ qua + lý do, và tên nhánh cần xem. Rồi dừng.
```
