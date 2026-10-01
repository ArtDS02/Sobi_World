Current phase: R01 — Platform seam      Status: DONE
Current task: -
Completed: S00, S02, S03, S04A, S04B, S05, S06A, S06B, S07, S08A, S08B, R00, R01 — tag r01
In progress: -
Known issues: skins.ts còn giữ giá skin — C2 chuyển sang assets.json → R04. Action đã có chưa phát event feedback → R05B. File trích Phụ lục chưa prettier. Fuzz invariant §5.5 → R08. §14.3 buySlot chưa làm → R03. Away summary (§9.5) chưa ghép → R11. Màn recovery chưa có nút nhập file/bắt đầu mới → R11. Lịch sử chưa có lối vào → R03. Tutorial chưa có → R11. vi.ts còn install/installHint/update (Phụ lục B v4.1 bỏ) → R02. AppOptions.dialogs (FileDialogs) đã inject nhưng chưa có màn Settings dùng.
Important decisions: R01-1 (DECISIONS.md).
Platform: src/core/save/port.ts (SaveStorage/FileDialogs/InstanceGuard); src/platform/index.ts createPlatform() chỉ web; web/{idbSaveStorage,tabGuard,fileDialogs}.ts. Store nhận storage + instanceGuard qua inject; snapshot.saveError + retry SAVE.SAVE_RETRY_MS. tsconfig.core.json (không DOM) trong typecheck. Vite base './'. .app__stage trong app.ts (ngoài patch) chờ canvas Phaser R05A.
Next task: R02 — block "### R02" trong PROMPTS_THEO_PHASE.md: electron/ (main, preload, saveFiles), src/platform/desktop/ + nhánh window.unin trong createPlatform(), bỏ vi install/update, installer; cổng chơi thử ★ trên bản cài.
