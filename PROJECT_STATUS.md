Current phase: R03 — Shop / Kho / Level / Slot / Lịch sử      Status: DONE
Current task: -
Completed: S00…S08B, R00, R01, R02, R03 — tag r03
In progress: -
Known issues: skins.ts còn giữ giá skin — C2 chuyển sang assets.json → R04. Action đã có chưa phát event feedback → R05B. File trích Phụ lục chưa prettier. Fuzz invariant §5.5 → R08. Away summary (§9.5) chưa ghép → R11. Màn recovery chưa có nút nhập file/bắt đầu mới → R11. Tutorial chưa có → R11. README (SmartScreen §13.3, giới hạn §13.5) chưa có. Settings mới tối thiểu (Xuất/Nhập/Mở thư mục) — restoreBackup/credits/version → R11. Icon placeholder (scripts/make-icon.mjs). "Tắt mạng vẫn chạy": kiểm bằng webRequest chặn fetch https (không tự tắt mạng máy). Chơi thử ★ R02 trên bản cài: user chưa phản hồi. Lịch sử phối giống (vi.history.breeding) chưa có — khi làm breeding. Toast SLOT_BOUGHT/ITEM_BOUGHT… → R05B.
Important decisions: R03-1, R03-2 (DECISIONS.md).
Desktop: electron/{main,preload,saveFiles,windowState}.ts → dist-electron/*.cjs (vite.electron.config.ts). src/platform/desktop/{bridge(type),fileSaveStorage,fileDialogs}.ts. createPlatform() chọn desktop khi có window.unin. Save: %APPDATA%\Un In Homemade\saves\. Thư mục test tự kiểm đã đổi tên saves-r02-selftest, saves-r02-devdesktop.
Next task: R04 — block "### R04" trong PROMPTS_THEO_PHASE.md.
UI R03: screens/{shop,inventory,history}Screen.ts, actionsVm shopPigs/shopItems/itemPurchase/shopSlot, viewModel historyVm/signedGold/xpProgress, dialogs openBuyItemDialog. Kiểm dev:desktop: npm run dev:desktop -- --remote-debugging-port=9334 (CDP).
