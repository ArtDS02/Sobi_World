# Kịch bản: Vuốt Thép (`skill_e_metal_claw`) — quái Bọ Giáp Thép

```json scenario
{
  "id": "skill_e_metal_claw", "kind": "skill", "name": "Vuốt Thép", "element": "METAL", "tier": 3, "durationMs": 1100,
  "status": "draft", "refs": [], "bibles": ["elements/METAL", "actions/melee-and-hit"],
  "assets": [
    { "id": "fx_claw", "state": "have", "layer": "L1" },
    { "id": "fx_slash_long", "state": "new", "layer": "L1", "spec": "Xem scenarios/ASSETS.md (nhát 3)" },
    { "id": "fx_metal_spark", "state": "new", "layer": "L3", "spec": "Xem scenarios/ASSETS.md" },
    { "id": "fx_debuff_sink", "state": "new", "layer": "L3", "spec": "Xem scenarios/ASSETS.md" }
  ],
  "engine": []
}
```

## 1. Ý tưởng
Bọ **giơ càng sắc** (lóe bạc), lao tới, **ba nhát vuốt** liên tiếp — nhanh, nhanh, **MẠNH** — nhát cuối **tóe tia lửa hình sao**. Cảm giác: kim loại cào, "skrt-skrt-SKRT". T3 (power 1,4), 30 % Giảm thủ.

## 2. Hiện tại
`fx_claw` + spark, 960 ms. Audit: `FEW_LAYERS`, `DURATION_UNDER`.

## 3. Kịch bản theo nhịp
| # | ms | Bọ | Hiệu ứng chính | Mục tiêu | Màn hình | Âm thanh |
|---|---|---|---|---|---|---|
| 1 Giơ càng | 0–300 | pose `attack`, giơ càng, **đứng yên** | tia sáng chạy dọc càng | — | — | "kchk" |
| 2 Lao | 300–420 | lao | vệt bạc | — | — | vút |
| 3 Vuốt ×3 | 420 / 500 / 620 | vung trái – phải – **bổ chéo** | vuốt bạc ×2 → nhát 3 **vệt chém dài** + lóe chữ thập + tia kim | giật ×2 → bật lùi | hit-stop light 40 ×2, medium 90; rung 4 | "skrt-skrt-SKRT" |
| 4 Dư âm | 620–1100 | về | mảnh kim rơi; khói xám xuống → `st_def_down` | co | — | leng keng |

## 4. Bóc lớp
| Lớp | Thành phần | Asset | Chuyển động | ms |
|---|---|---|---|---|
| L1 | 2 vuốt; vệt chém | `fx_claw` (bạc, `flip` xen), `fx_slash_long` | `strip` 420, 500; `strip fx_slash_long` 620 | 420–850 |
| L2 | tia dọc càng; vệt lao | — | `glow #ffffff` nhấp 0–300; `trail` 300–420 | 0–420 |
| L3 | lóe + tia kim; khói | `fx_metal_spark`, `fx_debuff_sink` | `strip fx_metal_spark` 620; `burst metal_spray` 620; `strip fx_debuff_sink` 800 | 620–1100 |
| L4 | hit-stop tăng | — | `stop light/light/medium`; `shake 4`; `move knock x 16` 620 | 420–850 |
L1 đạt 2/3: biến hình (vuốt / chém khung) · vận tốc (ba hướng vung) · phụ sinh (tia).

## 5. Asset
`fx_slash_long`, `fx_metal_spark`, `fx_debuff_sink` **mới**.

## 6. Các bước dựng
B1 nhịp `{ release 300, impact 620, end 1100 }` · B2 giơ – lao – vung ×3 – về · B3 vuốt, chém · B4 tia, khói · B5 hit-stop tăng · B6 âm · B7 capture.

## 7. Nghiệm thu
Audit hết `FEW_LAYERS`, `DURATION_UNDER`; capture: ba khung impact có hướng vết khác nhau; nhát 3 dài nhất.
