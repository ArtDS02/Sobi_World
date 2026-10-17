# 037 — Sobi Adventure V2: Combat V2 (9 nguyên tố Ngũ hành, class, Skill Tree, Rage) và bản đồ khám phá

**Ngày:** 2026-10-17 · **Trạng thái:** Chủ dự án đã duyệt hướng; spec chi tiết `docs/update_spec_sobi_adventure_gameplay_v1.md` (A0). Code từ A1.

## Bối cảnh
Adventure GĐ10–11 (decision 018, 019) chạy được nhưng combat mỏng: 4 nguyên tố, năng lượng dùng chung, 8 kiểu đánh cố định, đi qua chuỗi điểm dừng bằng nút. Chủ dự án viết master prompt `docs/UPDATE_SPEC_SOBI_ADVENTURE.md` (Combat V2). File `SOBI_ADVENTURE_GAMEPLAY_SPEC.md` mà master prompt nhắc tới chưa từng tồn tại, nên spec mới được viết thành `update_spec_sobi_adventure_gameplay_v1.md` (cùng kiểu với spec Garden / Aquarium / Cloud). Các Area khác đã làm lại gameplay trong GĐ14 theo cùng cách (decision 023–035).

## Quyết định
1. **Mở băng có giới hạn** cho Adventure (decision 021): được đổi combat, progression, bản đồ, slice save Adventure. Các Area khác giữ băng như cũ.
2. **Combat V2** theo master prompt: EXP / SP / MP / Rage tách bạch; 4 class (Tanker, Physical DPS, Mage, Support); Class Skill Tree 3 tầng 8 node có nhánh và prerequisite; loadout 3 ô; Rage theo % HP mất, giữ qua trận, Ultimate 1 lần / trận; khung trạng thái data-driven; 6 phản ứng nguyên tố tách khỏi ma trận; trang bị có affinity và trần; pipeline 18 bước là định nghĩa duy nhất.
3. **9 nguyên tố, ma trận theo Ngũ hành tương khắc** (Kim → Mộc → Thổ → Thủy → Hỏa → Kim) + Sấm (khắc Nước, Kim; Đất kháng) + Ánh sáng ↔ Bóng tối + Void trung tính hoàn toàn. Gió → Sấm.
4. **Unique Skill và Ultimate theo 9 dòng First Guardian**; loài Hiếm trở lên được thay riêng. Không viết 4 skill cho từng giống.
5. **Class mặc định theo dòng / họ**, đổi được ở Đền Huấn Luyện (hoàn SP); tẩy điểm lần đầu miễn phí.
6. **Độ hiếm nén lại**: hệ số 1,00 → 1,20 (cũ 1,00 → 1,80) để giữ "độ hiếm ≠ thắng chắc".
7. **Hiện ý định của kẻ địch, thanh thứ tự lượt, nhãn hiệu quả** khi chọn mục tiêu.
8. **Bản đồ khám phá kiểu Epic Battle Fantasy 3** thay chuỗi điểm dừng: mỗi vùng 3 khu; **So / Bi dẫn đầu, 3 sinh vật theo sau**; **chỉ di chuyển bằng phím mũi tên / WASD** (không bấm chuột tìm đường); Space tương tác; quái đứng sẵn, chạm mới đánh, không đuổi; **rương báu ẩn mở 1 lần mỗi save, luôn có đường tới (test)**; **va chạm theo lưới ô, footprint phủ đúng đế của vật (test so với sprite)**; cổng nguyên tố chỉ chặn lối phụ; **cổng dịch chuyển mỗi khu, mở khi hạ trùm khu đó** (khu lối vào mở sẵn).
9. Nhân vật So / Bi quay lại **chỉ ở Adventure** (decision 025 chỉ bỏ ở Sảnh); dùng lại `systems/character` và ảnh `chr_so` / `chr_bi` có sẵn.
10. **Đi nhanh** cho vùng đã hạ trùm, **3 đội hình lưu sẵn**.
11. Điều kiện mở Adventure: **Phát triển thế giới 16** (thay 20; chốt việc còn treo của decision 021).
12. 30 loài hậu duệ mới, Sobi Essence / Đài Phong Ấn: **để sau**.

## Save
World save giữ **v11**. Slice `areas.sobi_adventure` v1 → **v2** có migration: giữ cấp / EXP / trang bị / năng lượng; SP truy lĩnh `2 × (cấp − 1)`; class / dòng mặc định; chuyến dở đóng an toàn và hoàn năng lượng; vùng đã hạ trùm → mọi cổng dịch chuyển của vùng đó hoạt động; `WIND` → `LIGHTNING`. Test với save thật (`tests/unit/saveVersions.test.ts`).

## Hệ quả
- `systems/combat` viết lại (giữ nguyên tắc thuần, seed theo hành động); `archetypes.json` bị thay bằng `classes.json` + `lineages.json`; thêm `elements.json`, `statuses.json`, `reactions.json`, `props.json`, `maps/*.json`.
- Cân bằng của decision 018 / 019 phải đo lại; test "balance guard" cũ thay bằng bộ mới.
- Admin thêm trình sửa bản đồ, xem Skill Tree; mô phỏng trận cập nhật.
- Art mới (GĐ14): nền 9 khu, đạo cụ có footprint, icon 9 hệ / trạng thái / ý định, VFX, cut-in Ultimate (`docs/ASSET_TODO.md`).
- `GAME_BALANCE.md` §9 (nguyên tố Lửa > Gió > Đất > Nước, "đòn thường + 2 skill") hết hiệu lực; spec mới thắng.
