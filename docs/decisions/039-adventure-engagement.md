# 039 — Sobi Adventure: nhịp chơi, cảm giác đánh, gắn bó và endgame

**Ngày:** 2026-10-23 · **Trạng thái:** đã làm phần code (2026-10-24), chờ chủ dự án chơi thử. Chủ dự án đồng ý toàn bộ đề xuất ("tôi đồng ý với mọi quyết định của bạn", 2026-10-23).
**Liên quan:** decision 037 (Adventure V2), 021 (băng gameplay: Adventure được mở có giới hạn từ 037), spec `update_spec_sobi_adventure_gameplay_v1.md` (§25 trỏ về đây).

## Bối cảnh
Adventure V2 có hệ thống sâu nhưng: bot hết nội dung khoảng ngày 31 (cấp 30, đủ 3 vùng); một chuyến khoảng 14 trận 4–7 vòng nên nhiều trận thành "bấm Tự động"; 22 kẻ địch cho 9 khu nên lặp nhanh; nhiều hệ thống (9 hệ, 6 phản ứng, ~25 trạng thái) mà không dạy dần; thua thì kiệt sức 4 giờ thật. Đề xuất 6 hướng, chủ dự án đồng ý cả 6.

## Quyết định

Mọi số và chữ mới nằm trong **một** file `content/adventure/engagement.json` (schema `content/schemas/adventure/engagement.ts`, Admin "Nội dung game" → "Nhịp chơi & Vết Nứt"); bảng loot `treasure_rift` và khoảng cấp `levels` của từng vùng ở `zones.json`.

### 1. Cảm giác đánh (chỉ trình bày, GĐ14)
- Số bay trên đầu từng đơn vị theo sự kiện của bước trận vừa đi: sát thương, chí mạng (to, vàng), "Hiệu quả!" / "Kém" / "Miễn nhiễm" theo hệ số, trượt, hồi máu, trạng thái mới dính, khiên hút.
- Một băng giữa sân cho khoảnh khắc lớn nhất của bước: **Tuyệt kỹ** (cut-in chân dung + tên), **đổi pha** của trùm, **phản ứng nguyên tố**; chí mạng / phản ứng / Tuyệt kỹ / đổi pha làm rung sân.
- `ui/battleFloaters.ts` (thuần, có test) + `ui/battleFxView.ts` (DOM; hiệu ứng hẹn giờ theo bước, vẽ lại giữa chừng thì chạy tiếp chứ không lặp lại). Giảm chuyển động: chỉ mờ dần. Không đổi logic trận, không đổi save.

### 2. Bớt trận dễ, thêm biến thể
- **Thắng nhanh**: chạm nhóm quái **thường, không biến thể**, khi **cấp trung bình của đội ≥ cấp cao nhất của vùng + `levelsAbove` (1)** và sức đội (máu hiện tại × công tốt hơn) ≥ `powerRatio` (1,5) × sức nhóm → trận được AI của cả hai phe đánh hết ngay (cùng engine, cùng seed). Thắng: nhận `share` (80%) thưởng, máu / MP mất thật. AI thua: trận mở ra cho người chơi như bình thường. Nút "Thắng nhanh: bật/tắt" trên HUD bản đồ (mặc định bật, không lưu).
  - Đo (đội cân bằng, đồ khá): Rừng cấp 11+ ≈ 100% nhóm thường; Núi cấp 17+ ≈ 95%; Tàn Tích cấp 25 ≈ 15%, cấp 30 ≈ 65%. Trong khoảng cấp của vùng: 0%.
- **Biến thể** (`affixes`): mỗi nhóm thường có `affixChance` 20% mang một biến thể, bốc theo seed chuyến (cố định cả chuyến, hiện dải tên vàng trên nhãn nhóm khi đứng gần, tên kẻ địch thành "Rêu Con · Bọc Giáp", viên "Bọc Giáp" ở đầu trận):
  - **Hăng Máu** (Công ×1,15, Tăng công 3 lượt; thưởng ×1,4) · **Bọc Giáp** (Thủ / Thủ phép ×1,35; ×1,4) · **Nhanh Nhẹn** (Tốc ×1,3, Tăng né; ×1,4) · **Ướt Sũng** (Ướt 4 lượt, mời dùng Sấm / Lửa; ×1,2) · **Nhiễm Umbraflux** (máu ×1,25, thẻ `umbraflux` → Thanh Tẩy; ×1,6, 10% 1 Gem) · **Vàng Óng** (hiếm, nhuộm vàng trên bản đồ: máu ×0,6, Thủ ×2, Tăng né; **chạy mất sau 3 vòng** — nhóm biến mất cả chuyến, không thưởng; hạ được: tiền ×5, KN ×2, 50% 1–2 Gems).
- Trạng thái đầu trận: `CombatantInit.statuses` (mới, `systems/combat`; Khiên có `amountPct`). Không đổi save (bốc lại từ seed).

