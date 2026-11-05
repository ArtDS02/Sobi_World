# Kịch bản: Địa Chấn Cổ (`skill_qs_quake`)

```json scenario
{
  "id": "skill_qs_quake", "kind": "skill", "name": "Địa Chấn Cổ", "element": "EARTH", "tier": 2, "durationMs": 1550,
  "status": "draft", "refs": [], "bibles": ["elements/EARTH"],
  "assets": [
    { "id": "fx_crack_spread", "state": "new", "layer": "L1", "spec": "Xem scenarios/ASSETS.md (tô nâu, từ chân rùa chạy sang phe địch)" },
    { "id": "fx_stone_rise", "state": "new", "layer": "L1", "spec": "Xem scenarios/ASSETS.md" },
    { "id": "fx_rock_burst", "state": "new", "layer": "L3", "spec": "Xem scenarios/ASSETS.md" },
    { "id": "fx_dust_ring", "state": "new", "layer": "L3", "spec": "Xem scenarios/ASSETS.md" },
    { "id": "fx_rock_spike", "state": "have", "layer": "L1" },
    { "id": "fxs_pebble", "state": "have", "layer": "L3" }
  ],
  "engine": []
}
```

## 1. Ý tưởng
Rùa **nhấc hai chân trước lên cao, giữ**, rồi **dậm**: **vết nứt chạy** từ chân sang phe địch, **gai đá trồi** dưới từng quái lệch nhịp, hất chúng lên. Cảm giác: chấn động lan, có hướng. T2 diện rộng (power 1,0), 25 % Choáng.

## 2. Hiện tại
`cast_stomp`, rung 6 (đã hạ từ 13), `fx_rock_spike` 4 khung dưới quái, nứt bằng `decal`. Audit: không cờ, nhưng vết nứt là decal tĩnh hiện sẵn, không "chạy".

## 3. Kịch bản theo nhịp
| # | ms | Rùa | Hiệu ứng chính | Quái | Màn hình | Âm thanh |
|---|---|---|---|---|---|---|
| 1 Nhấc | 0–420 | nhấc 2 chân trước (rot −10°), **giữ 140** | bụi nhỏ rơi khỏi chân | — | — | gồng |
| 2 Dậm | 420 | dậm xuống, bẹp 0,9 | bụi vòng quanh chân | — | rung 6 dọc | "BOOM" |
| 3 Nứt chạy | 420–600 | — | **vết nứt lan** từ chân sang phe địch | — | — | ầm chạy |
| 4 Gai | 600–1000 | — | gai đá trồi dưới từng quái, lệch 130 | bị hất 40 px | hit-stop light 60 con đầu; rung 4 → 2 theo nhịp | "krak" ×n |
| 5 Dư âm | 1000–1550 | idle | gai **vỡ vụn**, bụi lắng, nứt mờ; Choáng `st_stun` | rơi, ngồi phịch | — | sỏi lăn |

## 4. Bóc lớp
| Lớp | Thành phần | Asset | Chuyển động | ms |
|---|---|---|---|---|
| L1 | nứt chạy; gai trồi | `fx_crack_spread`, `fx_stone_rise` (thay `fx_rock_spike`) | `strip fx_crack_spread under` 420–600 (dải từ actor tới foeside); `strip fx_stone_rise` per target stagger 130 | 420–1100 |
| L2 | khe nứt sáng | — | trong asset (K5) | 600 |
| L3 | bụi vòng ở chân rùa; sỏi; gai vỡ | `fx_dust_ring`, `fxs_pebble`, `fx_rock_burst` | `strip fx_dust_ring under` 420; `burst pebble_spray` per target; `strip fx_rock_burst size 0.7` per target 1000+ | 420–1550 |
| L4 | rung giảm dần; quái bị hất | — | `shake 6 dir [0,1]` 420 → 4 → 2; `stop light` 600; `move lift y 40` stagger 130 | 420–1300 |
L1 đạt 2/3: biến hình (nứt lan + gai trồi khung) · vận tốc / hướng (nứt chạy theo hướng). Phụ sinh qua bụi / sỏi.

## 5. Asset
`fx_crack_spread`, `fx_stone_rise`, `fx_rock_burst`, `fx_dust_ring` **mới**; `fx_rock_spike`, `fxs_pebble` có (dự phòng giữ như hiện tại).

## 6. Các bước dựng
B1 nhịp `{ release 420, impact 600, end 1550 }` · B2 nhấc-giữ-dậm; quái hất lệch nhịp · B3 nứt chạy → gai · B4 bụi, sỏi, gai vỡ · B5 rung giảm dần, hit-stop light · B6 âm · B7 capture.

## 7. Nghiệm thu
Capture: khung ~500 vết nứt **mới đi được nửa đường**; ba quái bị hất ở ba khung khác nhau; khung ~1200 gai đã vỡ. Audit không `IMPACT_OVER_TIER`.
