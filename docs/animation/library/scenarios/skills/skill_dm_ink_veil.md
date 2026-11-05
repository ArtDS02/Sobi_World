# Kịch bản: Màn Mực (`skill_dm_ink_veil`)

```json scenario
{
  "id": "skill_dm_ink_veil", "kind": "skill", "name": "Màn Mực", "element": "SUPPORT", "tier": 0, "durationMs": 1300,
  "status": "draft", "refs": [], "bibles": ["actions/buff-and-heal", "elements/DARK"],
  "assets": [
    { "id": "fx_smoke_curl", "state": "new", "layer": "L1", "spec": "Xem scenarios/ASSETS.md (tô tím đậm #3a2470, alpha 0,8)" },
    { "id": "fx_poof", "state": "have", "layer": "L1" },
    { "id": "fxs_star", "state": "have", "layer": "L3" },
    { "id": "fxs_ink_blob", "state": "have", "layer": "L3" }
  ],
  "engine": []
}
```

## 1. Ý tưởng
Mực phun lên thành **màn đêm như chiếc ô** che ngang trên phe ta (có sao nhỏ như trời đêm); khi màn tan, mỗi bạn **tách thành 2 bóng mờ** lệch hai bên rồi nhập lại — "khó bắt". Né tránh tăng, T0.

## 2. Hiện tại
`fx_poof` trên từng bạn + sao + `trail` + rung thân. Audit: `DURATION_OVER` (1420). Không có "mái ô", bóng mờ chỉ là trail ngắn.

## 3. Kịch bản theo nhịp
| # | ms | Bạch tuộc / đội | Hiệu ứng chính | Màn hình | Âm thanh |
|---|---|---|---|---|---|
| 1 Xoay | 0–320 | pose `cast`, xoay xúc tu tròn trên đầu | mực tụ thành vòng xoáy trên đầu | nền tối 10 % | "swish" |
| 2 Phủ | 320–700 | — | mực phun **vòng cung** lên, bung thành mái khói tím **cuộn liên tục** phủ ngang trên phe ta, 8 sao nhỏ lấp lánh trong mái | — | "fwoosh" |
| 3 Tan + bóng | 700–1050 | mỗi bạn **tách 2 bóng tím** lệch ±18 px rồi nhập lại (stagger 100) | mái tan từ giữa ra hai bên | — | "shimmer" |
| 4 Dư âm | 1050–1300 | idle | vài giọt mực nhỏ rơi; `st_eva_up` | nền về | — |

## 4. Bóc lớp
| Lớp | Thành phần | Asset | Chuyển động | ms |
|---|---|---|---|---|
| L0 | tối nền | — | `tint #100818 0.1` | 0–1300 |
| L1 | mái khói | `fx_smoke_curl` ×4 nối ngang (vòng lặp), `fx_poof` lúc bung | `strip fx_poof` ×4 nối 320 → `strip fx_smoke_curl` loop (`hold`) 400–900, alpha giảm 900–1050 | 320–1050 |
| L2 | bóng mờ tách đôi | — | `trail every 60` + `move walk_sideways x ±18` stagger 100 (hoặc `afterimage`) | 700–1050 |
| L3 | sao trong mái; giọt mực rơi | `fxs_star`, `fxs_ink_blob` | `burst star_pop` thưa trong mái; `burst ink_fall` 1050 | 400–1300 |
| L4 | — (T0) | — | — | — |
L1 đạt 2/3: biến hình (khói cuộn loop) · phụ sinh (sao, giọt mực).

## 5. Asset
`fx_smoke_curl` **mới** (dự phòng: `fx_poof` hold khung cuối).

## 6. Các bước dựng
B1 nhịp `{ release 320, impact 700, end 1300 }` (rút từ 1350) · B2 xoay xúc tu; bóng tách · B3 mái khói · B4 sao, giọt · B5 không rung · B6 âm · B7 capture.

## 7. Nghiệm thu
Audit hết `DURATION_OVER`; capture: khung ~600 thấy **mái liền** ngang trên đội; khung ~850 mỗi bạn có bóng lệch hai bên.
