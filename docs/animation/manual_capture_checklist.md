# Checklist chụp tay (những trạng thái script chưa tự chụp được)

Chơi trên **sandbox** (không dùng save thật): khởi động `sandbox-anim` (Claude Code → preview) hoặc `npm run dev:sandbox`. Chụp 1600×900 (Win + Shift + S hoặc F12 → Capture screenshot), lưu vào thư mục ghi ở cột cuối, tên `manual_<số>_<mô_tả>.png`, rồi thêm một dòng vào `00_index/screenshot_manifest_manual.csv` (cùng cột với file tự động).

| # | Trạng thái | Cách mở | Lưu vào |
| --- | --- | --- | --- |
| 1 | Trận chạm quái trên bản đồ | Trại → chọn đội → Lên đường → **tắt "Thắng nhanh"** trên HUD → đi (WASD) chạm một nhóm | `03_combat/initial_state/` |
| 2 | Trận kẻ canh khu (elite) | như 1, chạm nhóm có nhãn "Kẻ canh khu" | `02_adventure_maps/roadblock_enemies/` |
| 3 | Trận trùm + đổi pha | khu thứ 3 của vùng (vd. `map_forest_heart`) → nhóm "Trùm vùng"; đánh tới khi banner đổi pha hiện | `02_adventure_maps/bosses/`, `03_combat/rage_and_ultimate/` |
| 4 | Cut-in Tuyệt kỹ | trong trận, đợi một bạn đầy Nộ → thẻ Tuyệt kỹ | `03_combat/rage_and_ultimate/` |
| 5 | Phản ứng nguyên tố | dùng kỹ năng Nước rồi Sấm lên cùng kẻ địch (Điện Giật) | `03_combat/buffs_debuffs/` |
| 6 | Thua trận + gợi ý | chọn 1 bạn cấp thấp → Vết Nứt nhiều tầng hoặc trùm Núi | `03_combat/defeat/` |
| 7 | Cổng nguyên tố, rương, suối, đền, bia, lữ khách | đi bản đồ, đứng cạnh vật (gợi ý Space) và bấm Space | `02_adventure_maps/map_nodes_and_routes/` |
| 8 | Cổng dịch chuyển | đứng ở cổng đã thắp, bấm Space | `07_other_screens/` |
| 9 | Đi nhanh | Trại → vùng đã hạ trùm → "Đi nhanh" | `06_rewards_and_progression/` |
| 10 | Bật "Giảm chuyển động" trong trận | Menu → Cài đặt → Giảm chuyển động: Bật → vào trận | `08_issues_and_opportunities/` |
