# Bible hành động: TUYỆT KỸ (ultimate)

12 ultimate. Review vòng 4: ~74 / mục tiêu 90; MUST-HAVE đều có (intro, ≥ 3 lớp, môi trường, rung + hit-stop mạnh hơn, outro, kịch bản riêng + tên chiêu — D-2). Audit P0: **12/12 hình chủ đạo tĩnh**, **11/12 thiếu lớp L2** (lõi sáng / vệt: chỉ `skill_ult_phoenix` có). Khoảng cách tới 90 nằm ở **C3 (sống động)** và **C5 (tác động, chờ playtest)**.

## 1. Cấu trúc 7 pha (đủ cả 7)
| Pha | ms (x1) | Nội dung | Act |
|---|---|---|---|
| Intro | 0–600 | màn tối dần, letterbox, cut-in tên chiêu | `tint`, `letterbox on`, `cutin`, `vignette` |
| Preparation | 600–1100 | người dùng gồng lớn, **lõi năng lượng** sáng dần trên thân (L2) | `pose cast`, `move cast_coil`, `glow` tăng |
| Startup | 1100–1600 | **triệu hồi hình thành** (không hiện nguyên): dâng / ghép / mở / mọc | `prop rise/grow` + hạt hút vào, flipbook / shader |
| Execution + Travel | 1600–2200 | vật lớn hành động, môi trường đổi (mưa, nứt, bão) | `prop`, `ribbon`, `beam`, `burst` môi trường |
| Impact | 2200–2600 | **nhiều nhịp**, lệch nhịp theo mục tiêu, nhịp cuối mạnh nhất (stop ultimate 220) | `stop`, `punch`, `flash` ≤ 0,5, `shake` 7–12 |
| Aftermath | 2600–3300 | vật tan / vỡ, môi trường lắng, vết lớn trên sân | `decal`, `burst …_fall` |
| Outro | 3300–3800 | màn sáng lại mượt, letterbox rút | `letterbox off`, `tint` về 0 |
Ultimate bỏ qua được (rubric). Ở x2 giữ cấu trúc, nén Intro / Aftermath nhiều nhất.

## 2. Bốn việc cụ thể để lên ≥ 90
1. **L2 cho 11 cái còn thiếu**: `glow` lõi trên actor trong Prep + `trail` / `marker` dưới vật triệu hồi. Sửa dữ liệu, chi phí S.
2. **Hình chủ đạo sống**: vật triệu hồi (cả 12, bảng §3) hình thành dần + chuyển động phụ + biến dạng — cách làm theo bible từng hệ; hướng shader / flipbook chọn ở P2.
3. **Khoảng lặng trước nhịp cuối** (60–120 ms gần như im) → nhịp cuối nặng hơn mà không tăng rung.
4. **Môi trường đổi theo hệ** rõ hơn (mưa giọt Nước, tro bay Lửa, lá cuốn Thiên nhiên, đá rơi Đất…).

## 3. Bảng
| Ultimate | Hệ | Hình chủ đạo | Bible |
|---|---|---|---|
| `skill_ult_trident` | Nước | `fxp_trident` | [WATER](../elements/WATER.md) |
| `skill_ult_hg`, `skill_ult_phoenix` | Lửa | `fxp_forge_anvil`, `fxp_phoenix` | [FIRE](../elements/FIRE.md) |
| `skill_ult_tg` | Kim | `fxp_bronze_knight` | [METAL](../elements/METAL.md) |
| `skill_ult_ld` | Sấm | `fxp_horn_sigil` | [LIGHTNING](../elements/LIGHTNING.md) |
| `skill_ult_dm` | Bóng tối | `fxp_octo_tentacle` | [DARK](../elements/DARK.md) |
| `skill_ult_hk`, `skill_ult_mythical` | Hư Không | `fxp_sky_bell`, `fxp_spirit_circle` | [VOID](../elements/VOID.md) |
| `skill_ult_nh` Tiếng Hát Đại Dương | hỗ trợ (power 0) | `fxp_whale` | [buff-and-heal](buff-and-heal.md) + WATER |
| `skill_ult_qs` Núi Thiêng Trỗi Dậy | hỗ trợ | `fxp_turtle_mountain` (thêm `NO_PREPARATION`) | buff-and-heal + EARTH |
| `skill_ult_mm` Rừng Mẹ Ôm Ấp | hỗ trợ | `fxp_mother_tree` | buff-and-heal + NATURE |
| `skill_ult_qt` Lồng Đèn Trung Thu | hỗ trợ | `fxp_moon_lantern` | buff-and-heal + LIGHT |
4 ultimate hỗ trợ giữ hit-stop (D-1) nhưng hình theo ngôn ngữ buff: hướng lên, bao quanh, ấm.

## 4. Cấm
Tái dùng khung của ultimate khác (`DUPLICATE_SCRIPT`); chớp mạnh > 2 lần/giây; tối màn kéo dài sau outro; vật triệu hồi hiện ra nguyên vẹn trong 1 khung.