### 3. Endgame: Vết Nứt Umbraflux và trùm Ác Mộng
- Thẻ thứ tư ở Trại, mở sau khi hạ trùm Tàn Tích Cổ. Mỗi chiến binh trả năng lượng như chuyến thường.
- Tầng nối tầng, mỗi tầng một trận, không đi bộ. Kẻ địch thường của cả 3 vùng, chỉ số (máu, công, thủ) × `zoneScale` của vùng (Rừng 3, Núi 1,75, Tàn Tích 1) × (1 + `perFloor` 0,05 × (tầng − 1)). 2 kẻ địch, từ tầng 8 là 3. Giữa hai tầng hồi `restPct` 30% máu / MP. Không bỏ chạy được. Rời lúc nào cũng giữ mọi thứ (tổng kết "Rời Vết Nứt"); thua = như thua chuyến.
- **Luật của ngày** (7 luật, theo ngày game địa phương): Ngày Lửa Bùng, Bão Sấm, Rừng Hồi Sinh, Khiên Ánh Sáng, Gió Lốc, Cuồng Nộ, Hoàng Hôn Vĩnh Cửu. Hiện trên thẻ ở Trại và màn giữa hai tầng.
- **Trùm Ác Mộng**: tầng 10 Cổ Thụ, 20 Rồng Dung Nham, 30 Hộ Pháp, kèm hộ vệ; sức = như tầng × `nightmare` 0,75 (trùm đã mạnh hơn quái thường nhiều), thêm pha dưới 30% máu. Lần đầu hạ: Gems + danh hiệu cho cả đội.
- Thưởng mỗi tầng: tiền 20 × (1 + 0,1 × (tầng − 1)), KN 40 × (cùng hệ số); cứ 5 tầng một rương `treasure_rift`.
- Đo (`npm run sim:rift`, Tự động, 14 ngày / luật): đồ khá cấp 16 → tầng ~7; cấp 20 → ~8; cấp 25 → ~9 (tốt nhất 14); cấp 30 → ~15 (tốt nhất 19). Đồ tốt cấp 30 → ~19 (tốt nhất 21), ~975 Sobi Coin một lượt. Tầng 30 là mục tiêu xa (chơi tay, khẩu phần, thuốc, cộng hưởng).
- Lưu: slice `rift { best, day, dayBest, nightmares[] }`; chuyến `rift { floor, ruleId } | null`; chiến binh `feats.rift`, `feats.nightmares`. Rời Vết Nứt tính là `win` cho `adventure.finished` nhưng không tăng `runsCleared` (số lần hạ trùm).

### 4. Gắn bó với sinh vật
- **Cộng hưởng dòng** (8 cặp): đội có đủ 2 dòng của một cặp → cả đội cộng mod (vd. Nam Hải + Lôi Dương "Sấm Trên Biển": Sấm +15%, Ướt +10). Hiện ở thanh dưới của Trại. Trần như affinity trang bị.
- **Thành tích + danh hiệu**: `feats { battles, bestHit, ultimates, rift, nightmares }`; 14 danh hiệu theo trận thắng, đòn mạnh nhất, Tuyệt kỹ, trùm vùng (`bossClears` có sẵn), tầng Vết Nứt, trùm Ác Mộng. Danh hiệu cao nhất hiện dưới tên ở thẻ chiến binh, banner trận; hồ sơ có lưới danh hiệu (đã có / chưa) và "Kỷ niệm". Nhận danh hiệu mới → toast (nhiều bạn cùng nhận gộp một dòng).
- **Câu nói**: mỗi dòng 2 câu × 5 dịp (thắng, trùm, rương, máu thấp, lên cấp) hiện như toast. Trùm / kẻ canh khu / Vàng Óng / rương / lên cấp / máu dưới 30% luôn nói; thắng thường 30%.

### 5. Dạy dần
- **Mẹo** 6 khu (Rừng 1–3, Chân Núi, Đỉnh Núi, Cổng Tàn Tích): lần đầu vào khu hiện thẻ, bấm "Đã hiểu" thì không hiện lại (`tipsSeen`).
- **Gợi ý sau khi thua** (tối đa 3): thiếu hồi máu, thiếu Hộ Vệ, cấp dưới giữa khoảng của vùng, hệ đội bị phần lớn kẻ địch kháng, Diệt vong mà không có cách giải; Vết Nứt có câu riêng; không có gì thì một câu chung.

### 6. Thua nhẹ hơn
- Kiệt sức sau khi thua: **4 → 1 giờ** (`balance.json` `run.exhaustHours`). Vẫn giữ KN, loot đã nhặt (như cũ).

## Save
World save giữ v11. Slice `areas.sobi_adventure` **v2 → v3** (`logic/migrations.ts`): chiến binh thêm `feats` (0); slice thêm `tipsSeen: []`, `rift { best: 0, day: -1, dayBest: 0, nightmares: [] }`; chuyến đang dở thêm `rift: null` (vẫn là chuyến vùng). Test với slice v2 thật (`tests/fixtures/adventure-slice-v2-real.json`, lấy từ save cấp tối đa) và với một chuyến đang dở.

## Cân bằng (bot `npm run sim:week -- 7 45 adventure`, 2026-10-24)
- Hạ trùm lần đầu: Rừng ngày 15,5 (trước 16,3), Núi 20,8 (21,3), Tàn Tích 27,3 (31,3). Adventure đem về ~103.000 Sobi Coin trong ~31 ngày mở (~3.300 / ngày, trước ~2.800). Phần nhanh hơn chủ yếu vì kiệt sức 1 giờ (36 chuyến thua) và thưởng biến thể; bot chưa dùng Vết Nứt.

## Hệ quả
- `systems/combat`: `CombatantInit.statuses`. Không đổi pipeline.
- Art / âm thanh mới (nền Vết Nứt, icon biến thể, cut-in, SFX): `docs/ASSET_TODO.md`.
- Bot `sim:week` chưa có routine Vết Nứt; `npm run sim:rift` đo riêng.
