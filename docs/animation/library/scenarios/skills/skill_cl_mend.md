# Kịch bản: Hồi Phục (`skill_cl_mend`) — lớp Hỗ Trợ

```json scenario
{
  "id": "skill_cl_mend", "kind": "skill", "name": "Hồi Phục", "element": "SUPPORT", "tier": 0, "durationMs": 1050,
  "status": "draft", "refs": [], "bibles": ["actions/buff-and-heal"],
  "assets": [
    { "id": "fx_heal_bloom", "state": "new", "layer": "L1", "spec": "Xem scenarios/ASSETS.md" },
    { "id": "fxs_plus", "state": "have", "layer": "L3" },
    { "id": "fxs_leaf", "state": "have", "layer": "L3" }
  ],
  "engine": []
}
```

## 1. Ý tưởng
**Chắp hai chân trước**, **giọt sáng xanh** hiện trên đầu, **bay vồng** tới bạn (nhấp nhô, kéo giãn nhẹ), chạm **nở thành vòng lá non** + dấu cộng lớn. Cảm giác: dịu, chăm sóc. Hồi 30 %, T0. Skill hồi máu cơ bản — nhiều heo có.

## 2. Hiện tại
`fx_bloom` 4 khung + cộng. Audit: không cờ, nhưng không có giọt bay.

## 3. Kịch bản theo nhịp
| # | ms | Heo / bạn | Hiệu ứng chính | Âm thanh |
|---|---|---|---|---|
| 1 Chắp | 0–300 | pose `cast`, chắp tay | **giọt sáng xanh** phồng trên đầu (pop) | ngân |
| 2 Bay | 300–620 | — | giọt **bay vồng** tới bạn, nhấp nhô, vệt hạt xanh | "plink" |
| 3 Nở | 620 | bạn nhún, sáng xanh | **vòng hồi nở** ở chân + 1 dấu cộng lớn bay lên + 6 nhỏ | chuông êm |
| 4 Dư âm | 620–1050 | idle | lá non bay lên chậm | — |

## 4. Bóc lớp
| Lớp | Thành phần | Asset | Chuyển động | ms |
|---|---|---|---|---|
| L1 | giọt; vòng hồi | `fxs_plus` (to, tô `#7ee08a`, làm "giọt"), `fx_heal_bloom` | `prop pop` 0–300 → `prop throw` arc 50 + `bobY` + `stretch` 300–620; `strip fx_heal_bloom` 620 | 0–950 |
| L2 | — | — | — | — |
| L3 | vệt; dấu cộng; lá | `fxs_plus`, `fxs_leaf` | `trail plus_trail every 70`; `burst plus_rise` 620; `burst leaf_rise` 700 | 300–1050 |
| L4 | bạn nhún | — | `move hop y 8` 620 (không rung) | 620–850 |
L1 đạt 3/3: biến hình (vòng hồi khung) · phụ sinh (vệt, lá) · vận tốc (vồng, kéo giãn).

## 5. Asset
`fx_heal_bloom` **mới**; dự phòng `fx_bloom`.

## 6. Các bước dựng
B1 nhịp (giữ) · B2 chắp tay; bạn nhún · B3 giọt → vòng hồi · B4 vệt, cộng, lá · B5 không rung · B6 âm · B7 capture.

## 7. Nghiệm thu
Capture: khung ~450 giọt **giữa đường**; khung ~700 vòng hồi ở chân bạn.
