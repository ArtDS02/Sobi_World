# Kịch bản: Lửa Rèn (`skill_hg_forge_fire`)

```json scenario
{
  "id": "skill_hg_forge_fire", "kind": "skill", "name": "Lửa Rèn", "element": "SUPPORT", "tier": 0, "durationMs": 1350,
  "status": "draft", "refs": [], "bibles": ["actions/buff-and-heal", "elements/FIRE"],
  "assets": [
    { "id": "fxp_forge_anvil", "state": "have", "layer": "L1" },
    { "id": "fxp_fire_hammer", "state": "have", "layer": "L1" },
    { "id": "fx_flame_loop", "state": "new", "layer": "L2", "spec": "Xem scenarios/ASSETS.md (phủ lên đe, nhỏ)" },
    { "id": "fx_buff_rise", "state": "new", "layer": "L1", "spec": "Xem scenarios/ASSETS.md (tô đỏ cam)" },
    { "id": "fxs_spark", "state": "have", "layer": "L3" },
    { "id": "fxs_puff", "state": "have", "layer": "L3" }
  ],
  "engine": []
}
```

## 1. Ý tưởng
**Đe lò rèn rơi** trước mặt cua; cua cầm búa nhỏ **nện ba nhát** (clang-clang-CLANG), mỗi nhát **quạt tia lửa** và đe **đỏ thêm**; nhát ba **càng bừng sáng** — sức mạnh dâng lên. Cảm giác: rèn luyện, nhịp đều tăng dần. Công + Công phép, T0.

## 2. Hiện tại
Đe `fall` (tĩnh 1,25 s), búa `hover`, 3 lần spark + chớp. Audit: `STATIC_HERO`, `STATIC_SHARE` (rung đã hạ còn 2). Búa không vung, đe không nóng dần.

## 3. Kịch bản theo nhịp
| # | ms | Cua | Hiệu ứng chính | Màn hình | Âm thanh |
|---|---|---|---|---|---|
| 1 Đe rơi | 0–300 | lùi nửa bước | đe rơi có bóng báo, **lún nảy** | rung 2 | "THUNK" |
| 2 Nện ×3 | 300 / 520 / 740 | **giơ búa (chậm) – nện (nhanh)** mỗi nhịp | búa **vung theo cung** (xoay −60° → +20°); mỗi nhát: tia lửa **quạt** hình nón, đe đỏ thêm 1 bậc, lửa nhỏ trên đe lớn dần | chớp cam 0,08 | clang – clang – CLANG |
| 3 Bừng | 950 | **phồng lên** (puff 1,1), càng sáng đỏ | **cột sáng đỏ cam vút lên** từ chân | — | "fwoom" |
| 4 Dư âm | 950–1350 | idle, càng còn hồng | đe **chìm** vào đất, khói | — | lò thở |

## 4. Bóc lớp
| Lớp | Thành phần | Asset | Chuyển động | ms |
|---|---|---|---|---|
| L1 | đe; búa; cột buff | `fxp_forge_anvil`, `fxp_fire_hammer`, `fx_buff_rise` | đe `fall` + `shadow` + `squashOnHit` 0–300, chìm (`rise` ngược) 1000–1300; búa `hover` + `wobble rot 40 freq 4.5` (vung nhịp) 300–950; `strip fx_buff_rise` 950 | 0–1300 |
| L2 | lửa trên đe lớn dần; càng sáng | `fx_flame_loop` | `strip fx_flame_loop` size 0,2 → 0,35 → 0,5 sau mỗi nhát; `glow #ff7a2a` 950–1250 | 300–1100 |
| L3 | tia lửa quạt; khói | `fxs_spark`, `fxs_puff` | `burst spark_spray` ×3 (nhát 3 `more 2`); `burst puff_rise` 1000 | 300–1350 |
| L4 | nhịp nện; phồng | — | `move squash 0.95` mỗi nhát; `move puff_up 1.1` 950; chớp ≤ 0,08 (T0) | 300–1100 |
L1 đạt 3/3: biến hình (lửa đe lớn dần, cột buff khung) · phụ sinh (tia lửa từ đe) · vận tốc (búa vung, đe lún).

## 5. Asset
`fx_flame_loop`, `fx_buff_rise` **mới**; dự phòng `fx_flame_burst` nhỏ, `burst buff_arrows`.

## 6. Các bước dựng
B1 nhịp (giữ) · B2 vung / nện / phồng · B3 đe → búa → cột buff → chìm · B4 tia lửa, khói · B5 rung ≤ 2 · B6 âm 3 nhát tăng dần · B7 capture.

## 7. Nghiệm thu
Audit hết `STATIC_HERO`; capture: 3 khung nhát nện, lửa trên đe **lớn dần**; búa ở góc khác nhau giữa khung giơ và khung nện.
