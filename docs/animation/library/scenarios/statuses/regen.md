# Kịch bản trạng thái: Hồi phục (`regen`)

```json scenario
{
  "id": "regen", "kind": "status", "name": "Hồi phục", "element": "NONE", "tier": 0, "durationMs": 500,
  "status": "draft", "refs": [], "bibles": ["actions/status", "actions/buff-and-heal", "elements/NATURE"],
  "assets": [
    { "id": "fx_bloom_open", "state": "new", "layer": "L1", "spec": "Xem scenarios/ASSETS.md (xanh lá nhạt, K1–K3: chồi nhú, nhỏ 0,4)" },
    { "id": "fx_heal_bloom", "state": "new", "layer": "L3", "spec": "Xem scenarios/ASSETS.md (nhỏ 0,6, mỗi đầu lượt)" },
    { "id": "fxs_leaf", "state": "have", "layer": "L3" },
    { "id": "fxs_plus", "state": "have", "layer": "L3" }
  ],
  "engine": []
}
```

## 1. Ý tưởng
**Chồi non nhú** cạnh chân (như `skill_mm_sprout` bản nhỏ); khi còn hiệu lực chồi **lắc lư**, thỉnh thoảng một lá bay lên; **đầu mỗi lượt** chồi **nở** một vòng hồi nhỏ + 3 lá + 3 dấu cộng. Cảm giác: chăm sóc đều đặn, dịu.

## 2. Hiện tại
apply: lá bay lên; loop 1200: cộng + lá; expire: poof + decal + khói. Không có "chồi" (hình riêng), loop dày (1,2 s).

## 3. Kịch bản theo nhịp
| Pha | ms | Thân | Hiệu ứng | Âm thanh |
|---|---|---|---|---|
| Dính | 0–500 | nhún | **chồi nhú** cạnh chân (K1→K3) | "pop" |
| Duy trì | mỗi 2,4 s | — | chồi lắc lư (strip K3 hold), 1 lá bay lên | không |
| Đầu lượt (hồi) | ≤ 400 | nhún nhẹ | vòng hồi nhỏ + 3 lá + 3 cộng | "plink" |
| Hết | 300–450 | — | chồi **héo nhẹ** chui xuống đất, lá rơi | — |

## 4. Bóc lớp
| Lớp | Thành phần | Asset | Chuyển động |
|---|---|---|---|
| L1 | chồi | `fx_bloom_open` K1–K3 (0,4) | apply `frames [0,2]`; giữ khung 3 làm `cover`/layer lệch x +24 |
| L3 | lá; cộng; vòng hồi | `fxs_leaf`, `fxs_plus`, `fx_heal_bloom` | loop `burst leaf_rise more 0.2` mỗi 2,4 s; `actions.regen`: `strip fx_heal_bloom` + `burst plus_rise` |
| L4 | nhún | — | `move hop` nhỏ |

## 5. Asset
`fx_bloom_open`, `fx_heal_bloom` **mới**.

## 6. Các bước dựng
B1 apply ≤ 500, loop 2,4 s · B2 nhún · B3 chồi · B4 lá, cộng, vòng hồi ở `actions.regen` · B5 không rung · B6 âm · B7 capture.

## 7. Nghiệm thu
Capture loop: thấy **chồi** cạnh chân (hình riêng, không chỉ hạt); khác `poison` hoàn toàn về màu và hướng.
