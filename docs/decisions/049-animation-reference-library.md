# 049 — Thư viện tham chiếu Animation & VFX (Sobi Adventure)

**Ngày:** 2026-11-05 · **Trạng thái:** đã quyết (chủ dự án giao agent tự quyết "miễn là tốt cho game", 2026-11-05).
**Bối cảnh:** nghiên cứu Animation & VFX Reference (chủ dự án yêu cầu, tham chiếu nguyên lý của Epic Battle Fantasy 3). Bước P0 (`npm run anim:audit`, cờ `STATIC_SHAPE`, `docs/animation-review/audit/`) cho thấy vấn đề chung là **hình chủ đạo là ảnh tĩnh chỉ được tween**: 64/112 skill, Nước 5/6. Engine kịch bản (decision 044) và vòng review (rubric v1.1) đã có; còn thiếu chuẩn mô tả "tốt trông thế nào" cho từng hệ / loại hành động, và một hợp đồng chung giữa Designer → Artist → Developer.

## Quyết định
1. **Vị trí:** `docs/animation/library/` (README, STANDARDS, `bibles/`, `refs/`, `briefs/`). Thư viện là **tài liệu + dữ liệu mô tả**; thứ chạy trong game vẫn chỉ là `content/adventure/battle_fx.json` (decision 044). Không có hệ thống song song.
2. **Phân loại:** theo **9 hệ của game** (METAL, NATURE, WATER, FIRE, EARTH, LIGHTNING, DARK, LIGHT, VOID) + **motif** làm thẻ phụ (ice, steam, wind, poison, heal, shield…). Không đổi bộ hệ (đổi hệ là gameplay, ngoài phạm vi).
3. **Bản ghi tham chiếu (REF)** là JSON có schema (`scripts/anim-review/lib/library.ts`), kiểm bằng test `tests/scripts/animLibrary.test.ts`: tên act đúng engine, skill / status / action được trỏ tới có thật, nguồn có loại bản quyền.
4. **Bản quyền (cùng decision 048):** nguồn chia 3 loại — `R` chỉ nghiên cứu (EBF3, video, sách: chỉ mô tả bằng lời + số + sơ đồ tự vẽ, **không** lưu ảnh của bên thứ ba vào repo, không dùng làm hint ảnh cho Gemini), `F` dùng được (license thương mại rõ, ghi `docs/THIRD_PARTY.md`), `L` cần phép. Không rõ license = `R`.
5. **Không quay EBF3 ở giai đoạn này.** Thư viện dựa trên nguyên lý animation, tài liệu chuyên môn và frame của chính game (harness). Con số timing là đề xuất, chỉnh qua playtest. Có thể bổ sung đo từ footage sau nếu cần.
6. **Shader displacement (Phaser FX)** được thử ở pilot hệ Nước (P2) **song song** với flipbook nhiều khung, cho cùng một skill (`skill_nh_tsunami`); chọn bằng so sánh trước / sau + playtest. Điều kiện: tắt khi "Giảm chuyển động", giữ FPS, có dự phòng khi không có WebGL. Kết quả ghi bổ sung vào decision này.
7. **Rubric:** `STATIC_HERO` / `STATIC_SHAPE` giữ là **cờ gợi ý** tới khi pilot P2 chứng minh sửa được; sau đó thành MUST-HAVE cho skill **mới hoặc làm lại** (không đánh trượt hàng loạt skill cũ cùng lúc).
8. **Thứ tự ưu tiên tài liệu** khi mâu thuẫn: spec > decisions > ARCHITECTURE > `animation_style_guide.md` / `asset/GAME_ART_DIRECTION.md` > thư viện. Bible chỉ **mở rộng** style guide, không đè.

## Lý do
- Một chỗ duy nhất cho palette / hình / nhịp / vật lý của từng hệ, đọc được bởi người và agent, kiểm được bằng test.
- Brief viết bằng đúng từ vựng `do:` của engine → Developer chuyển gần 1:1, không diễn giải lại.
- Không chặn bởi việc chủ dự án quay video; vẫn mở đường đo footage sau.

## Lộ trình
P1 (đợt này): khung thư viện, STANDARDS, schema + test, bible Nước + motif Băng + 2 bible hành động (phóng đạn, cận chiến & bị đánh), REF Nước đầu tiên. Tiếp: các bible còn lại → P2 pilot Nước → P3 nhân rộng theo `anim:audit` → P4 nhân vật & môi trường.

## Bổ sung 2026-11-05 — Kịch bản animation cho từng đơn vị
Chủ dự án: "tất cả animation vẫn quá kém… nên có một bộ tài liệu mô tả kịch bản cho từng skill, từng animation, dựa vào đó dựng các bước, lớp layer rồi mới tạo asset". Quyết định:
- Mỗi skill / trạng thái / hành động chung / phản ứng có một file `docs/animation/library/scenarios/<loại>/<id>.md` (thay cho `briefs/` dự kiến trước). Thứ tự bắt buộc: **kịch bản → duyệt → asset theo đặc tả → dựng theo bước → capture**.
- Khuôn 7 mục cố định (ý tưởng, hiện tại, kịch bản theo nhịp, bóc lớp, asset, các bước dựng, nghiệm thu) + đầu JSON (`status`, asset `have/new/edit` có đặc tả, khả năng engine còn thiếu). Kiểm bằng `scripts/anim-review/lib/scenario.ts` + `tests/scripts/animScenario.test.ts`; `anim:audit` có cột "kịch bản".
- Kịch bản kế thừa ý tưởng của bản thiết kế gốc của chủ dự án (`art_inbox/.batch/adventure-12-animation/all_animation_sobi_adventure_final.md`) và bổ sung phần bản đó thiếu: bóc lớp, đặc tả asset từng khung, bước dựng.
- Khả năng engine còn thiếu đặt tên cố định (`prop_displace`, `prop_flipbook`, `strip_scale_xy`, `bg_scene`, `action_by_body`) để gom thành việc engine riêng.
- Đợt thử: 9 skill hệ Nước + đánh thường; asset mới cần: `fx_wave_rise`, `fx_bubble_pop`, `fx_water_column`, `fx_ice_grow`, `fx_hit_burst` (`docs/ASSET_TODO.md`).
- 2026-11-05: đủ 169 kịch bản (112 skill, 26 hành động, 25 trạng thái, 6 phản ứng); danh mục asset mới `scenarios/ASSETS.md`; test bắt buộc nội dung mới phải có kịch bản.
