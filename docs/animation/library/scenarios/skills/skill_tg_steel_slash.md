# Kịch bản: Chém Thép (`skill_tg_steel_slash`)

```json scenario
{
  "id": "skill_tg_steel_slash", "kind": "skill", "name": "Chém Thép", "element": "METAL", "tier": 3, "durationMs": 1150,
  "status": "draft", "refs": [], "bibles": ["elements/METAL", "actions/melee-and-hit"],
  "assets": [
    { "id": "fxp_steel_blade", "state": "have", "layer": "L2" },
    { "id": "fx_slash_long", "state": "new", "layer": "L1", "spec": "Xem scenarios/ASSETS.md" },
    { "id": "fx_metal_spark", "state": "new", "layer": "L3", "spec": "Xem scenarios/ASSETS.md" },
    { "id": "fxs_spark", "state": "have", "layer": "L3" }
  ],
  "engine": []
}
```

## 1. Ý tưởng
Kiểu "iaido": heo **đứng yên tụ lực** (một tia sáng chạy dọc lưỡi), **lướt xuyên qua** mục tiêu nhanh như chớp, **vệt chém mở rồi khép** — mục tiêu **đứng im**; tra kiếm "cạch" → **lúc đó** mục tiêu mới bật lùi. Cảm giác: chính xác, chờ lâu – ra đòn cực nhanh (≥ 3:1). T3 (power 1,4).

## 2. Hiện tại
`fxp_steel_blade pop` + `dash_through` + `fx_slash_arc` 4 khung chung, hit-stop 140 (vượt rubric 100). Audit: `STATIC_HERO`, `STATIC_SHARE`, `DURATION_UNDER` (960). Pha tụ chỉ 260 ms — mất cá tính Kim.

## 3. Kịch bản theo nhịp
| # | ms | Heo | Hiệu ứng chính | Mục tiêu | Màn hình | Âm thanh |
|---|---|---|---|---|---|---|
| 1 Tụ | 0–400 | pose `attack`, nhún thấp, **đứng yên** | lưỡi kiếm hiện bên hông, **tia sáng chạy dọc lưỡi** | — | — | "shing" rút kiếm |
| 2 Lướt | 400–480 | dash xuyên qua tới sau mục tiêu, 3 bóng mờ | — | — | — | vút |
| 3 Vệt | 480 | đứng sau lưng, quay lưng | **vệt chém dài mở** ngang qua mục tiêu | **đứng im** | hit-stop medium 100 (mục tiêu đứng im) | im |
| 4 Cạch | 700 | tra kiếm | vệt **khép** lại; lóe chữ thập + tia kim văng thẳng | **mới** chớp trắng + bật lùi 24 | chớp trắng 0,15, rung 4, punch 1,03 | "clink" → "slash!" |
| 5 Về | 700–1150 | nhảy về chỗ | tia kim rơi leng keng | — | — | leng keng |

## 4. Bóc lớp
| Lớp | Thành phần | Asset | Chuyển động | ms |
|---|---|---|---|---|
| L1 | vệt chém | `fx_slash_long` | `strip frames [0,3] hold 220` 480 → `frames [4,5]` 700 | 480–800 |
| L2 | lưỡi kiếm + tia dọc lưỡi; bóng mờ | `fxp_steel_blade` | `prop pop` bên hông + `glow #ffffff` chạy (nhấp 2 lần) 0–400; `trail every 30` khi lướt | 0–480 |
| L3 | lóe chữ thập + tia kim; mảnh rơi | `fx_metal_spark`, `fxs_spark` | `strip fx_metal_spark` 700; `burst metal_spray` 700; `burst metal_fall` 800 | 700–1150 |
| L4 | hit-stop; mục tiêu bật **trễ** | — | `stop medium dur 100` 480; `flash #ffffff 0.15`, `shake 4`, `punch 1.03`, `move knock x 24` ở 700 | 480–1000 |
Hình chủ đạo L1 (vệt chém 6 khung mở / khép): biến hình + vận tốc (gắn với cú lướt).

## 5. Asset
`fx_slash_long`, `fx_metal_spark` **mới**; dự phòng `fx_slash_arc` + `burst spark_big`.

## 6. Các bước dựng
B1 nhịp `{ release 400, impact 480, end 1150 }` (số sát thương ở 480 hay 700? → giữ 700 = lúc "cạch", đặt `impact 700`) · B2 tụ đứng yên → lướt → tra kiếm → về; mục tiêu đứng im rồi bật · B3 vệt mở / khép · B4 tia · B5 hit-stop 100 (theo rubric) · B6 âm có khoảng im · B7 capture.

## 7. Nghiệm thu
Audit hết `STATIC_HERO`, `DURATION_UNDER`; capture: khung ~300 heo **đứng yên** có tia dọc lưỡi; khung ~550 heo **sau lưng** mục tiêu, mục tiêu chưa lùi; khung ~780 mục tiêu lùi.
