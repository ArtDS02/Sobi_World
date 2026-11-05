# Kịch bản: Đòn Hiểm (`skill_cl_vital`) — lớp Chiến Binh

```json scenario
{
  "id": "skill_cl_vital", "kind": "skill", "name": "Đòn Hiểm", "element": "SELF", "tier": 2, "durationMs": 1050,
  "status": "draft", "refs": [], "bibles": ["actions/melee-and-hit"],
  "assets": [
    { "id": "fxp_crosshair", "state": "have", "layer": "L2" },
    { "id": "fx_hit_burst", "state": "new", "layer": "L1", "spec": "Xem scenarios/ASSETS.md (tô trắng)" },
    { "id": "fxs_spark", "state": "have", "layer": "L3" }
  ],
  "engine": []
}
```

## 1. Ý tưởng
**Tâm ngắm đỏ nhỏ** hiện trên một điểm của mục tiêu, **lắc rồi khóa**; **lao thẳng cực nhanh** (120 ms), một nhát **chọc chuẩn xác**; **chí mạng** thì cả màn khựng lâu hơn. Cảm giác: chính xác, "tick → TSING!". T2 (power 1,3). Phần chí mạng dùng `actions.crit` chung (không lặp ở skill).

## 2. Hiện tại
`fxp_crosshair` + spark + `fx_pow_star`. Audit: `STATIC_HERO` (tâm ngắm bị coi là hình chủ đạo), `STATIC_SHARE`.

## 3. Kịch bản theo nhịp
| # | ms | Heo | Hiệu ứng chính | Mục tiêu | Màn hình | Âm thanh |
|---|---|---|---|---|---|---|
| 1 Khóa | 0–300 | pose `attack`, nheo mắt | tâm ngắm nhỏ **lắc** trên ngực mục tiêu rồi **khóa** đỏ | — | — | "tick" |
| 2 Chọc | 300–420 | lao thẳng 120 ms, kéo giãn mạnh | — | — | — | vút |
| 3 Trúng | 420 | dừng phắt | tia sáng trắng nhọn + va chạm trắng tại **đúng điểm tâm** | bật lùi 16 | hit-stop medium 70, rung 3 (chí mạng: `actions.crit` thêm) | "TSING!" |
| 4 Về | 420–1050 | về | tâm ngắm vỡ | — | — | — |

## 4. Bóc lớp
| Lớp | Thành phần | Asset | Chuyển động | ms |
|---|---|---|---|---|
| L1 | va chạm nhọn | `fx_hit_burst` (trắng, 0,7) | `strip` 420 tại `chest` | 420–600 |
| L2 | tâm ngắm | `fxp_crosshair` (0,25) | `prop pop` + `wobble rot 8 freq 6` 0–250 → khóa (co 0,8 + `glow #ff4a4a`) 250–300 → alpha 420–550 | 0–550 |
| L3 | tia trắng | `fxs_spark` | `burst spark_big` 420 | 420–700 |
| L4 | hit-stop; bật lùi | — | `stop medium 70`; `shake 3`; `move knock x 16` | 420–700 |
Hình chủ đạo là cú chọc (thân kéo giãn) + va chạm 6 khung; tâm ngắm là L2.

## 5. Asset
`fx_hit_burst` **mới**.

## 6. Các bước dựng
B1 nhịp (giữ) · B2 nheo, lao, dừng phắt, về · B3 va chạm · B4 tâm ngắm (L2), tia · B5 hit-stop · B6 âm · B7 capture (kèm case `crit`).

## 7. Nghiệm thu
Audit: hero chuyển sang va chạm (không `STATIC_HERO`); capture: khung ~280 tâm ngắm **đỏ, nhỏ**; va chạm trùng vị trí tâm.
