# Kịch bản: Vỏ Cây Cứng (`skill_e_bark_skin`) — quái

```json scenario
{
  "id": "skill_e_bark_skin", "kind": "skill", "name": "Vỏ Cây Cứng", "element": "SUPPORT", "tier": 0, "durationMs": 1150,
  "status": "draft", "refs": [], "bibles": ["actions/buff-and-heal", "elements/NATURE"],
  "assets": [
    { "id": "fxp_stone_plate", "state": "have", "layer": "L1" },
    { "id": "fx_shield_form", "state": "new", "layer": "L1", "spec": "Xem scenarios/ASSETS.md (tô xanh rêu)" },
    { "id": "fxs_leaf", "state": "have", "layer": "L3" }
  ],
  "engine": []
}
```

## 1. Ý tưởng
Quái **gồng mình** (lách cách), **năm mảng vỏ cây** bay ốp vào thân lần lượt, **lá nhỏ mọc** ở kẽ; khóa "THOCK", khiên rêu. Cảm giác: chắc, thô mộc. Thủ + khiên 15 %, T0. Heo Rừng Gai.

## 2. Hiện tại
`fx_shield_dome` + vật. Audit: `STATIC_SHARE`, `SHARED_FLIPBOOK_HERO`.

## 3. Kịch bản theo nhịp
| # | ms | Quái | Hiệu ứng chính | Âm thanh |
|---|---|---|---|---|
| 1 Gồng | 0–250 | gồng (squash 0,94) | — | "crk" |
| 2 Ốp vỏ | 250–750 | giật nhẹ mỗi mảng | 5 mảng vỏ (phiến đá tô nâu xanh) **bay vòng ốp vào** thân (stagger 90), lá **mọc** ở kẽ sau mỗi mảng | "crk-crk" ×5 |
| 3 Khóa | 750 | bật thẳng | khiên rêu **ghép kín** | "THOCK" |
| 4 Dư âm | 750–1150 | idle | vỏ mờ thành viền; `st_def_up`, `st_shield` | — |

## 4. Bóc lớp
| Lớp | Thành phần | Asset | Chuyển động | ms |
|---|---|---|---|---|
| L1 | mảng vỏ; khiên | `fxp_stone_plate` ×5 (tint `#6a7a40`, 0,25), `fx_shield_form` (rêu) | `prop orbit` → `grow` vào thân outBack stagger 90; `strip fx_shield_form` 750 | 250–1000 |
| L3 | lá mọc | `fxs_leaf` | `burst leaf_pop` nhỏ ×5 stagger 90 | 300–800 |
| L4 | giật; bật | — | `move squash 0.97` ×5; `puff_up 1.05` 750 (không rung) | 250–900 |
L1 đạt 2/3: biến hình (khiên ghép) · vận tốc (ốp overshoot) · phụ sinh (lá).

## 5. Asset
`fx_shield_form` **mới**.

## 6. Các bước dựng
B1 nhịp (giữ) · B2 gồng / giật / bật · B3 vỏ ốp → khiên · B4 lá · B5 không rung · B6 âm · B7 capture.

## 7. Nghiệm thu
Audit hết `SHARED_FLIPBOOK_HERO`; capture: khung ~500 có mảng đã ốp + mảng đang bay.
