# Kịch bản hành động: Được hồi máu (`heal`)

```json scenario
{
  "id": "heal", "kind": "action", "name": "Được hồi máu", "element": "NONE", "tier": 0, "durationMs": 600,
  "status": "draft", "refs": [], "bibles": ["actions/buff-and-heal"],
  "assets": [
    { "id": "fx_heal_bloom", "state": "new", "layer": "L1", "spec": "Xem scenarios/ASSETS.md" },
    { "id": "fxs_plus", "state": "have", "layer": "L3" },
    { "id": "fxs_star", "state": "have", "layer": "L3" }
  ],
  "engine": []
}
```

## 1. Ý tưởng
**Ấm áp**: nhún 10 px, **ngửa mặt** lên, viền xanh lá, **má hồng**; **ba dấu cộng lớn** bay lên lệch nhịp + vòng sáng ở chân. Lớp **chung** khi máu được hồi (vật phẩm, regen…). Quyết định ANIM-123 (bible buff-and-heal §5): skill hồi máu đã có hình riêng thì **không** chồng lớp này.

## 2. Hiện tại
cộng bay + cộng pop + sao + vòng xanh (`decal ring`). Đạt; chồng lên hình riêng của skill hồi máu (ANIM-123).

## 3. Kịch bản theo nhịp
| # | ms | Thân | Hiệu ứng | Âm thanh |
|---|---|---|---|---|
| 1 Nhận | 0–300 | nhún 10, ngửa 5°, sáng 1,25, viền xanh | **vòng hồi nở** ở chân; 3 cộng lớn bay lên lệch 80 | "plink" |
| 2 Lấp lánh | 300–600 | về | 8 cộng nhỏ + 4 sao trắng | — |

## 4. Bóc lớp
| Lớp | Thành phần | Asset | Chuyển động |
|---|---|---|---|
| L1 | vòng hồi | `fx_heal_bloom` | thay `decal ring` |
| L2 | viền xanh / sáng thân | — | `glow #7ee08a` 300 |
| L3 | cộng; sao | `fxs_plus`, `fxs_star` | giữ |
| L4 | nhún, ngửa | — | `move hop y 10` + `tilt -5` |

## 5. Asset
`fx_heal_bloom` **mới**.

## 6. Các bước dựng
B1 600 · B2 nhún / ngửa · B3 vòng hồi · B4 cộng, sao · B5 không rung · B6 âm · B7 capture; engine: bỏ lớp chung khi skill có `plus_*` / `heal_*` (ANIM-123).

## 7. Nghiệm thu
Skill hồi máu có hình riêng không còn hai lớp hồi chồng nhau (ANIM-123 đóng).
