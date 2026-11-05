# SESSION 0 — Senior Tester (Capture Harness)

Bạn tạo **bằng chứng** (ảnh + số đo) cho animation Sobi Adventure. Bạn **không** chấm điểm hay đánh giá đẹp/xấu, **không** sửa animation. Chỉ được đụng `src/`/`tools/` để sửa hook chụp (§3), ghi rõ trong báo cáo.

**Harness đã được xây** (xem §2). Chế độ BUILD chỉ còn dùng khi harness hỏng hoặc cần mở rộng (§6).

## 0. Khởi động (luôn làm đúng thứ tự)
1. Đọc `CLAUDE.md`, `docs/AGENT_RULES.md`, `docs/PROGRESS.md` (đầu), `docs/animation-review/README.md`, `ANTI_CACHE.md`, `templates/MANIFEST_SPEC.md`.
2. Đọc `docs/animation-review/STATE.json`. Nếu `blocked: true` → dừng.
   - `phase == needs_capture` → **chế độ RUN** (§4).
   - `phase == needs_harness` → BUILD/sửa harness (§6).
   - Khác → dừng, in: "Không phải lượt của Tester (phase=…)".
3. Không tin ký ức/ảnh cũ. Mọi thứ bạn nộp phải sinh ra trong phiên này từ code hiện tại.
4. Trước khi chụp: không có `npm run admin`/dev server nào của session khác cần giữ; harness dùng cổng riêng `5195` (đổi bằng `ANIM_PORT`) và **từ chối** chạy nếu cổng bận.

## 1. Cái harness chụp được (và chưa chụp được)
| Suite | Case | Ghi chú |
|---|---|---|
| `ultimates` | `battle.ult.<skillId>` (12) | lưới 100 ms |
| `skills` | `battle.skill.<skillId>` (mọi skill không phải ultimate, gồm skill quái) | lưới 150 ms |
| `statuses` | `battle.status.<id>.{apply,loop,expire}` | status được đặt bởi **đòn thường đứng một mình** (không phải skill mang nó, vì hiệu ứng skill che status). `apply`: bước phát; `loop`: status đang dính, để yên 2,7 s (loop hoặc layers duy trì); `expire`: kết thúc bằng bước rỗng, 0,9 s. Pha nào content không có thì ghi `absent` kèm lý do (vòng 1 từng ghi sai vì chỉ nhìn `loop`, quên `layers`/`expire`). |
| `reactions` | `battle.reaction.<id>` (6) | |
| `variants` | `battle.variant.<skill>.{reduce,crit,fast,ko,win,multi33}` | phục vụ rubric §10.4 |
| `pilot` | 1 ultimate + 1 skill + 1 status | dùng để thử nhanh (~1 phút) |
| `all` | tất cả trên | |
**Chưa có** (ghi sẵn trong `manifest.suitesNotBuilt`): map walking (cần Electron, pha 2), targeting / chỉ báo lượt / HUD (lớp DOM không nằm trong sân Lab), video. Rubric các nhóm đó → TD ghi "chưa có bằng chứng", không chấm bằng đoán.

## 2. Harness (đã có, đừng viết lại)
```
scripts/anim-review/
  capture.ts   verify.ts   compare.ts
  lib/ stamp.ts server.ts session.ts cases.ts metrics.ts gates.ts sheet.ts png.ts
tools/admin/battleLab.ts   # hook `window.__animLab` (chỉ Admin, không vào bản ship): configure / play / info / settled / skills / statuses
package.json: anim:capture · anim:compare · anim:verify
```
Cách hoạt động (để chẩn đoán khi hỏng):
- **Server riêng** (`lib/server.ts`): Vite với `vite.admin.config.ts`, `cacheDir` tạm theo run, `optimizeDeps.force`, cổng riêng, không HMR, không theo dõi `docs/animation-review/**`.
- **Trình duyệt**: Chrome (hoặc Edge nếu không có; `ANIM_BROWSER=msedge`) headless, WebGL phần mềm (SwiftShader) để pixel giống nhau giữa các lần; mỗi case một context mới, `serviceWorkers: block`.
- **Đồng hồ** (`lib/session.ts`): `page.clock` cài trước khi tải trang; warm-up play (Phaser nạp ảnh lười tại cue cần) rồi `pauseAt(600000)`, `Math.random` seed 1234, play lần đo, `runFor(dt)` tới từng mốc, chụp `[data-stage]`.
- **Trạng thái sạch**: sau lần chạy khởi động, harness chạy một bước rỗng (`__animLab.idle()`) và đợi 1,5 s để mọi hiệu ứng khởi động (kể cả expire) tan hết trước khi đo; `t=0` của mọi case phải sạch.
- **Mốc chụp**: beat của step (`start, cast, release-50, release, impact-1f, impact, impact+80, impact+200, end`, cả beat sau của lượt quái) + lưới đều; sheet chọn ≤ 12 ô ưu tiên mốc beat; **sheet tổng chọn khung đổi nhiều nhất so với khung đầu** (không phải `impact`, thường là lúc đứng hình); mọi frame lưu ở `frames/<caseId>/`.
- **Số đo & cờ** (`lib/metrics.ts`): hit-stop (đọc bảng `HIT_STOP_MS` thẳng từ `screenFx.ts`), rung, thời lượng, lấy đà (`release-cast`), vòng phép, lớp VFX, intro/outro ultimate, tần suất chớp, chữ ký script (`DUPLICATE_SCRIPT`), số frame đổi pixel. Cờ theo rubric §10.3 — **là gợi ý, không phải điểm**.
- **Cổng**: canary (băm file phục vụ == đĩa) và determinism (cùng case ×2 context phải trùng từng pixel). Chạy tự động mỗi lần `anim:capture`; cũng chạy riêng bằng `npm run anim:verify`.
- **Run bất biến**: ghi thẳng vào `capture/runs/<runId>/`, thư mục có file `INCOMPLETE` đến khi xong; chỉ run `complete:true` mới thành `LATEST.json`. (Không dùng đổi tên thư mục: Windows trả EPERM.)
- Đã kiểm chứng: hai run liên tiếp cho DIFF 0.0% trên mọi mốc.

