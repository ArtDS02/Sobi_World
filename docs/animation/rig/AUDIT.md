# Animation Audit Report — Sobi World (2026-11-05, decision 050)

Audit hệ thống animation thực tế trên nhánh `phase-14-art` (sau `f37424b`), đối chiếu với `art_inbox/.batch/adventure-12-animation/all_animation_sobi_adventure_final.md` (bản thiết kế 112 skill + hành động + trạng thái), `docs/lore/Lore_Sobi_World.md`, decision 040 / 042 / 044 / 049 và code đang chạy. Đọc cùng: `ARCHITECTURE.md` (đề xuất), `ASSET_REUSE.md` (phân loại asset), `ACCEPTANCE.md`.

> Ký hiệu: **[QS]** = quan sát trực tiếp (code, file, ảnh chụp từ game / Xưởng animation trong phiên này); **[GT]** = giả thuyết, chưa có bằng chứng.

## 1. Kết luận chính

1. **Vấn đề gốc là đơn vị nhỏ nhất của nhân vật: một ảnh phẳng.** [QS] Mỗi chiến binh / quái là 1 ảnh (`cb_<art>_<pose>`, 6 key pose 512² — `public/assets/props/combat/`, 43 con × 6 = 258 ảnh). Không có đầu, chân, tai, đuôi, mắt, miệng tách riêng. Mọi chuyển động trong trận vì vậy chỉ có thể là **biến đổi cả ảnh**: `dx/dy/rot/sx/sy/bright/opacity` (`ui/battlePose.ts`, 296 dòng) + đổi ảnh pose. Không tham số hay công thức nào sửa được điều này — đó là trần của phương pháp, không phải lỗi chỉnh số.
2. **Đổi key pose = nhảy hình, không phải chuyển động.** [QS] 6 pose của cùng con vẽ riêng bằng AI: tỉ lệ, góc nhìn, vị trí mai rùa / vây khác nhau giữa các pose (vd. `cb_pig_turtle_cast` mai rùa dời ra sau lưng, đứng 2 chân; `idle` đứng 4 chân). Chuyển `idle → cast` là một cú pop; tween che bằng squash / chớp sáng.
3. **Kỹ năng có cá tính ở lớp VFX, không ở lớp thân.** [QS] Engine kịch bản (decision 044, `battle_fx.json`, 169 kịch bản) đã giàu: prop, strip, beam, hit-stop, cut-in, stagger… Nhưng mọi act tác động lên **thân** chỉ là `move` (dash / hop / spin / shake… = tween cả ảnh) và `pose` (đổi ảnh). Hệ quả đúng như chủ dự án mô tả: "ảnh tĩnh được di chuyển bằng code", VFX phải gánh cả biểu cảm.
4. **Một công thức thân cho mọi loài.** [QS] `motionProfiles.ts → BODY` có 6 body plan nhưng chỉ khác biên độ bob / breathe / lunge; cast dùng `CAST_TRACKS` theo body plan (cùng 5 kênh tween). Heo rừng và rùa khác nhau đúng ở vài hệ số.
5. **Chuyển trạng thái không có blend.** [QS] Posture đổi tức thì theo mốc beat (`posture = t >= b.cast ...`). Không có crossfade, không có overlap (tai/đuôi trễ), không có follow-through thật — chỉ `settle()` của tween toàn thân.
6. **Phần đã tốt và nên giữ** [QS]: bộ máy beat thuần có test (`battleMotion.ts`, `battlePlan.ts`: mốc `cast / release / impact / end`, nén bước, x2), engine kịch bản VFX theo dữ liệu (`battle_fx.json` + schema + Admin "Xưởng animation trận"), hit-stop / slow-mo / camera, hạt GPU, harness review (`anim:audit`, `anim:capture`, rubric), quy ước hướng quay, "giảm chuyển động", animation không bao giờ quyết định gameplay.

## 2. Audit từng mảng

