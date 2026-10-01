Current phase: R02 — Electron + file save + installer      Status: DONE ★ (chờ user chơi thử S08B trên bản cài)
Current task: -
Completed: S00…S08B, R00, R01, R02 — tag r02
In progress: -
Known issues: skins.ts còn giữ giá skin — C2 chuyển sang assets.json → R04. Action đã có chưa phát event feedback → R05B. File trích Phụ lục chưa prettier. Fuzz invariant §5.5 → R08. §14.3 buySlot chưa làm → R03. Away summary (§9.5) chưa ghép → R11. Màn recovery chưa có nút nhập file/bắt đầu mới → R11. Lịch sử chưa có lối vào → R03. Tutorial chưa có → R11. README (SmartScreen §13.3, giới hạn §13.5) chưa có. Settings mới tối thiểu (Xuất/Nhập/Mở thư mục) — restoreBackup/credits/version → R11. Icon placeholder (scripts/make-icon.mjs). "Tắt mạng vẫn chạy": kiểm bằng webRequest chặn fetch https (không tự tắt mạng máy).
Important decisions: R02-1…R02-4 (DECISIONS.md).
Desktop: electron/{main,preload,saveFiles,windowState}.ts → dist-electron/*.cjs (vite.electron.config.ts). src/platform/desktop/{bridge(type),fileSaveStorage,fileDialogs}.ts. createPlatform() chọn desktop khi có window.unin. Save: %APPDATA%\Un In Homemade\saves\. Thư mục test tự kiểm đã đổi tên saves-r02-selftest, saves-r02-devdesktop.
Next task: chờ phản hồi chơi thử ★ của user; sau đó R03 — block "### R03" trong PROMPTS_THEO_PHASE.md.
