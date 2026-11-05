# Kịch bản: Phun Mực (`skill_dm_ink`)

```json scenario
{
  "id": "skill_dm_ink", "kind": "skill", "name": "Phun Mực", "element": "DARK", "tier": 2, "durationMs": 1100,
  "status": "draft", "refs": [], "bibles": ["elements/DARK", "actions/projectile"],
  "assets": [
    { "id": "fxs_ink_blob", "state": "have", "layer": "L1" },
    { "id": "fx_ink_bloom", "state": "new", "layer": "L1", "spec": "Xem scenarios/ASSETS.md" },
    { "id": "fx_ink_splat", "state": "have", "layer": "L3" }
  ],
  "engine": []
}
```

## 1. Ý tưởng
Bạch tuộc **phồng túi mực**, phun một **quả mực bay lượn chữ S**, tóe **ngay mặt** mục tiêu; nó **cuống quít lau mắt**. Cảm giác: tinh nghịch, nhớt, "splat!". T2, 70 % Giảm chính xác.

## 2. Hiện tại
`fxs_ink_blob throw` (một sprite 64² bay vồng), `fx_ink_splat` 4 khung. Audit: `STATIC_HERO`. Đạn nhỏ, bay vồng như mọi đạn khác — không ra chất "mực nhớt lượn".

## 3. Kịch bản theo nhịp
| # | ms | Bạch tuộc | Hiệu ứng chính | Mục tiêu | Màn hình | Âm thanh |
|---|---|---|---|---|---|---|
| 1 Phồng | 0–260 | pose `cast`, túi mực phồng 1,1, mắt nheo | mực rỉ quanh miệng | — | — | "mmph" |
| 2 Phun | 260–320 | giật lùi, xẹp túi | quả mực to 2× rời miệng, **méo dẹt** theo hướng | — | — | "pfft" |
| 3 Lượn | 320–620 | lò xo về | bay **đường chữ S**, giọt mực nhỏ rơi theo, quả mực co giãn không đều | — | — | — |
| 4 Tóe | 620 | — | mực **loang ra rồi co lại** trên mặt (`fx_ink_bloom`) | lắc đầu lau mặt (wiggle) | hit-stop light 50, rung 3 | "splat!" |
| 5 Dư âm | 620–1100 | idle | 3 giọt mực chảy xuống mặt, khói tím nhỏ; `st_acc_down` | chớp mắt liên tục | — | "ugh" dễ thương |

## 4. Bóc lớp
| Lớp | Thành phần | Asset | Chuyển động | ms |
|---|---|---|---|---|
| L1 | quả mực bay; mực loang trên mặt | `fxs_ink_blob` size 0,5, `fx_ink_bloom` | `prop throw` arc 30 + `wobble rot 25 freq 3` (chữ S) + `stretch` + `pulse amp 0.15 freq 4` (nhớt) 320–620; `strip fx_ink_bloom spot head` 620 | 320–900 |
| L2 | vệt mực sau quả mực | — | `trail` tím `#7a4ed0` | 320–620 |
| L3 | giọt rơi theo; giọt chảy xuống mặt; khói | `fx_ink_splat` (nhỏ), hạt `ink_*` | `prop … trail ink_trail every 60`; `burst ink_fall spot head` 700; `burst dark_smoke` 820 | 260–1100 |
| L4 | hit-stop, rung; lau mặt | — | `stop light`; `shake 3`; `move wiggle` | 620–1000 |
L1 đạt 3/3: biến hình (loang–co 6 khung; pulse nhớt) · phụ sinh (giọt rơi) · vận tốc (méo theo hướng, lượn).

## 5. Asset
`fx_ink_bloom` **mới**; `fxs_ink_blob`, `fx_ink_splat` có (dự phòng: `fx_ink_splat` tại `head`).

## 6. Các bước dựng
B1 nhịp (giữ `{ 260, 620, 1100 }`) · B2 phồng / xẹp túi mực; mục tiêu lau mặt · B3 quả mực lượn → loang · B4 giọt, khói · B5 hit-stop light · B6 âm · B7 capture.

## 7. Nghiệm thu
Audit hết `STATIC_HERO`; capture: hai khung bay thấy quả mực **lệch ngang khác phía** (chữ S); khung `impact+80` mực ở **đầu**, không ở chân.
