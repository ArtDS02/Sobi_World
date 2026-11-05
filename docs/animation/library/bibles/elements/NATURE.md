# Bible hệ THIÊN NHIÊN (NATURE)

Khuôn như [WATER](WATER.md). Màu: `elements.NATURE` (`color #5cc24e`, `glow #d6ffa8`); nét `vines`, `spark leaf_pop`, `boom fx_bloom`, rung 3. Motif liên quan: [poison](../motifs/poison.md).

## 1. Tính cách
Thiên nhiên **sống, đàn hồi, mọc**. Đọc khi bỏ màu: đường cong chữ S, **mọc từ đất** rồi bật lò xo, lá rơi **lả tả ngang** (dao động trái-phải), không nổ mạnh.

## 2. Vật lý & chuyển động
| Yếu tố | Quy tắc | Act |
|---|---|---|
| Hình thành | nảy mầm → mọc nhanh → overshoot → lò xo | `prop grow/rise` ease `spring` / `outBack`, `burst leaf_rise` |
| Đường đi | lượn, xoáy nhẹ; gai bay thẳng có xoay | `prop throw` arc 60, `spin` |
| Va chạm | quấn / cắm / bung cánh hoa — **không** chớp mạnh | `strip fx_vine_grab`, `strip fx_bloom`, `burst leaf_spray` |
| Dư âm | lá / cánh hoa rơi dao động ngang 600–1000 ms | `burst leaf_fall`, `burst petal_fall` |
| Mục tiêu | bị trói: thân giật từng nhịp; bị gai: giật nhẹ | `move shake`, `move wiggle` |

## 3. Nhịp mẫu
Gai bay T2: chuẩn bị 250 · mầm gai mọc 150 · bay 300 · cắm 60 + hit-stop light/medium · lá rơi 700. Rễ trói T1: rễ trồi từ đất **từng đoạn** 3 nhịp × 120 → siết (`stop light`) → rung giữ 400.

## 4. Hình chủ đạo sống
Dây leo / rễ phải **mọc dần theo đường** (chiều dài tăng), không hiện nguyên cây: `ribbon` / `tether` có `wave` (đã có engine) hoặc `strip fx_vine_grab` chia `frames` theo nấc. Hoa lớn (`fxp_flower_big`, `fxp_mother_tree`): nở = scale + xoay cánh lệch pha, lá rơi trong lúc nở.

## 5. Asset hiện có
Flipbook `fx_vine_grab` [4], `fx_bloom` [4]. Vật: `fxp_mother_tree`, `fxp_flower_big`, `fxp_corrupt_flower`; sprite `fxs_leaf`, `fxs_petal`, `fxs_spore`, `fxs_thorn`. Hạt: `nature_*`, `leaf_*`, `petal_*`, `spore_*`, `thorn_*`. Môi trường: `fx_env_leaves` [18], `fx_env_petals` [27].
**Thiếu:** flipbook dây leo mọc 6–8 khung; flipbook hoa nở 6 khung.

## 6. Hiện trạng (audit)
Hệ có ưu tiên **thấp nhất** (4,6): ít ảnh tĩnh nhất. Việc chính: dư âm (4/7 thiếu) và tác động lệch bậc.
| Skill | Bậc | Cờ | Hướng |
|---|---|---|---|
| `skill_e_thorn_storm` | T2/**T4** | STATIC_HERO, IMPACT_OVER_TIER, DURATION_OVER | hạ rung / chớp về T2; gai nhiều cỡ bay lệch nhịp; rút ngắn |
| `skill_e_corrupt_bloom` | T1/T0 | STATIC_HERO, NO_AFTERMATH | hoa nở có cánh rơi; khói độc nhẹ (motif poison) |
| `skill_e_vine_lash` | T2/T2 | NO_AFTERMATH, DURATION_UNDER | dây quất có vệt + lá văng; kéo dài 200 ms |
| `skill_mm_binding_roots`, `skill_e_poison_spore` | T1 | NO_AFTERMATH | lá / bào tử rơi sau va chạm |
| `skill_mm_poison_thorn` | T2/T2 | SHARED_FLIPBOOK_HERO (`fx_pow_star`) | va chạm bằng `$spark` của hệ thay sao chung |
| `skill_e_root_quake` | T2/T3 | — | giữ |
Phản ứng `reaction_wildfire` (với Lửa): lá cháy cuộn lại thành tàn bay lên.

## 7. Cấm
Thiên nhiên nổ chớp trắng; lá rơi thẳng đứng (thiếu dao động); dây leo hiện ra nguyên vẹn trong 1 khung; màu xanh độc (`#7be08a` của poison) lẫn với xanh lá thường — độc phải có thêm tím / bọt (motif poison).