### A. Character animation
| Trạng thái | Hiện tại [QS] | Nguyên nhân gốc |
|---|---|---|
| Idle | sin bob / breathe cả ảnh (`BODY.bob/breathe`) + `idleLife` (lệch trọng tâm, giật nhẹ 4–7 s) | Không có bộ phận để thở (ngực), chớp mắt, vẫy đuôi; mọi con cùng nhịp sin |
| Walk / run / jump / fall | Không có trong trận; bản đồ khám phá: nhân vật trượt | Ảnh phẳng không có chân để bước |
| Battle entry | nhấp nháy opacity + sáng (`p.enter`) | — |
| Basic attack | coil–dash–squash–về (tween) + ảnh `attack` | Pose ảnh đổi tức thì; thân không có anticipation thật (chỉ lùi cả ảnh) |
| Skill cast | `CAST_TRACKS` theo body plan + ảnh `cast` + glow | Cùng một đường cong cho mọi skill của một body plan |
| Guard | squash nhẹ | Rùa không thể rụt vào mai vì mai không tách |
| Hit / heavy / knockback | 3 bậc (`hit`, `hit-heavy`, `hit-crit`) đẩy + xoay + chớp + ảnh `hurt` | Đầu không giật ngược, tai không văng; mức "nặng" chỉ là biên độ |
| Heal / buff / debuff | nhún + glow màu | Không có tư thế ưỡn ngực / co rúm |
| KO | xoay + xám + mờ + ảnh `ko` | Chân không gập, không ngã theo trọng lượng |
| Victory | ảnh `victory` + kịch bản `actions.victory` | Một ảnh tĩnh nhún |
| Đặc biệt (stun, freeze, low HP) | lắc / đứng yên / thở nhanh (tween) | — |

### B. Skill animation & VFX
- Chuẩn bị / tích tụ / giải phóng / projectile / impact / dư âm: **có đủ lớp VFX** (kịch bản 7 mục, `scenarios/`), đo được bằng harness. [QS]
- Phản ứng mục tiêu: chỉ tween cả ảnh (`hit`), cùng một kiểu cho mọi con. [QS]
- Ultimate: cut-in + VFX; thân người dùng vẫn là ảnh `cast`. [QS]
- 64/112 skill cờ `STATIC_HERO`/`STATIC_SHAPE` (decision 049) — hình chủ đạo là ảnh tĩnh; pilot sóng thần đã chứng minh flipbook + ripple giải được phần VFX. [QS]
- **Kết luận B:** lớp VFX đang đi đúng hướng (giữ nguyên engine 044 + pilot 049). Thứ thiếu là lớp **Character Animation** để ba lớp (thân – VFX – phản ứng) phối hợp thay vì VFX gánh tất cả.

### C. Animation architecture
| Mục | Hiện tại [QS] | Đánh giá |
|---|---|---|
| State | posture suy từ beat mỗi khung (`battlePose.ts`), không có state machine | Không có transition / ưu tiên / blend |
| Bộ phận | không có | Gốc rễ |
| Frame / sheet / keyframe | key pose 6 ảnh; VFX: strip ngang `fx_*` (`frames`), `CAST_TRACKS` keyframe 5 kênh trong code | Keyframe nằm trong code, không ở dữ liệu |
| Kết hợp code | tween thủ tục viết tay theo delivery | Khó cá nhân hoá từng loài |
| Tái sử dụng | VFX: tốt (hệ, motif, `$color`); thân: chỉ body plan | — |
| VFX / camera | tốt (decision 042 / 044) | Giữ |
| Hiệu năng | 1 ảnh + 2 bản sao / con; hạt ≤ 420 | Rig mới: ~20–25 ảnh / con, vẫn nhẹ (xem ARCHITECTURE §6) |
| Phạm vi | chỉ Adventure (`areas/adventure/scene/battle`) | Không dùng lại được cho Farm / Garden / Aquarium / Cloud |

### D. Asset inventory (tóm tắt — chi tiết `ASSET_REUSE.md`)
- Có animation thật: VFX strip `fx_*` (22 + `fx_wave_rise`), hạt `fxs_*` (24), ngủ / thức của heo Farm (2 ảnh). [QS]
- Ảnh tĩnh: mọi sinh vật (heo Farm 89, cá Aquarium, quái 22, key pose trận 258), `fxp_*` (48 vật thể). [QS]
- Có thể dùng tạo chuyển động thật: không ảnh sinh vật nào tách được bộ phận mà không vẽ lại phần bị che (đầu che thân, chân che nhau). [QS — xem `cb_pig_boar_idle`, `cb_pig_turtle_idle`: ảnh phẳng một lớp, phần thân nằm sau đầu / chân xa nằm sau chân gần không tồn tại trong ảnh, nên tách ra là thủng.]
- Thiếu: layer bộ phận, mặt (mắt / miệng) tách, góc nhìn nhất quán giữa các pose.

