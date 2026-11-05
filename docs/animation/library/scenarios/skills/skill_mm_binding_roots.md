# Kịch bản: Rễ Trói (`skill_mm_binding_roots`)

```json scenario
{
  "id": "skill_mm_binding_roots", "kind": "skill", "name": "Rễ Trói", "element": "NATURE", "tier": 1, "durationMs": 1400,
  "status": "draft", "refs": [], "bibles": ["elements/NATURE"],
  "assets": [
    { "id": "fx_crack_spread", "state": "new", "layer": "L1", "spec": "Xem scenarios/ASSETS.md (tô nâu xanh, đường rễ ngầm)" },
    { "id": "fx_vine_grow", "state": "new", "layer": "L1", "spec": "Xem scenarios/ASSETS.md (đặt đứng quanh chân, size 0,6)" },
    { "id": "fx_vine_grab", "state": "have", "layer": "L1" },
    { "id": "fxs_leaf", "state": "have", "layer": "L3" }
  ],
  "engine": []
}
```

## 1. Ý tưởng
Heo **dậm**, **đường rễ ngầm chạy** dưới đất sang phe địch (đất gồ lên theo đường); **rễ trồi lên từng đoạn** dưới chân từng quái, **quấn chân rồi siết**; quái **lắc người mà không nhích được**. Cảm giác: chắc, dai, "shrrk → squeak". T1 diện rộng: Giảm né + Chậm.

## 2. Hiện tại
Decal + `fx_vine_grab` 4 khung cùng lúc + rung thân. Audit: dư âm đã thêm. Rễ hiện nguyên trong 1 nhịp, không chạy ngầm.

## 3. Kịch bản theo nhịp
| # | ms | Heo | Hiệu ứng chính | Quái | Màn hình | Âm thanh |
|---|---|---|---|---|---|---|
| 1 Dậm | 0–360 | pose `cast`, dậm | **đường rễ ngầm chạy** sang phe địch, đất gồ theo đường, lá vụn bắn lên | — | — | "shrrk" chạy |
| 2 Trồi | 360–700 | giữ | rễ **trồi từng đoạn** dưới từng quái (stagger 110), **quấn vòng** chân | giật mình | — | "rrk" |
| 3 Siết | 900 | — | rễ **siết lại** (cuộn chặt) | **lắc người** không nhích | hit-stop light 50, rung 3 | "squeak" |
| 4 Dư âm | 900–1400 | idle | rễ còn quấn mờ dần, lá rơi lả tả; `st_eva_down`, `st_spd_down` | — | — | xào xạc |

## 4. Bóc lớp
| Lớp | Thành phần | Asset | Chuyển động | ms |
|---|---|---|---|---|
| L1 | rễ ngầm; rễ trồi quấn | `fx_crack_spread` (nâu xanh), `fx_vine_grow` (K1–K6 mọc, K7 siết) | `strip fx_crack_spread under` 0–360; `strip fx_vine_grow frames [0,5]` per target stagger 110 → `frames [6,7] hold 400` 900 → alpha 1300 | 0–1400 |
| L2 | — | — | — | — |
| L3 | lá vụn khi chạy; lá rơi | `fxs_leaf` | `burst leaf_spray` dọc đường 100–300; `burst leaf_fall` 1100 | 100–1400 |
| L4 | quái lắc; hit-stop | — | `move shake x 4 n 6` targets 900; `stop light`; `shake 3` | 900–1300 |
L1 đạt 3/3: biến hình (rễ lan, mọc, siết khung) · phụ sinh (lá vụn) · vận tốc / hướng (rễ chạy).

## 5. Asset
`fx_crack_spread`, `fx_vine_grow` **mới**; dự phòng `decal crack`, `fx_vine_grab`.

## 6. Các bước dựng
B1 nhịp `{ release 360, impact 900, end 1400 }` · B2 dậm; quái lắc · B3 rễ ngầm → trồi → siết · B4 lá · B5 hit-stop light (rung 4 → 3) · B6 âm · B7 capture.

## 7. Nghiệm thu
Capture: khung ~200 đường rễ **mới đi một nửa**; rễ dưới 3 quái ở 3 độ cao khác nhau ở khung ~600; khung `900+80` rễ **chặt hơn**.
