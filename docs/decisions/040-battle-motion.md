# 040 — Animation trận Adventure: bộ máy beat + VFX dự phòng bằng CSS (GĐ14; phần CSS đã thay bằng canvas ở decision 041)

**Bối cảnh.** Chủ dự án giao prompt `art_inbox/.batch/Sobi_Adventure_UI_Animation_Claude_Prompt.md`: audit Adventure, chụp toàn bộ màn hình, thiết kế pipeline animation cho chiến binh / quái / kỹ năng, viết prompt AI, rồi làm **một vertical slice** an toàn. Trước đó trận chỉ có số bay + rung (decision 039) và một cú lắc trên ảnh của đơn vị mất máu; mọi lượt địch trong một bước hiện cùng lúc.

**Quyết định.**
1. **Trận vẫn là DOM** (`battleView.ts`), animation chạy bằng CSS keyframes, không thêm thư viện. Lý do: trận đã là DOM, ảnh chiến binh là ảnh tĩnh (heo, cá, 22 quái), Phaser chỉ vẽ bản đồ. Tween + VFX tách lớp cho chất lượng tốt mà không cần hàng trăm khung hình.
2. **Bộ máy beat thuần** (`ui/battleMotion.ts`): một bước trận (lượt ta + mọi lượt địch theo sau) được cắt thành beat theo sự kiện `turn`; mỗi beat có tư thế (attack / cast / support / ultimate / guard / stunned), cách đến mục tiêu (melee / slam / projectile / burst / aura), hệ, mốc `release` / `impact` / `end`. Mọi sự kiện có thời điểm phát; số bay, banner, rung, phản ứng trúng đòn rơi đúng `impact`. Tổng một bước ≤ `STEP_MAX_MS` = 3,2 giây (×0,55 khi x2), bước dài bị nén.
3. **Một bảng dữ liệu** (`ui/motionProfiles.ts`): body plan (quadruped, aquatic, flyer, floater, sprout, heavy) cho đồng minh theo id (`sobi_aquarium:` → bơi) và cho 22 quái; mốc thời gian theo delivery; hình CSS + màu của 9 hệ (khác hình, không chỉ khác màu); kỹ năng có chuyển động riêng (`SKILL_MOTION`).
4. **Art tuỳ chọn qua manifest:** VFX dùng ảnh `fx_<skillId>_<phase>` rồi `fx_adv_<element>_<phase>` nếu manifest có; thiếu thì vẽ hình CSS. Thêm art không cần sửa code.
5. **Animation không bao giờ quyết định gameplay:** chỉ đọc sự kiện trận; không khoá input. Auto chờ bước đang chiếu xong (`stepRemaining()`, tối đa 3,2 giây) để đọc được từng đòn — chỉ đổi nhịp trình bày, không đổi kết quả.
6. **Giảm chuyển động:** `prefers-reduced-motion` và cài đặt `reduceMotion` tắt hết; đơn vị gục hiện gục ngay, VFX ẩn.
7. **Vertical slice:** Cu Ủn (heo, dòng Mộc Mẫu, hệ Thiên nhiên) + kỹ năng `skill_mm_poison_thorn` "Gai Độc": tụ lực → gai bay → va chạm → Trúng độc → hồi tư thế. Ảnh bằng chứng: `art_inbox/sobi_adventure_reference/09_motion_slice/`.

**Không làm (chờ duyệt / bước sau):** sprite sheet thật cho chiến binh / quái (cần art từ Gemini theo `docs/animation/prompts/`), overlay Umbraflux động, chuyển cảnh thắng / thua, hiện đòn kết thúc trận trước khi về bản đồ, âm thanh theo beat.

**File:** `src/areas/adventure/ui/{battleMotion,battleMotionView,motionProfiles,battleFxView,battleFloaters,battleView,adventureUi}.ts`, `src/styles/features/_adventureMotion.scss`, `tests/unit/battleMotion.test.ts`, `scripts/capture/adventureShots.ts`, `docs/animation/`. Bỏ `ui/battleFx.ts` (so máu giữa hai lần vẽ) vì phản ứng trúng đòn nay lấy từ sự kiện.