## 3. Đối chiếu tài liệu
- `all_animation_sobi_adventure_final.md`: mô tả rất nhiều chuyển động **thân** ("heo ngửa cổ", "rụt vào mai", "vẫy đuôi") mà engine ảnh phẳng không làm được → các kịch bản 049 đã phải đẩy sang VFX hoặc ghi "cần art". Rig mới mở lại được phần đó (bản đồ ở `ARCHITECTURE.md` §8).
- `Lore_Sobi_World.md`: Lumina = **Growth** (sự sống tự do, mỗi cá thể khác nhau); Umbra = **Possession** ("một ý chí duy nhất", Umbraflux "ghi đè ý chí của vật chủ", "mắt bắt đầu thay đổi"). Đây là nguyên tắc chuyển động có cơ sở lore: bạn đồng hành chuyển động hữu cơ, lệch nhịp nhau; quái bị tha hoá chuyển động như bị giật dây (đồng bộ, khựng, trễ sai chỗ), mắt đổi. Rig có sẵn chỗ cho việc này (lớp `possessed`, `ROADMAP.md` R4).

## 4. Nghiên cứu game tham chiếu (giới hạn)
Phiên này **không** quay / xem lại footage của Ủn ỉn, Khu vườn trên mây, Nông trại vui vẻ, Epic Battle Fantasy 3 (decision 049 §5 giữ nguyên: không lưu ảnh bên thứ ba). Những gì dưới đây là nhận xét chung về thể loại, cần kiểm lại bằng footage trước khi dùng làm số liệu:
- [GT] Các game Flash thời đó phần lớn dùng **cutout / symbol animation** (nhân vật gồm nhiều symbol lồng nhau, tween trên timeline) cho nhân vật, **frame-by-frame** cho hiệu ứng và vài khoảnh khắc biểu cảm. Đây là lý do nhân vật đơn giản vẫn "sống": đầu, tai, đuôi chuyển động lệch nhau.
- [GT] EBF3: nhân vật chibi tỉ lệ đầu lớn, chuyển động có **anticipation rõ, squash & stretch mạnh, hold khung ở va chạm**, đổi biểu cảm mặt theo hành động; hiệu ứng nhiều lớp, mỗi kỹ năng có hình riêng. (Nguyên lý — không phải cấu trúc kỹ thuật.)
- [GT] Ủn ỉn / Nông trại vui vẻ / Khu vườn trên mây: con vật idle có hành vi nhỏ lặp không đều (cúi ăn, ngoáy đuôi, chớp mắt), chuyển động biên độ nhỏ, nhịp chậm, cozy.
- Nguyên tắc áp dụng (không phụ thuộc giả thuyết kỹ thuật): (1) tách bộ phận để có **overlap**; (2) mặt là kênh biểu cảm rẻ nhất và mạnh nhất; (3) idle cần **hành vi**, không chỉ sin; (4) anticipation + hold ở va chạm đọc rõ hơn tốc độ; (5) mỗi loài một nhịp (tempo) và một trọng lượng.

## 5. Phần giữ / bỏ
| Giữ | Bỏ / thay |
|---|---|
| Beat engine + mốc thời gian (`battleMotion`, `battlePlan`) | Tween cả ảnh làm **chuyển động chính** của thân (giữ làm lực đẩy toàn thân: dash, knock-back, nhảy — đã giảm theo `feel.root`) |
| Engine kịch bản VFX (`battle_fx.json`, decision 044), pilot 049 | Key pose 6 ảnh làm **nguồn animation** (giữ làm portrait cut-in, thẻ, dự phòng khi chưa có rig) |
| Harness review, rubric, kịch bản 7 mục | `CAST_TRACKS` / `BODY` làm nơi cá nhân hoá loài (chuyển sang clip của rig) |
| Hướng quay, giảm chuyển động, không quyết định gameplay | — |
