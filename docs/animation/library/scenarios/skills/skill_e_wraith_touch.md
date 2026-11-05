# Kịch bản: Chạm Hồn Ma (`skill_e_wraith_touch`) — quái hồn ma

```json scenario
{
  "id": "skill_e_wraith_touch", "kind": "skill", "name": "Chạm Hồn Ma", "element": "DARK", "tier": 2, "durationMs": 1150,
  "status": "draft", "refs": [], "bibles": ["elements/DARK"],
  "assets": [
    { "id": "fxp_ghost_hand", "state": "have", "layer": "L1" },
    { "id": "fx_smoke_curl", "state": "new", "layer": "L1", "spec": "Xem scenarios/ASSETS.md (tô xanh tím nhạt, khói dọc cánh tay)" },
    { "id": "fx_rune_lock", "state": "have", "layer": "L3" },
    { "id": "fxs_puff", "state": "have", "layer": "L3" }
  ],
  "engine": ["prop_displace"]
}
```

## 1. Ý tưởng
Hồn ma **lướt mờ dần**, **bàn tay hồn ma vươn dài** (khói đuổi theo), **chạm nhẹ "boop"** — mục tiêu **rùng mình lạnh gáy**, sương lạnh; tay **rút về**. Cảm giác: rợn nhẹ nhưng dễ thương ("boop"). T2 (power 1,3), 30 % Phong ấn. Tác động đã thêm (medium + rung 3).

## 2. Hiện tại
`fxp_ghost_hand stretch` (ảnh) + phản ứng + khói (đã có dư âm). Audit: `STATIC_HERO`, `STATIC_SHARE`. Capture 2026-11-05: phản ứng và khói đã ổn, tay vẫn là ảnh trượt.

## 3. Kịch bản theo nhịp
| # | ms | Hồn ma | Hiệu ứng chính | Mục tiêu | Màn hình | Âm thanh |
|---|---|---|---|---|---|---|
| 1 Mờ | 0–300 | lướt nhẹ, **mờ dần** 0,6 | — | — | — | "ooOOoo" |
| 2 Vươn | 300–650 | — | bàn tay **vươn dài** (kéo giãn), mép **gợn như khói**, khói đuổi dọc cánh tay | rùng mình trước | — | rít nhẹ |
| 3 Boop | 650 | — | ngón tay **chạm** (nhún nhẹ) | **rùng mình** (shake nhanh), viền xanh tím, sương lạnh | hit-stop medium 80, rung 3 | "boop" |
| 4 Rút | 650–1150 | hiện rõ lại | tay **rút về** (co), khói tan; khóa rune nếu Phong ấn | run | — | run |

## 4. Bóc lớp
| Lớp | Thành phần | Asset | Chuyển động | ms |
|---|---|---|---|---|
| L1 | bàn tay + khói tay | `fxp_ghost_hand`, `fx_smoke_curl` | `prop stretch` + `prop_displace` (mép khói) 300–650 → co ngược 700–1000; `strip fx_smoke_curl` dọc đường tay (2 vị trí) 350–900 | 300–1000 |
| L2 | viền xanh tím mục tiêu | — | `glow #9a8aff` 650 | 650–950 |
| L3 | sương lạnh; khóa rune; khói | `fxs_puff`, `fx_rune_lock` | `burst puff_spray tint #9a8aff` 650; `strip fx_rune_lock` 750 (khi gắn); `burst dark_smoke` 850 (đã có) | 650–1150 |
| L4 | hit-stop (có); rùng mình | — | giữ `stop medium`, `shake 3`; `move shake n 8` target | 650–1050 |
L1 đạt 3/3 (khi có displacement): biến hình (gợn khói, co / giãn) · phụ sinh (khói tay) · vận tốc (vươn, rút).

## 5. Asset
`fx_smoke_curl` **mới**; còn lại có.

## 6. Các bước dựng
B1 nhịp (giữ) · B2 mờ / hiện; mục tiêu rùng mình · B3 tay vươn → rút + khói · B4 sương, rune · B5 giữ tác động · B6 âm · B7 capture.

## 7. Nghiệm thu
Audit hết `STATIC_HERO` (khi có displacement / khói tay); capture: tay **dài hơn** ở khung 600 so với 350.
