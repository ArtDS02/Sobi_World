# Kịch bản trạng thái: Bất khuất (`autoRevive`)

```json scenario
{
  "id": "autoRevive", "kind": "status", "name": "Bất khuất", "element": "NONE", "tier": 0, "durationMs": 600,
  "status": "draft", "refs": [], "bibles": ["actions/status", "actions/idle-and-states"],
  "assets": [
    { "id": "fxs_heart", "state": "have", "layer": "L1" },
    { "id": "fx_star_bloom", "state": "new", "layer": "L3", "spec": "Xem scenarios/ASSETS.md (vàng ấm)" },
    { "id": "fxs_feather", "state": "have", "layer": "L3" }
  ],
  "engine": []
}
```

## 1. Ý tưởng
**Nút sáng vàng thắt quanh ngực**, tim **đập hai nhịp**; khi còn hiệu lực một **trái tim vàng nhỏ** lơ lửng cạnh ngực, **đập** mỗi 2 s; khi gục: kích hoạt `actions.revive` (cột sáng, đứng dậy). Cảm giác: lời hứa, ấm.

## 2. Hiện tại
apply: tim + phồng; layers orbit sao; expire: poof + decal + tim. Layer là **sao** quay (giống nhiều trạng thái khác) — không gợi "bất khuất".

## 3. Kịch bản theo nhịp
| Pha | ms | Thân | Hiệu ứng | Âm thanh |
|---|---|---|---|---|
| Dính | 0–600 | ưỡn ngực | dải sáng **quấn** quanh ngực → nút sáng (sao nở nhỏ); tim **đập ×2** | "thump-thump" |
| Duy trì | mỗi 2 s | — | tim vàng nhỏ cạnh ngực **đập** (pulse) | không |
| Kích hoạt | — | xem `actions.revive` | tim **vỡ thành lông vàng** bay lên | chuông vàng |
| Hết (không dùng) | 300 | — | tim mờ dần | — |

## 4. Bóc lớp
| Lớp | Thành phần | Asset | Chuyển động |
|---|---|---|---|
| L1 | tim cạnh ngực | `fxs_heart` (vàng, 0,25) | layer: **thay** `orbit star` bằng `hover` + `pulse amp 0.2 freq 0.5` |
| L2 | dải quấn ngực | ribbon code | apply `ribbon` ngắn quanh `chest` 0–400 |
| L3 | nút sao; lông vàng | `fx_star_bloom` (0,4), `fxs_feather` | apply `strip` 400; kích hoạt `burst feather_rise` vàng |
| L4 | ưỡn | — | `move puff_up 1.05` |

## 5. Asset
`fx_star_bloom` **mới**.

## 6. Các bước dựng
B1 apply ≤ 600 · B2 ưỡn · B3 tim hover đập · B4 dải, nút, lông · B5 không rung · B6 âm · B7 capture (apply / loop / kích hoạt).

## 7. Nghiệm thu
Capture loop: tim **to / nhỏ** khác nhau giữa 2 khung (đập); không còn sao quay giống `stun`.
