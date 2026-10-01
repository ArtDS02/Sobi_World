Current phase: R04 — Asset foundation + placeholder wave 0      Status: DONE
Current task: -
Completed: S00…S08B, R00, R01, R02, R03, R04 — tag r04
In progress: -
Known issues: Action đã có chưa phát event feedback → R05B. File trích Phụ lục chưa prettier. Fuzz invariant §5.5 → R08. Away summary (§9.5) chưa ghép → R11. Màn recovery chưa có nút nhập file/bắt đầu mới → R11. Tutorial chưa có → R11. README (SmartScreen §13.3, giới hạn §13.5) chưa có. Settings mới tối thiểu (Xuất/Nhập/Mở thư mục) — restoreBackup/credits/version → R11. Icon placeholder (scripts/make-icon.mjs). "Tắt mạng vẫn chạy": kiểm bằng webRequest chặn fetch https (không tự tắt mạng máy). Chơi thử ★ R02 trên bản cài: user chưa phản hồi. Lịch sử phối giống (vi.history.breeding) chưa có — khi làm breeding. Toast SLOT_BOUGHT/ITEM_BOUGHT… → R05B. Manifest chưa thử dưới app:// trên bản cài (fetch tương đối, CSP connect-src self) → kiểm ở R05A.
Important decisions: R04-1, R04-2 (DECISIONS.md).
Desktop: electron/{main,preload,saveFiles,windowState}.ts → dist-electron/*.cjs (vite.electron.config.ts). src/platform/desktop/{bridge(type),fileSaveStorage,fileDialogs}.ts. createPlatform() chọn desktop khi có window.unin. Save: %APPDATA%\Un In Homemade\saves\. Thư mục test tự kiểm đã đổi tên saves-r02-selftest, saves-r02-devdesktop.
Next task: R05A — block "### R05A" trong PROMPTS_THEO_PHASE.md (canvas Phaser vào .app__stage, đọc registry/layout).
Assets: src/core/assets/{manifestSchema,registry}.ts, config/assetIds.ts, platform/assetSource.ts, ui/devGallery.ts; scripts/{make-placeholders,assets-check}.ts + scripts/assets/.
Thêm/đổi asset không đụng TS: (1) thêm/sửa row trong public/assets/manifest/assets.json (id snake_case, status "placeholder") rồi `npm run assets:placeholders` để có file tạm; (2) art thật: ghi đè file cùng đường dẫn trong public/assets/ (hoặc đổi `asset` sang .ogg…), đặt status "production"; (3) `npm run assets:check` + `npm run dev` ?dev=1 → nút assets để xem; đạt thì status "final".
