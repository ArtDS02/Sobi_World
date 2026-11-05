# Kịch bản hành động: Hồi sinh / Bất khuất (`revive`)

```json scenario
{
  "id": "revive", "kind": "action", "name": "Hồi sinh", "element": "NONE", "tier": 0, "durationMs": 900,
  "status": "draft", "refs": [], "bibles": ["actions/idle-and-states", "elements/LIGHT"],
  "assets": [
    { "id": "fx_light_pillar", "state": "have", "layer": "L1" },
    { "id": "fx_star_bloom", "state": "new", "layer": "L3", "spec": "Xem scenarios/ASSETS.md (vàng)" },
    { "id": "fxs_heart", "state": "have", "layer": "L3" }
  ],
  "engine": []
}
```

## 1. Ý tưởng
Từ dáng ngồi bệt, **cột sáng từ trên** chiếu xuống, con **bật dậy** (0,9 → 1,1 → 1,0), **hết xám**, **phủi bụi**, nảy hai lần; nút Bất khuất **vỡ thành 10 tim** bay lên. "ta-da".

## 2. Hiện tại
appear + bounce + `fx_light_pillar` + hạt. Đạt cơ bản; thiếu tim vỡ (khi do Bất khuất) và phủi bụi.

## 3. Kịch bản theo nhịp
| # | ms | Thân | Hiệu ứng | Màn hình | Âm thanh |
|---|---|---|---|---|---|
| 1 Cột sáng | 0–300 | vẫn ngồi, sáng dần | cột sáng giáng | chớp vàng 0,15 | hợp âm |
| 2 Bật dậy | 300–600 | bật 0,9 → 1,1 → 1,0, **hết xám** | sao nở vàng; 10 tim bay lên (nếu Bất khuất) | — | "ta-da" |
| 3 Phủi | 600–900 | **phủi bụi** (wiggle), nảy 2 lần | bụi nhỏ bay | — | "phủi" |

## 4. Bóc lớp
| Lớp | Thành phần | Asset | Chuyển động |
|---|---|---|---|
| L1 | cột sáng | `fx_light_pillar` | giữ |
| L3 | sao nở; tim; bụi | `fx_star_bloom`, `fxs_heart` | `strip` 300; `burst heart_rise more 1.5` 320; `burst puff_pop` 650 |
| L4 | bật, phủi, nảy | — | giữ `appear` + `bounce`; thêm `wiggle` |

## 5. Asset
`fx_star_bloom` **mới**.

## 6. Các bước dựng
B1 900 · B2 bật / phủi / nảy · B3 cột · B4 sao, tim, bụi · B5 chớp ≤ 0,15 · B6 âm · B7 capture (case revive).

## 7. Nghiệm thu
Capture: khung ~450 con **to hơn** bình thường (overshoot); khung cuối màu thân trở lại.
