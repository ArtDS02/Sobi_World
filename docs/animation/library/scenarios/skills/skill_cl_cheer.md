# Kịch bản: Cổ Vũ (`skill_cl_cheer`) — lớp Hỗ Trợ

```json scenario
{
  "id": "skill_cl_cheer", "kind": "skill", "name": "Cổ Vũ", "element": "SUPPORT", "tier": 0, "durationMs": 1050,
  "status": "draft", "refs": [], "bibles": ["actions/buff-and-heal"],
  "assets": [
    { "id": "fxs_star", "state": "have", "layer": "L1" },
    { "id": "fx_buff_rise", "state": "new", "layer": "L3", "spec": "Xem scenarios/ASSETS.md (tô đỏ cam)" },
    { "id": "fxs_heart", "state": "have", "layer": "L3" },
    { "id": "fxs_petal", "state": "have", "layer": "L3" }
  ],
  "engine": []
}
```

## 1. Ý tưởng
**Nhảy cổ vũ** hai cái với **pom-pom sao** hai bên; **ba ngôi sao to** bay vồng sang bạn; bạn **nảy theo nhịp** hai lần, tim bay, **pháo giấy** nhiều màu. Cảm giác: vui nhộn, sân vận động. Công + Công phép, T0.

## 2. Hiện tại
`fxs_star` bay. Audit: `STATIC_HERO`, `STATIC_SHARE`.

## 3. Kịch bản theo nhịp
| # | ms | Heo / bạn | Hiệu ứng chính | Âm thanh |
|---|---|---|---|---|
| 1 Nhảy | 0–350 | **nhảy 2 cái**, vung tay | 2 chùm sao nhiều màu **bung** hai bên mỗi nhịp (pom-pom) | "yay! yay!" |
| 2 Ném sao | 350–650 | vung về phía bạn | 3 sao to **bay vồng lệch nhịp** (80), **xoay** | vút |
| 3 Nảy | 650 | bạn **nảy 2 lần** theo nhịp | 4 tim bay; cột sáng đỏ cam mảnh | kèn nhỏ |
| 4 Pháo giấy | 650–1050 | idle vẫy | 12 cánh giấy nhiều màu **rơi lả tả** | — |

## 4. Bóc lớp
| Lớp | Thành phần | Asset | Chuyển động | ms |
|---|---|---|---|---|
| L1 | 3 sao to | `fxs_star` (0,35) | `prop throw` arc 60 + `spin 2` + `stretch` stagger 80 | 350–700 |
| L3 | pom-pom; tim; cột buff; pháo giấy | `fxs_star`, `fxs_heart`, `fx_buff_rise`, `fxs_petal` (tô nhiều màu) | `burst star_spray` hai bên ×2 (0, 180); `burst heart_pop` 650; `strip fx_buff_rise` 680; `burst petal_fall` nhiều màu 700 | 0–1050 |
| L4 | nhảy; bạn nảy | — | `move hop` ×2 actor; `move bounce n 2` bạn (không rung) | 0–950 |
L1 đạt 2/3: vận tốc (xoay, vồng) · phụ sinh (pom-pom, pháo giấy). Vật nhỏ, nhịp vui là chính.

## 5. Asset
`fx_buff_rise` **mới**.

## 6. Các bước dựng
B1 nhịp (giữ) · B2 nhảy ×2, vung; bạn nảy ×2 · B3 sao · B4 pom-pom, tim, cột, pháo giấy · B5 không rung · B6 âm · B7 capture.

## 7. Nghiệm thu
Capture: khung ~100 và ~280 heo ở **độ cao khác nhau** (đang nhảy); khung ~800 pháo giấy nhiều màu.