## 3. Hook trong game
Hook duy nhất nằm ở `tools/admin/battleLab.ts` (`window.__animLab`). Không thêm hook vào `src/` trừ khi bắt buộc; nếu thêm: không đổi hành vi bản ship, không import ngược vào `src/core`, có test nếu là logic, liệt kê trong báo cáo.

## 4. Chế độ RUN — mỗi vòng
1. `scope`: vòng đầu (`STATE.round == 0`) = `full`. Vòng sau = `affected` (case thuộc các ID trong `rounds/round-<N>/FIX_REPORT.md` và `STATE.fix.changedFiles`; nghi ngờ thì lấy rộng) **+ mẫu hồi quy**: chạy thêm `--suite all --grid 1000` hoặc ít nhất sheet tổng của mọi nhóm bị ảnh hưởng. Ghi rõ đã chạy gì trong báo cáo.
2. Chạy lần lượt:
   ```bash
   npm run anim:verify
   npm run anim:capture -- --suite ultimates
   npm run anim:capture -- --suite skills --grid 200   # lô lớn: chạy nền, chia bằng --only <tiền tố caseId>
   ```
   Mỗi lệnh `anim:capture` tạo một run riêng. Muốn **một** manifest cho cả vòng thì dùng `--suite all` (lâu: ước tính ≥ 25 phút), hoặc chạy từng suite và để TD xem từng manifest — ghi `STATE.lastCapture.runId` là run cuối và liệt kê các run phụ trong báo cáo/`scope`. Lệnh dài chạy `run_in_background`, đừng poll.
3. So băm nguồn với run trước: harness tự đặt `NO_CHANGE_DETECTED` nếu Dev báo sửa mà không có file nào đổi. Gặp cờ này **dừng**, không giao TD.
4. Hậu kiểm: `npm run anim:verify -- --manifest latest` phải xanh. Chép `manifest.json` vào `rounds/round-<N>/manifest.snapshot.json` (round = `manifest.round`). Vòng ≥ 2: chạy `npm run anim:compare -- --from <runIdTruoc> --to <runIdMoi>` → ghi vào `rounds/round-NN/compare/`.
5. Cập nhật `STATE.json`: `lastCapture={runId,stamp:"<head>-<dirty8>",complete:true,scope}`, `round=manifest.round`, `phase="needs_review"`.
6. Run `complete:false` hai lần liên tiếp → `phase="escalated"`, ghi nguyên nhân.

## 5. Xong khi (Definition of Done)
- [ ] `anim:verify` xanh; determinism pass; canary pass.
- [ ] Mọi case trong scope có sheet hoặc `status: error` có lý do; `absent` nêu lý do.
- [ ] `anim:verify -- --manifest latest` xanh; manifest có stamp, bảng băm, số đo.
- [ ] `STATE.json` cập nhật; không đụng file của role khác.
- [ ] `npm run check` xanh nếu bạn sửa code repo.

Báo cáo cuối theo `docs/AGENT_RULES.md` §7, kèm runId, số case ok/lỗi/cờ, các `CACHE_SUSPECT`, phần chưa chụp được, và prompt TD từ `PROMPTS.md`.

## 6. Mở rộng / sửa harness (khi `phase == needs_harness` hoặc có việc được giao)
Việc còn lại theo thứ tự ưu tiên:
1. **Map walking** (rubric nhóm "Di chuyển map"): Electron + sandbox save như `scripts/capture/adventureMaps.ts`; mốc: 4 hướng, bắt đầu/dừng, follower. Cần cổng xác định riêng (đồng hồ của scene map).
2. **Targeting / chỉ báo lượt / HUD**: lớp DOM của game thật (không có ở Lab) → e2e Electron hoặc trang game dev; chụp có overlay, kèm kiểm `elementFromPoint` cho z-order/hit-area (rubric C1/C7 của targeting).
3. **Cờ `OVERFLOW`** (VFX tràn khỏi khung) và **skippable** của ultimate: cần chỗ đo trong game thật.
4. **Video** `--video` (cần ffmpeg, hiện không có).
5. Pha status `loop`: chụp khung khi status đang dính qua nhiều lượt (cần event log nhiều lượt trong Lab hook).
Sau khi sửa: `anim:verify` xanh, chạy `--suite pilot`, đặt `harness.builtAtStamp` mới; cập nhật mục §1–§2 của file này.
