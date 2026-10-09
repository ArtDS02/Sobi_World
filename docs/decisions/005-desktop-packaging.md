# 005 — Đóng gói desktop: giữ Electron + electron-builder

**Ngày:** 2026-10-09 · **Trạng thái:** Đề xuất trong `AUDIT_AND_PLAN.md` mục e, ghi lại khi hoàn thành GĐ1

## Bối cảnh
Sobi Farm đã ra installer NSIS bằng Electron: nạp `dist/` qua giao thức `app://` (không HTTP server, không cổng mạng),
font bundle sẵn, save ở `%APPDATA%`, single-instance lock, Admin không có trong build (entry `admin.html` riêng).
GĐ1 chạy `npm run build` và e2e (`npm run test:e2e`: mua heo, đổ máng, mở lại, xuất save, save v4 → v8, loài mới) đều pass.

## Lựa chọn
Giữ Electron + electron-builder (NSIS). Không chuyển sang Tauri.

## Lý do
Tauri nhẹ hơn nhưng phải viết lại `electron/` sang Rust, WebView2 khác Chromium ở WebGL/Phaser, và mất phần ghi save
đã có test (`tests/electron/saveFiles.test.ts`). Rủi ro lớn, không phục vụ yêu cầu hiện tại (offline, chơi đơn).

## Việc còn lại (GĐ4)
Đổi tên app/installer thành "Sobi World" (`productName`, `appId`, icon), test build không chứa Admin,
`docs/BUILD.md`, thử trên máy sạch, xử lý cảnh báo `npm audit` của thư viện dev.
