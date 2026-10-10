# BUILD — Build bản cài Sobi World (Windows)

Dành cho người có công cụ lập trình. Muốn thử bản cài trên máy bình thường: xem `TEST_MAY_SACH.md`.

## Yêu cầu
Node.js 22+ và `npm ci` đã chạy. Build cần mạng **một lần** để `npm ci` tải thư viện; game thì không bao giờ cần mạng.

## Lệnh

| Lệnh | Làm gì |
|---|---|
| `npm run check` | Cổng chất lượng: typecheck, lint, guard kiến trúc, asset, toàn bộ unit test. Phải xanh trước khi build. |
| `npm run build` | Typecheck + build game (`dist/`) + build tiến trình chính Electron (`dist-electron/`). |
| `npm run dist:win` | `build` → đóng gói installer NSIS → `verify:build` → `verify:installer`. Một lệnh ra bản cài đã kiểm. |
| `npm run verify:build` | Chỉ kiểm `dist/`, `dist-electron/`: không Admin, không dấu vết dev, không URL ngoài. |
| `npm run verify:installer` | Kiểm `release/win-unpacked` (cần `dist:win` trước): nội dung `app.asar` + chạy `SobiWorld.exe` trên thư mục dữ liệu tạm. |
| `npm run test:e2e` | Build + chạy thử game thật bằng Playwright-Electron (mua heo, lưu, mở lại, đi lại ở Sảnh…). |
| `npm run dev:sandbox` | Chạy game trên trình duyệt với thư mục dữ liệu tạm (`%TEMP%\sobiworld-sandbox`, đổi bằng `SOBIWORLD_SANDBOX`): thử mà không đụng save dev. Đặt sẵn `saves\save.json` để bắt đầu từ thế giới có sẵn. |
| `npm run icon` | Vẽ lại icon tạm (`build/icon.png`, `build/icon.ico`). |

## File ra ở đâu (thư mục `release/`, không commit)

- `release/SobiWorld-Setup-<version>.exe` — **file cài gửi cho người chơi** (~145 MB). Cài theo người dùng (không cần quyền quản trị), cho chọn thư mục, tạo shortcut Desktop và Start Menu "Sobi World".
- `release/win-unpacked/SobiWorld.exe` — bản đã giải nén, chạy thẳng không cần cài (dùng để kiểm nhanh).
- `release/latest.yml`, `*.blockmap`, `builder-debug.yml` — file của electron-builder, không cần gửi.

Version lấy từ `package.json` (`version`). Tăng khi ra bản mới.

## Dữ liệu người chơi
`%APPDATA%\SobiWorld\` — `saves\save.json` (+ `backups\`), `settings.json`, `window-state.json`. Gỡ cài đặt không xóa thư mục này.
Chạy `npm run dev` / `dev:desktop` dùng `%APPDATA%\SobiWorld Dev\` để không đụng save thật.
Biến `SOBIWORLD_APPDATA=<thư mục>` đổi chỗ thay `%APPDATA%` (dùng cho kiểm tự động).

## Cách kiểm bản build
1. `npm run dist:win` phải kết thúc bằng hai dòng `verify:build OK` và `exe OK`.
2. Admin không có trong bản người chơi: `verify:build` quét tên file và nội dung; bản luật có test ở `tests/scripts/buildChecks.test.ts`.
3. Mở `release/SobiWorld-Setup-<version>.exe` trên máy sạch theo `TEST_MAY_SACH.md`.

## Lưu ý
- Chưa ký số: Windows SmartScreen hiện "Unknown publisher" → chọn "More info" → "Run anyway".
- Tắt game đang chạy (kể cả trong Task Manager) trước khi build lại, nếu không `release/` bị khóa file.
- macOS/Linux chưa hỗ trợ (decision 011).
