# Kịch bản: Xuyên Phép (`skill_cl_pierce`) — lớp Pháp Sư

```json scenario
{
  "id": "skill_cl_pierce", "kind": "skill", "name": "Xuyên Phép", "element": "SELF", "tier": 2, "durationMs": 1000,
  "status": "draft", "refs": [], "bibles": ["actions/cast"],
  "assets": [
    { "id": "fx_hit_burst", "state": "new", "layer": "L3", "spec": "Xem scenarios/ASSETS.md (tô theo hệ, size 0,6)" },
    { "id": "fx_debuff_sink", "state": "new", "layer": "L3", "spec": "Xem scenarios/ASSETS.md" }
  ],
  "engine": []
}
```

## 1. Ý tưởng
**Kim năng lượng mảnh** hình thành trước mặt, **dài dần**; bắn **xuyên qua** mục tiêu và **bay tiếp ra tận mép màn**; hai vòng loang dọc tại điểm xuyên. Cảm giác: sắc, xa, "tssiiing". T2 (power 0,9), 80 % Giảm thủ phép.

## 2. Hiện tại
`beam` + va chạm, 750 ms. Audit: `DURATION_UNDER`.

## 3. Kịch bản theo nhịp
| # | ms | Heo | Hiệu ứng chính | Mục tiêu | Màn hình | Âm thanh |
|---|---|---|---|---|---|---|
| 1 Hình thành | 0–300 | pose `cast`, ngắm | kim năng lượng **dài dần** trước mặt (beam ngắn → dài), rung | — | — | "tsss" |
| 2 Xuyên | 300–450 | giật lùi 10 | kim **phóng xuyên** mục tiêu, đi tiếp ra mép (`through`) | khựng | hit-stop medium 70, rung 3 | "tssiiing" |
| 3 Loang | 450–650 | — | 2 vòng loang **dọc** tại điểm xuyên + va chạm nhỏ | lùi 12 | — | — |
| 4 Dư âm | 650–1000 | idle | vệt kim mảnh dần, tắt; khói xám chảy xuống → `st_mdef_down` | co | — | — |

## 4. Bóc lớp
| Lớp | Thành phần | Asset | Chuyển động | ms |
|---|---|---|---|---|
| L1 | kim năng lượng | beam code | `beam width 3` ngắn 0–300 (cần độ dài tăng: 2 beam nối hoặc `ribbon length` tăng) → `beam through width 5` 300–600 → `width 2` 600–750 | 0–750 |
| L2 | lõi sáng tay | — | `glow $color` 0–300 | 0–300 |
| L3 | vòng loang; va chạm; khói | `fx_hit_burst`, `fx_debuff_sink` | `decal ring` dọc ×2 450, 520; `strip fx_hit_burst` 450; `strip fx_debuff_sink` 650 | 450–1000 |
| L4 | hit-stop | — | `stop medium 70`; `shake 3`; `move knock x 12` | 450–700 |
L1 (beam code) đạt 2/3: biến hình (dài dần, mảnh dần) · vận tốc (xuyên tới mép).

## 5. Asset
`fx_hit_burst`, `fx_debuff_sink` **mới**.

## 6. Các bước dựng
B1 nhịp `{ release 300, impact 450, end 1000 }` · B2 ngắm, giật lùi; mục tiêu khựng, lùi · B3 kim hình thành → xuyên → mảnh dần · B4 vòng, va chạm, khói · B5 hit-stop · B6 âm · B7 capture.

## 7. Nghiệm thu
Audit hết `DURATION_UNDER`; capture: khung ~500 tia **kéo tới mép màn** phía sau mục tiêu.
