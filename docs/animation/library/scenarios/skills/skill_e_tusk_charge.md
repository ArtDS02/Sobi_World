# Kịch bản: Húc Nanh (`skill_e_tusk_charge`) — quái Heo Rừng Gai

```json scenario
{
  "id": "skill_e_tusk_charge", "kind": "skill", "name": "Húc Nanh", "element": "EARTH", "tier": 3, "durationMs": 1300,
  "status": "draft", "refs": [], "bibles": ["elements/EARTH", "actions/melee-and-hit"],
  "assets": [
    { "id": "fx_hit_burst", "state": "new", "layer": "L1", "spec": "Xem scenarios/ASSETS.md (tô nâu)" },
    { "id": "fx_dust_ring", "state": "new", "layer": "L3", "spec": "Xem scenarios/ASSETS.md" },
    { "id": "fxs_puff", "state": "have", "layer": "L3" },
    { "id": "fxs_pebble", "state": "have", "layer": "L3" }
  ],
  "engine": []
}
```

## 1. Ý tưởng
Heo rừng **cào đất ba lần, phì phò khói mũi**, rồi **lao như tàu hỏa** (bụi cuộn sau), **húc** — mục tiêu **lộn nhào**; heo rừng **phanh trượt** để lại vết cày. Cảm giác: hùng hục, nặng. T3 (power 1,6), 25 % Choáng.

## 2. Hiện tại
`fx_pow_star` + `fx_boom` chung, rung 9, 1150 ms. Audit: `FEW_LAYERS`, `DURATION_UNDER`, `SHARED_FLIPBOOK_HERO` (dư âm đã thêm).

## 3. Kịch bản theo nhịp
| # | ms | Heo rừng | Hiệu ứng chính | Mục tiêu | Màn hình | Âm thanh |
|---|---|---|---|---|---|---|
| 1 Cào | 0–420 | **cào đất ×3**, cúi đầu, khói mũi ×2 | bụi sau chân mỗi lần cào | giật mình | — | phì phò |
| 2 Lao | 420–700 | lao thẳng **tăng tốc**, kéo giãn, nhấp nhô vó | **bụi nâu cuộn** sau, sỏi bắn | — | rung 1 liên tục | vó dồn |
| 3 Húc | 700 | dừng phắt | va chạm nâu + bụi vòng | **lộn 1 vòng** bay 40 | hit-stop medium 100, punch 1,04, rung 6 | "BAM!" |
| 4 Phanh | 700–1300 | **phanh trượt** quá đà, vết cày dưới chân | bụi lắng; `st_stun` | rơi, sao xoay | — | trượt |

## 4. Bóc lớp
| Lớp | Thành phần | Asset | Chuyển động | ms |
|---|---|---|---|---|
| L1 | va chạm | `fx_hit_burst` (nâu) | `strip` 700 | 700–900 |
| L2 | vệt lao | — | `trail #c08a50` | 420–700 |
| L3 | bụi cào; khói mũi; bụi cuộn; sỏi; bụi vòng; vết cày | `fxs_puff`, `fxs_pebble`, `fx_dust_ring` | `burst puff_pop` ×3 (0, 140, 280) + `puff_spray` mũi; `burst puff_trail` lặp 420–700; `burst pebble_spray` 500; `strip fx_dust_ring under` 700; `decal crack` 750–1300 | 0–1300 |
| L4 | hit-stop, punch; lộn | — | `stop medium 100`; `punch 1.04`; `shake 6` (từ 9); `move lift y 40` + `spin` target | 700–1100 |
Thân heo rừng (cào → lao kéo giãn → phanh trượt) là hình chủ đạo + va chạm 6 khung.

## 5. Asset
`fx_hit_burst`, `fx_dust_ring` **mới**.

## 6. Các bước dựng
B1 nhịp `{ release 420, impact 700, end 1300 }` · B2 cào ×3, lao, phanh; mục tiêu lộn · B3 va chạm · B4 bụi, sỏi, vết cày · B5 hit-stop 100 + punch (rung 9 → 6) · B6 âm · B7 capture.

## 7. Nghiệm thu
Audit hết 3 cờ; capture: 3 khung cào có bụi ở **vị trí khác nhau**; khung ~1000 vết cày dưới chân.
