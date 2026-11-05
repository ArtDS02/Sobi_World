# Kịch bản: Xé Giáp (`skill_cl_rend`) — lớp Chiến Binh

```json scenario
{
  "id": "skill_cl_rend", "kind": "skill", "name": "Xé Giáp", "element": "SELF", "tier": 2, "durationMs": 1150,
  "status": "draft", "refs": [], "bibles": ["actions/melee-and-hit"],
  "assets": [
    { "id": "fx_claw", "state": "have", "layer": "L1" },
    { "id": "fxs_metal_bit", "state": "have", "layer": "L3" },
    { "id": "fx_debuff_sink", "state": "new", "layer": "L3", "spec": "Xem scenarios/ASSETS.md" }
  ],
  "engine": []
}
```

## 1. Ý tưởng
Móng / vũ khí **sáng theo hệ**, lao tới, **hai vết vuốt chéo chữ X** (dài rồi ngắn) xé toạc giáp, mảnh giáp bắn. Cảm giác: sắc, nhanh, "shk-SHK!". T2 (power 1,1), 80 % Giảm thủ.

## 2. Hiện tại
`fx_claw` 4 khung + mảnh + hit-stop 80. Audit: không cờ (dư âm đã thêm). Chỉ một vết vuốt, chưa có chữ X.

## 3. Kịch bản theo nhịp
| # | ms | Heo | Hiệu ứng chính | Mục tiêu | Màn hình | Âm thanh |
|---|---|---|---|---|---|---|
| 1 Sáng | 0–260 | pose `attack`, móng sáng theo hệ | lóe ở móng | — | — | "shhh" |
| 2 Lao | 260–420 | dash, kéo giãn | — | — | — | vút |
| 3 Vuốt 1 | 420 | vung chéo xuống phải | vết vuốt **dài** chéo | giật | hit-stop light 50 | "shk" |
| 4 Vuốt 2 | 520 | vung chéo ngược | vết **ngắn** chéo ngược → **chữ X**; mảnh giáp bắn | bật lùi 14 | hit-stop medium 80, rung 4 | "SHK!" |
| 5 Dư âm | 520–1150 | về | khói xám chảy xuống mục tiêu → `st_def_down` | co | — | leng keng |

## 4. Bóc lớp
| Lớp | Thành phần | Asset | Chuyển động | ms |
|---|---|---|---|---|
| L1 | 2 vết vuốt | `fx_claw` ×2 (tô $glow, cái 2 `flip`, size 1,1 / 0,8) | `strip` 420, 520 | 420–750 |
| L2 | móng sáng; vệt lao | — | `glow $color` 0–260; `trail` 260–420 | 0–420 |
| L3 | mảnh giáp; khói xuống | `fxs_metal_bit`, `fx_debuff_sink` | `burst metal_spray` 520; `strip fx_debuff_sink` 700 | 520–1100 |
| L4 | hit-stop ×2 | — | `stop light` 420, `stop medium` 520; `shake 4`; `move knock x 14` | 420–800 |
L1 đạt 2/3: biến hình (vuốt khung, chữ X ghép) · vận tốc (hai hướng vung).

## 5. Asset
`fx_debuff_sink` **mới**; còn lại có.

## 6. Các bước dựng
B1 nhịp `{ release 260, impact 520, end 1150 }` · B2 sáng móng, lao, vung ×2, về · B3 vuốt ×2 · B4 mảnh, khói · B5 hit-stop ×2 · B6 âm · B7 capture.

## 7. Nghiệm thu
Capture: khung ~560 thấy **hai vết chéo** thành chữ X.
