# Chống cache giữa các vòng

Mục tiêu: **ảnh/số mà TD xem luôn là của đúng code hiện tại**, và mỗi session AI không dựa vào ký ức cũ. Có 3 loại "cache": (A) kỹ thuật khi chụp, (B) bằng chứng cũ lẫn vào, (C) ngữ cảnh AI.

## A. Cache kỹ thuật khi chụp (Tester phải xử lý hết)

| # | Nguồn cache | Triệu chứng | Biện pháp bắt buộc |
|---|---|---|---|
| A1 | **Dev server cũ còn chạy** (vd `npm run admin` ở 5175 do session trước bỏ lại, `hmr:false` nên không tự nạp lại) | Chụp ra code cũ | Harness **tự khởi động server riêng** (cổng riêng, `strictPort: true`); nếu cổng bận → **dừng và báo**, không gắn vào server có sẵn. Tắt server khi xong (kể cả khi lỗi, dùng `finally`). |
| A2 | **Vite dep/transform cache** (`node_modules/.vite`) | Module cũ | Server chạy với `--force` và `cacheDir` riêng trong thư mục tạm theo `runId` (config bọc ngoài `vite.admin.config.ts`, đặt ở `scripts/anim-review/`). Xóa sau run. |
| A3 | **HTTP cache / service worker / IndexedDB / localStorage** của trình duyệt | Texture, JSON cũ | Mỗi lô case = `browser.newContext()` mới (không persistent), `serviceWorkers: 'block'`, Chromium args `--disk-cache-size=1 --media-cache-size=1`; điều hướng bằng URL có `?run=<runId>`. |
| A4 | **`dist/`, `dist-electron/` cũ** (bẫy kinh điển của e2e) | Chụp bản build cũ | Chụp skill/status/ultimate **từ source qua dev server**, không từ `dist`. Case cần Electron (map walking): chạy `npm run build` **trong cùng lệnh**, và manifest ghi `dist_newer_than_sources: true` (mtime). Sai → hủy run. |
| A5 | **Phaser texture cache / asset cũ** | Sprite/VFX cũ | Mỗi lô case tải trang mới; canary A8 kiểm tra PNG đã phục vụ. |
| A6 | **Đồng hồ thật** (`performance.now`, rAF), `Math.random`, GPU → ảnh mỗi lần mỗi khác | Không so TRƯỚC/SAU được | `page.clock` (`install` → warm-up → `pauseAt(600000)` → `runFor(dt)` từng bước); `Math.random` seed 1234 (seed lại ngay trước play đo); WebGL phần mềm SwiftShader. Phaser nạp ảnh lười tại cue cần ⇒ **play khởi động** trước, rồi mới play đo. Giá trị ghi trong `manifest.env`. **Đã kiểm chứng**: hai run liên tiếp DIFF 0.0%. |
| A7 | **Cổng xác định (determinism gate)** | A6 hỏng ngầm | Trước mỗi run: chụp 1 case chuẩn **2 lần** (context khác nhau) → hai bộ frame phải **giống từng pixel** (hoặc diff ≤ ngưỡng ghi trong manifest). Fail → run `complete:false`, không giao cho TD. |
| A8 | **Cache canary: phục vụ == đĩa** | Server/browser phục vụ file cũ | Với các file "chứng": `content/adventure/battle_fx.json`, `BattleScene.ts` và mỗi module `ui/battle*.ts` đã thay đổi so với run trước, vài PNG asset đang dùng → `fetch(url, {cache:'no-store'})` trong trang, băm SHA-1, so với băm trên đĩa. Lệch → `CACHE_SUSPECT`, hủy run. Ghi bảng băm vào manifest. |
| A9 | **tsx/ts cache** cho script harness | Script cũ | Harness chạy qua `npx tsx`; nếu nghi, chạy lại với cache tạm xóa. Không dựa vào kết quả một lần chạy trước. |

## B. Bằng chứng cũ lẫn vào

- **runId** = `YYYYMMDD-HHmmss-<gitShortHead>-<dirty8>`; `dirty8` = 8 ký tự đầu SHA-1 của: `git diff HEAD` + nội dung file untracked trong `src/ content/ public/assets tools/admin` (bắt cả code Dev chưa commit).
- **Stamp** (runId + head + dirty8 + danh sách băm file nguồn quan trọng) nằm trong `manifest.json`, `CAPTURE_MANIFEST.md`, tên thư mục và **tiêu đề mọi contact sheet** (in thẳng lên ảnh).
- **Bất biến**: `capture/runs/<runId>/` chỉ được tạo mới (đã tồn tại → harness báo lỗi). Cấm cơ chế "đã có thì bỏ qua". Thư mục chưa xong chứa file `INCOMPLETE`; chỉ khi xong mới xóa nó và ghi `LATEST.json` (`complete:true`) **sau cùng**. Run dở không bao giờ trở thành LATEST. (Không dùng đổi tên thư mục `.partial`: Windows trả EPERM khi có tiến trình giữ handle.)
- **Chụp lại sau fix**: phạm vi = các case thuộc ID được sửa **+ mẫu hồi quy** (1 frame lúc impact của *mọi* case, sheet tổng). Không chụp lại một phần rồi coi như toàn bộ.
- **Bắt buộc có thay đổi**: Tester so băm file nguồn với run trước. Nếu Dev báo đã sửa file X mà băm X không đổi / stamp không đổi → ghi `NO_CHANGE_DETECTED` ở đầu manifest; TD không review mà trả lại Dev.
- **TD kiểm tra đầu vào** trước khi nhìn ảnh: `manifest.stamp == STATE.lastCapture.stamp`, `complete == true`, `determinism == pass`, `canary == pass`, `round` khớp. Sai một điều kiện → dừng, không viết feedback.
- **Dev báo cáo** `FIX_REPORT.md` có danh sách file đổi + băm; đối chiếu được với manifest vòng sau.

## C. Cache ngữ cảnh AI

- Session mới không có trí nhớ: **luôn bắt đầu bằng đọc `STATE.json`**, rồi chỉ đọc các file nó trỏ tới. Không dựa vào "lần trước thấy…".
- Không đọc lại cả bản v1 (400+ dòng) mỗi vòng: dùng bảng ID + trạng thái trong `FEEDBACK.md` của vòng mới nhất (TD sao chép sang bảng trạng thái, có cột `since_round`).
- Trích dẫn code theo **tên hàm + file**, số dòng chỉ là gợi ý (working tree đổi liên tục). Dev đọc lại file ngay trước khi sửa.
- Mỗi tài liệu ở đầu ghi `round`, `runId`, `ngày`. Tài liệu thiếu hoặc lệch `STATE.json` = cũ, bỏ qua.
- Ảnh: TD mở **đường dẫn tuyệt đối của run hiện tại** từ manifest, không mở theo đường dẫn nhớ từ vòng trước.

## D. Khi nghi cache

Ghi `CACHE_SUSPECT` + bằng chứng (băm lệch, stamp trùng dù đã sửa…), xóa `cacheDir` tạm, chạy lại **một lần** với cổng mới. Lần hai vẫn nghi → `escalated`, không tự vòng tiếp.

## E. Lẫn dữ liệu giữa lần khởi động và lần đo (bài học vòng 1)
Hiệu ứng của lần chạy khởi động (vd băng vỡ khi status gỡ ra) từng còn sót ở `t=0` của lần đo. Harness nay kết thúc khởi động bằng bước rỗng và đợi 1,5 s (`session.ts::prepare`). Nếu `t=0` của một sheet còn hiệu ứng lạ → coi là `CACHE_SUSPECT`-loại-state, báo Tester.
