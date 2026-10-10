# 011 — Bản cài desktop đầu tiên (GĐ4)

**Ngày:** 2026-10-10 · **Trạng thái:** Đã làm · Bổ sung cho 005 (giữ Electron + electron-builder)

## Bối cảnh
Hầu hết đóng gói đã có từ Sobi Farm (Electron, NSIS, giao thức `app://`, save ghi nguyên tử, Admin không vào build).
GĐ4 chỉ còn: đổi tên thành Sobi World, kiểm tự động rằng bản của người chơi không chứa Admin và không chạm mạng,
hướng dẫn build và hướng dẫn thử trên máy sạch.

## Lựa chọn
- **Công cụ:** giữ Electron + electron-builder, target NSIS (xem 005). Chỉ Windows x64. macOS không làm: build `.dmg`
  cần máy Mac và chữ ký Apple; mã đã dùng đường dẫn trung tính (`app.getPath`) nên thêm sau không phải sửa game.
- **Tên:** `productName` "Sobi World", `appId` `com.sobiworld.game`, exe `SobiWorld.exe`, file cài `SobiWorld-Setup-<version>.exe`,
  shortcut Desktop + Start Menu "Sobi World". Gói npm `sobi-world`, version `0.4.0` (từ nay tăng theo giai đoạn).
  `appId` mới ⇒ cài song song được với Sobi Farm cũ, không ghi đè.
- **Save:** `%APPDATA%\SobiWorld\` (`saves/save.json`, `saves/backups/`, `settings.json`, `window-state.json`). Gỡ cài đặt **không xóa** save
  (`deleteAppDataOnUninstall: false`). Lần chạy đầu tự chép save Sobi Farm (`%APPDATA%\Un In Homemade\saves`) sang nếu có, không xóa bản cũ (decision 001, `electron/dataDir.ts`).
- **Kiểm bản người chơi — hai lớp, đều nằm trong `npm run dist:win`:**
  1. `verify:build` (`scripts/verify-build.ts`): `dist/` + `dist-electron/` không có file/chuỗi của Admin (`admin.html`, `/__admin`, `adminApi`),
     không có dấu vết dev server, không có file ngoài `dist/`, `dist-electron/`, `package.json`, không source map, không URL ngoài
     (chỉ cho phép định danh XML/schema như `w3.org`, `phaser.io`).
  2. `verify:installer` (`scripts/verify-installer.ts`): mở `app.asar` thật trong `release/win-unpacked` và chạy cùng bộ luật,
     rồi chạy `SobiWorld.exe` bằng Playwright: cửa sổ tên "Sobi World" hiện lên, save ghi vào thư mục dữ liệu, **không có request mạng nào**.
  Luật nằm ở `scripts/build/checks.ts` (hàm thuần, có `tests/scripts/buildChecks.test.ts` chạy trong `npm run check`).
- **Offline:** CSP `connect-src 'self'`, chặn mọi `http(s)` ở `session.webRequest`, từ chối mọi quyền, font bundle sẵn (`@fontsource`). Đã có từ trước, nay được kiểm tự động.
- **Biến môi trường kiểm thử:** `SOBIWORLD_APPDATA` thay `%APPDATA%` để chạy exe thật trên thư mục tạm mà không đụng save của người chơi
  (`APPDATA` của tiến trình không đủ: Electron lấy thư mục qua API của Windows). Người chơi không đặt biến này; nếu có đặt, chỉ đổi chỗ lưu.
- **Chưa ký số (code signing):** Windows SmartScreen sẽ cảnh báo "Unknown publisher" khi cài. Ký cần chứng chỉ trả phí; để khi phát hành công khai.

## Hệ quả
- File cài khoảng 145 MB (Chromium của Electron + art). Chấp nhận cho game offline; giảm bằng nén art ở giai đoạn sau nếu cần.
- `npm audit` còn 9 cảnh báo, **đều trong công cụ build** (`electron-builder` và phụ thuộc), không có trong game gửi cho người chơi. Sửa bằng `npm audit fix --force` sẽ nâng electron-builder lên bản lớn khác; để dành, ghi ở PROGRESS.
