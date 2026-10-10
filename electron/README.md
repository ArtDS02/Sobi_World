# electron/

Tiến trình chính của bản desktop (Node API chỉ được dùng ở đây). Build bằng `vite.electron.config.ts` ra `dist-electron/*.cjs`.

- `main.ts` — cửa sổ, giao thức `app://` (phục vụ `dist/`), khóa mạng + quyền, single instance, IPC save/settings, flush khi thoát.
- `preload.ts` — cầu nối IPC sang renderer (`window.unin…`, kiểu ở `src/platform/desktop/bridge.ts`).
- `dataDir.ts` — thư mục dữ liệu: bản cài `%APPDATA%\SobiWorld\`, chạy dev `%APPDATA%\SobiWorld Dev\`; chép save Sobi Farm sang lần đầu.
- `saveFiles.ts`, `settingsFile.ts`, `windowState.ts` — ghi file nguyên tử (tạm → đổi tên), backup, đọc ứng viên khi tải.

Biến môi trường (chỉ cho dev/kiểm thử, người chơi không đặt): `UNIN_DEV_URL` (dev server, chỉ khi chưa đóng gói),
`UNIN_USER_DATA` (thư mục dữ liệu tạm, chỉ khi chưa đóng gói), `SOBIWORLD_APPDATA` (thay `%APPDATA%`, dùng cả bản đóng gói).

Build và kiểm bản cài: `docs/BUILD.md`.
