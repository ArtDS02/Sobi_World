# Kịch bản: Sóng Vỗ Về (`skill_nh_soothe`)

```json scenario
{
  "id": "skill_nh_soothe", "kind": "skill", "name": "Sóng Vỗ Về", "element": "SUPPORT", "tier": 0, "durationMs": 1050,
  "status": "draft", "refs": [], "bibles": ["actions/buff-and-heal", "elements/WATER"],
  "assets": [
    { "id": "fxp_heart_drop", "state": "have", "layer": "L1" },
    { "id": "fxs_note", "state": "have", "layer": "L3" },
    { "id": "fxs_drop", "state": "have", "layer": "L3" },
    { "id": "fxs_star", "state": "have", "layer": "L3" },
    { "id": "fx_bubble_pop", "state": "new", "layer": "L1", "spec": "Xem skill_nh_bubble (dùng chung). Ở skill này phát K3–K6 khi giọt tim chạm đầu, tô xanh ngọc nhạt." }
  ],
  "engine": ["prop_displace"]
}
```

## 1. Ý tưởng
Người dùng **hát**, một **giọt nước hình tim** hiện trên đầu đồng đội, **rơi chao như lá** rồi chạm đầu thành gợn sóng êm. Cảm giác: dịu, mát, an ủi. Hồi 30 % máu. T0: không rung, không khựng.
Nguồn: thiết kế gốc; bible [buff-and-heal](../../bibles/actions/buff-and-heal.md) (hồi máu: lên mềm, xanh lá) kết hợp màu nước.

## 2. Hiện tại
`fxp_heart_drop path: fall` (rơi thẳng một ảnh) + 2 vết + hạt. Audit: `STATIC_HERO`, `STATIC_SHARE`. Giọt rơi không chao, chạm không thành gợn, đồng đội không có phản ứng cơ thể rõ.

## 3. Kịch bản theo nhịp
| # | ms | Người dùng | Hiệu ứng chính | Đồng đội | Màn hình | Âm thanh |
|---|---|---|---|---|---|---|
| 1 Hát | 0–320 | pose `cast`, nhắm mắt lắc lư (`cast_bow`) | 3 nốt nhạc bay lên | — | — | ngân 2 nốt |
| 2 Hiện | 320–420 | giữ | giọt tim **hình thành** trên đầu đồng đội cao 120 px: phồng 0 → 1,1 → 1,0, gợn nhẹ (displacement) | ngước lên | — | "plink" |
| 3 Rơi | 420–700 | idle | rơi **chao trái-phải** (xoay ±12°, lệch ngang ±10 px), giọt nhỏ rơi theo | — | — | — |
| 4 Chạm | 700 | — | `fx_bubble_pop` K3–K6 tô xanh ngọc tại đầu; 2 vòng gợn trên đất dưới chân | nhún (`hop`), số hồi máu | — | chuông nước |
| 5 Dư âm | 700–1050 | — | 4 sao trắng nhỏ như ngọc trai bay lên chậm; gợn tan | mỉm cười nhún thêm 1 lần | — | ngân tắt |

## 4. Bóc lớp
| Lớp | Thành phần | Asset | Chuyển động | ms |
|---|---|---|---|---|
| L0 | — | — | — | — |
| L1 | giọt tim | `fxp_heart_drop`, `fx_bubble_pop` | `prop pop` 320–420 (outBack) → `prop fall` 420–700 với `wobble rot 12 freq 2.5` + `bobY` ngang; `prop_displace` nhẹ khi còn lơ lửng; vỡ `strip fx_bubble_pop frames [2,5]` 700 | 320–850 |
| L2 | lõi sáng trên người hát | — | `glow #7ee08a` 0–320 | 0–320 |
| L3 | nốt nhạc, giọt theo, vòng gợn, sao ngọc | `fxs_note`, `fxs_drop`, `fxs_star` | `burst note_rise` 0; `trail drop_trail every 90` khi rơi; `decal ring` ×2 (700, 760); `burst star_rise` 760 | 0–1050 |
| L4 | đồng đội phản ứng | — | `move hop` 760, `move puff_up 1.04` 900 | 700–1050 |
L1 đạt 3/3: biến hình (hình thành + vỡ khung + gợn) · phụ sinh (giọt rơi theo) · vận tốc/đường (chao).

## 5. Asset
| Asset | Lớp | Trạng thái |
|---|---|---|
| `fxp_heart_drop` | L1 | có |
| `fx_bubble_pop` | L1 | **mới** (dùng chung, đặc tả ở `skill_nh_bubble`) |
| `fxs_note`, `fxs_drop`, `fxs_star` | L3 | có |
Dự phòng: chưa có `fx_bubble_pop` → `burst drop_pop` + `decal ring`. Chưa có `prop_displace` → bỏ gợn, giữ chao + trail (2/3).

## 6. Các bước dựng
1. B1 nhịp `{ release 320, impact 700, end 1050 }`. 2. B2 thân: hát lắc lư, đồng đội nhún. 3. B3 L1: hình thành → rơi chao → vỡ. 4. B4 L3. 5. B5: không hit-stop / rung (T0). 6. B6 âm. 7. B7 capture.

## 7. Nghiệm thu
- `anim:audit`: không `STATIC_HERO` (khi có `fx_bubble_pop` hoặc displacement), không `IMPACT_OVER_TIER`.
- Capture: hai khung trong pha rơi cho thấy giọt **lệch ngang khác nhau** (chao); khung 700–760 thấy gợn tròn ở chân; không rung màn.
