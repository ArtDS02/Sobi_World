# Kịch bản: Rễ Rung Chuyển (`skill_e_root_quake`) — quái Cổ Thụ

```json scenario
{
  "id": "skill_e_root_quake", "kind": "skill", "name": "Rễ Rung Chuyển", "element": "NATURE", "tier": 2, "durationMs": 1450,
  "status": "draft", "refs": [], "bibles": ["elements/NATURE", "elements/EARTH"],
  "assets": [
    { "id": "fx_stone_rise", "state": "new", "layer": "L1", "spec": "Xem scenarios/ASSETS.md (tô nâu đất, ụ đất phồng — chỉ K1–K3)" },
    { "id": "fx_vine_grow", "state": "new", "layer": "L1", "spec": "Xem scenarios/ASSETS.md (rễ trồi đứng, size 0,5)" },
    { "id": "fx_dust_ring", "state": "new", "layer": "L3", "spec": "Xem scenarios/ASSETS.md" },
    { "id": "fxs_leaf", "state": "have", "layer": "L3" }
  ],
  "engine": []
}
```

## 1. Ý tưởng
Cây cổ thụ **cắm rễ**, **lá rung**; dưới chân từng con phe ta **đất phồng thành ụ** rồi **rễ trồi** đội chúng lên lần lượt. Cảm giác: mặt đất sống dậy, "grrrumble → bump". T2 diện rộng, 40 % Chậm.

## 2. Hiện tại
`fx_rock_spike` dưới mục tiêu, rung 6. Audit: không cờ (bậc T3 hơi cao).

## 3. Kịch bản theo nhịp
| # | ms | Cây | Hiệu ứng chính | Phe ta | Màn hình | Âm thanh |
|---|---|---|---|---|---|---|
| 1 Cắm rễ | 0–420 | hạ thấp, **lá rung** (lắc) | lá rơi vài chiếc | — | rung 1 | "grrrumble" |
| 2 Ụ đất | 420–700 | — | đất **phồng ụ** dưới từng con (stagger 130) | chao đảo | — | ùng ục |
| 3 Rễ trồi | 550–1000 | — | **rễ trồi** từ ụ, đội lên | **nảy 25** lần lượt | hit-stop light 50 con đầu, rung 3 | "bump" ×n |
| 4 Dư âm | 1000–1450 | idle | rễ chui xuống, bụi lắng, lá rơi; `st_spd_down` | — | — | — |

## 4. Bóc lớp
| Lớp | Thành phần | Asset | Chuyển động | ms |
|---|---|---|---|---|
| L1 | ụ đất; rễ | `fx_stone_rise` K1–K3 (nâu), `fx_vine_grow` | `strip frames [0,2]` per target stagger 130; `strip fx_vine_grow frames [0,5] size 0.5` per target +130 | 420–1100 |
| L3 | lá rơi; bụi | `fxs_leaf`, `fx_dust_ring` | `burst leaf_fall` actor 100; `strip fx_dust_ring` per target; `burst leaf_fall` 1100 | 100–1450 |
| L4 | rung nhẹ; nảy | — | `shake 1` 0–420; `stop light`; `shake 3` (từ 6); `move hop y 25` stagger 130 | 0–1100 |
L1 đạt 2/3: biến hình (ụ phồng, rễ mọc khung) · phụ sinh (bụi, lá).

## 5. Asset
`fx_stone_rise`, `fx_vine_grow`, `fx_dust_ring` **mới**; dự phòng `fx_rock_spike frames [0,1]` + `fx_vine_grab`.

## 6. Các bước dựng
B1 nhịp `{ release 420, impact 550, end 1450 }` · B2 cây hạ / lá rung; phe ta chao, nảy · B3 ụ → rễ · B4 lá, bụi · B5 rung 3 (T2) · B6 âm · B7 capture.

## 7. Nghiệm thu
Audit bậc có T2; capture: ụ đất ở khung trước khi rễ trồi.
